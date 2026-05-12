import asyncio
import sys
sys.path.insert(0, '.')
from app.database import async_session_factory
from app.models.event import Event, EventBooking
from sqlalchemy import delete
async def do_it():
  async with async_session_factory() as session:
    await session.execute(delete(EventBooking))
    await session.execute(delete(Event))
    await session.commit()
    print('DELETED EVENTS')
asyncio.run(do_it())
