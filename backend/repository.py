from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from models import Pokemon
from sqlalchemy.ext.asyncio import AsyncSession

async def upsert_pokemon(session: AsyncSession, rows: list[dict]):
    if not rows:
        return
    stmt = insert(Pokemon).values(rows).on_conflict_do_update(
        index_elements=["url"],
        set_={"name": insert(Pokemon).excluded.name},
    )
    await session.execute(stmt)

async def list_pokemon(session: AsyncSession, limit: int = 50):
    q = select(Pokemon).order_by(Pokemon.id.asc()).limit(limit)
    res = await session.execute(q)
    return res.scalars().all()

