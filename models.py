from typing import List

from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

# 1. The Base Class
class Base(DeclarativeBase):
    pass

# 2. The User Table
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password_hash:  Mapped[str] = mapped_column(String(100))

    # These relationships allo u to easily fetch a user's history or favorites
    favorites: Mapped[List["Favorite"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    search_history: Mapped[List["SearchHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class SearchHistory(Base):
    __tablename__ = 'search_history'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(User.id))
    city: Mapped[str] = mapped_column(String(50))
    # Automatically generates a timestamp when a record is created
    searched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="search_history")

class Favorite(Base):
    __tablename__ = 'favorites'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(User.id))
    city: Mapped[str] = mapped_column(String(50))

    user: Mapped["User"] = relationship(back_populates="favorites")



