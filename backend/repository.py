from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from models import Pokemon, PokemonDetail
from sqlalchemy.ext.asyncio import AsyncSession

# Insert or update Pokemon records in the database
async def upsert_pokemon(session: AsyncSession, rows: list[dict]):
    if not rows:
        return
    stmt = insert(Pokemon).values(rows).on_conflict_do_update(
        index_elements=["url"],
        set_={"name": insert(Pokemon).excluded.name},
    )
    await session.execute(stmt)

# Retrieve a list of Pokémon entries from the database
async def list_pokemon(session: AsyncSession, limit: int = 50):
    q = select(Pokemon).order_by(Pokemon.id.asc()).limit(limit)
    res = await session.execute(q)
    return res.scalars().all()

# Retrieve a Pokémon entry from the database by name
async def get_pokemon_by_name(session: AsyncSession, name: str):
    res = await session.execute(select(Pokemon).where(Pokemon.name.ilike(name)))
    return res.scalar_one_or_none()

# Retrieve detailed information for a Pokémon by its ID
async def get_detail_by_pid(session: AsyncSession, pokemon_id: int):
    res = await session.execute(select(PokemonDetail).where(PokemonDetail.pokemon_id == pokemon_id))
    return res.scalar_one_or_none()

# Insert or update detailed Pokémon data (upsert)
# Uses 'pokemon_id' as the unique key to avoid duplicates
async def upsert_pokemon_detail(session: AsyncSession, pokemon_id: int, data: dict):
    stmt = insert(PokemonDetail).values({ "pokemon_id": pokemon_id, **data }) \
        .on_conflict_do_update(
            index_elements=["pokemon_id"],
            set_={
                "types": insert(PokemonDetail).excluded.types,
                "abilities": insert(PokemonDetail).excluded.abilities,
                "base_experience": insert(PokemonDetail).excluded.base_experience,
                "height_dm": insert(PokemonDetail).excluded.height_dm,
                "weight_hg": insert(PokemonDetail).excluded.weight_hg,
                "sprite_url": insert(PokemonDetail).excluded.sprite_url,
            }
        )
    await session.execute(stmt)
