from sqlalchemy import String#, UniqueConstraint, Integer, DateTime, func
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

