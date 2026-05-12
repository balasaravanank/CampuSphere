import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.event import Event
from app.routers.events import _serialize_event

async def main():
    async with async_session_maker() as session:
        result = await session.execute(select(Event).order_by(Event.start_time))
        events = list(result.scalars().all())
        print(f"Found {len(events)} events.")
        for e in events:
            try:
                res = _serialize_event(e, 1)
                print(f"Serialized event {e.id}: {res}")
            except Exception as ex:
                print(f"Error serializing event {e.id}: {ex}")
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
