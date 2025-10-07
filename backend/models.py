from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from db import Base

# Define the ORM model for the 'pokemon' table
# Includes an auto-incrementing primary key, name, and URL fields
# Accepts only unique urls
class Pokemon(Base):
    __tablename__ = "pokemon"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(300), unique=True ,nullable=False)

# Define the ORM model for the 'pokemon_detail' table
class PokemonDetail(Base):
    __tablename__ = "pokemon_detail"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pokemon_id: Mapped[int] = mapped_column(ForeignKey("pokemon.id", ondelete="CASCADE"), unique=True, nullable=False)
    types: Mapped[str | None] = mapped_column(String(200))
    abilities: Mapped[str | None] = mapped_column(String(300))
    base_experience: Mapped[int | None] = mapped_column(Integer)
    height_dm: Mapped[int | None] = mapped_column(Integer)  
    weight_hg: Mapped[int | None] = mapped_column(Integer)  
    sprite_url: Mapped[str | None] = mapped_column(String(300))