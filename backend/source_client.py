import httpx

# Base URL of Pkemon API
BASE = "https://pokeapi.co/api/v2/pokemon"

# Fetch Pokemon data from the base API
async def fetch_pokemon_batch(limit: int = 10, offset: int = 0) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(BASE, params={"limit": limit, "offset": offset})
        r.raise_for_status()
        results = r.json().get("results", [])
        return [{"name": obj["name"], "url": obj["url"]} for obj in results]
