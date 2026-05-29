"""Real-time chat for circulars using WebSockets."""

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Set

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import async_session_factory, get_db
from app.dependencies.auth import get_current_user
from app.models.circular import Circular, CircularChatMessage
from app.models.user import User
from app.schemas.common import APIResponse
from app.utils.security import decode_token

router = APIRouter(tags=["circular-chat"])


class ConnectionManager:
    def __init__(self):
        # Maps circular_id -> set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, circular_id: int):
        await websocket.accept()
        if circular_id not in self.active_connections:
            self.active_connections[circular_id] = set()
        self.active_connections[circular_id].add(websocket)

    def disconnect(self, websocket: WebSocket, circular_id: int):
        if circular_id in self.active_connections:
            self.active_connections[circular_id].discard(websocket)
            if not self.active_connections[circular_id]:
                del self.active_connections[circular_id]

    async def broadcast(self, message: dict, circular_id: int):
        if circular_id in self.active_connections:
            connections = list(self.active_connections[circular_id])
            for connection in connections:
                try:
                    await connection.send_json(message)
                except RuntimeError:
                    self.disconnect(connection, circular_id)

manager = ConnectionManager()


@router.websocket("/ws/circulars/{circular_id}/chat")
async def websocket_endpoint(websocket: WebSocket, circular_id: int, token: str = Query(...)):
    """WebSocket endpoint for circular discussion."""
    # Authenticate token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=1008, reason="Invalid token")
        return
        
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008, reason="Invalid token payload")
        return

    # Verify user exists and get name/role
    async with async_session_factory() as db:
        user_result = await db.execute(select(User).where(User.id == int(user_id)))
        user = user_result.scalar_one_or_none()
        if not user or not user.is_active:
            await websocket.close(code=1008, reason="User not found")
            return
            
        circular_result = await db.execute(select(Circular).where(Circular.id == circular_id))
        if not circular_result.scalar_one_or_none():
            await websocket.close(code=1008, reason="Circular not found")
            return

    await manager.connect(websocket, circular_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Save message to DB
            async with async_session_factory() as db:
                db_message = CircularChatMessage(
                    circular_id=circular_id,
                    user_id=user.id,
                    content=data
                )
                db.add(db_message)
                await db.commit()
                await db.refresh(db_message)
                
            # Broadcast to all in room
            message_payload = {
                "id": db_message.id,
                "user": user.name,
                "role": user.role.value,
                "text": db_message.content,
                "time": db_message.created_at.replace(tzinfo=timezone.utc).isoformat()
            }
            await manager.broadcast(message_payload, circular_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, circular_id)


@router.get("/circulars/{circular_id}/chat")
async def get_chat_history(
    circular_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chat history for a circular."""
    query = (
        select(CircularChatMessage)
        .where(CircularChatMessage.circular_id == circular_id)
        .options(selectinload(CircularChatMessage.user))
        .order_by(CircularChatMessage.created_at.asc())
    )
    result = await db.execute(query)
    messages = result.scalars().all()
    
    formatted = [
        {
            "id": msg.id,
            "user": msg.user.name,
            "role": msg.user.role.value,
            "text": msg.content,
            "time": msg.created_at.replace(tzinfo=timezone.utc).isoformat()
        }
        for msg in messages
    ]
    return APIResponse.success(data=formatted)
