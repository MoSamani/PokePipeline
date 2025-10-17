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

# Helper function to join object names into a comma-separated string
# Extracts the value of the given key (default: "name") from each dictionary in a list
def _join_names(objs, key="name"):
    return ",".join([o.get(key, "") for o in objs if o.get(key)])

# Fetch detailed Pokémon data from a given PokeAPI URL
# Extracts and normalizes key attributes: types, abilities, base experience, height, weight, and sprite URL
# Returns a dictionary compatible with the 'PokemonDetail' table structure
async def fetch_pokemon_detail_by_url(url: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        r.raise_for_status()
        d = r.json()
        types = _join_names([t["type"] for t in d.get("types", [])])
        abilities = _join_names([a["ability"] for a in d.get("abilities", [])])
        sprite = d.get("sprites", {}).get("front_default")
        return {
            "types": types,
            "abilities": abilities,
            "base_experience": d.get("base_experience"),
            "height_dm": d.get("height"),
            "weight_hg": d.get("weight"),
            "sprite_url": sprite,
        }