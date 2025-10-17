from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import models  
from db import init_db, SessionLocal
from source_client import fetch_pokemon_batch, fetch_pokemon_detail_by_url
from repository import upsert_pokemon, list_pokemon, get_pokemon_by_name, get_detail_by_pid, upsert_pokemon_detail
from sqlalchemy import select
from models import Pokemon

# Create an instance of FastAPI
# Add CORS middleware 
app = FastAPI(title="PokeAPI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Run initialization
@app.on_event("startup")
async def on_startup():
    await init_db()

# Define a health check endpoint
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Define an endpoint to fetch Pokemon data and save it in the database
# Accepts 'limit' and 'offset' for pagination
@app.post("/api/ingest")
async def ingest(limit: int = Query(10, ge=1, le=200), offset: int = Query(0, ge=0)):
    try:
        payload = await fetch_pokemon_batch(limit=limit, offset=offset)
        async with SessionLocal() as session:
            await upsert_pokemon(session, payload)
            await session.commit()
        return {"ingested": len(payload), "limit": limit, "offset": offset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Define an endpoint to retrieve Pokemon entries from the database
# The paramter limit controls the number of results
@app.get("/api/pokemon")
async def get_pokemon(limit: int = Query(10, ge=1, le=500)):
    async with SessionLocal() as session:
        rows = await list_pokemon(session, limit=limit)
        return [{"name": r.name} for r in rows]


# Define an endpoint to retrieve the URL of a specific Pokemon by name
@app.get("/api/pokemon/url")
async def get_pokemon_url(name: str = Query(..., min_length=1)):
    # Suche case-insensitiv
    async with SessionLocal() as session:
        res = await session.execute(
            select(Pokemon).where(Pokemon.name.ilike(name))
        )
        row = res.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Pokémon nicht gefunden")
        return {"name": row.name, "url": row.url}

# Define an endpoint to retrieve detailed information about a specific Pokémon by name
# If details are not found in the local database, they are fetched from the external PokeAPI,
# stored (upserted) in the database, and then returned
# Converts height (from decimetres to metres) and weight (from hectograms to kilograms)
@app.get("/api/pokemon/detail")
async def pokemon_detail(name: str = Query(..., min_length=1)):
    async with SessionLocal() as session:
        p = await get_pokemon_by_name(session, name)
        if not p:
            raise HTTPException(status_code=404, detail="Pokemon not found")

        d = await get_detail_by_pid(session, p.id)
        if not d:
            detail_data = await fetch_pokemon_detail_by_url(p.url)
            await upsert_pokemon_detail(session, p.id, detail_data)
            await session.commit()
            d = await get_detail_by_pid(session, p.id)

        height_m = d.height_dm / 10 if d.height_dm is not None else None
        weight_kg = d.weight_hg / 10 if d.weight_hg is not None else None

        return {
            "name": p.name,
            "types": d.types,
            "abilities": d.abilities,
            "base_experience": d.base_experience,
            "height_m": height_m,
            "weight_kg": weight_kg,
            "sprite_url": d.sprite_url,
        }