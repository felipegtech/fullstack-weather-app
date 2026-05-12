from contextlib import asynccontextmanager
from idlelib import query

import jwt
from asyncpg.protocol import record
from fastapi import FastAPI, Depends, HTTPException
import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession, result
from sqlalchemy import select, delete, desc
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.sql.functions import current_user
from starlette import status

from security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from jwt.exceptions import InvalidTokenError, PyJWTError

# Make sure you also add 'User' to my existing models imports
from models import Base, Favorite, SearchHistory, User


# Import from your structured files
from models import Base, SearchHistory, Favorite
from database import engine, get_db

# Create tables on startupp
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)
# Pyndatic models for incoming data validation
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

API_KEY = os.getenv("WEATHER_API_KEY")

@app.post("/register")
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check if the username already exists in PostgreSQL
    query = select(User).where(User.username == user_data.username)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User already exists")

    # 2. Hash the password before saving! Never save plain text.
    hashed_password = get_password_hash(user_data.password)

    # 3. save the new user to the database
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password)
    db.add(new_user)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error al registrar usuario")



@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Look up the user by username
    query = select(User).where(User.username == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    # 2. Verify the user exists AND the password matches the hash
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # 3. Create the JWT token, baking the user's ID inside the "sub" (subject) claim
    access_token = create_access_token(data={"sub": user.id})

    return {"access_token": access_token, "token_type": "bearer"}

#=====================================================
# SECURITY CHECKPOINT
# ====================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="It couldn't validate information",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. Decode the token using your secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 2. Extract the user ID (which we stored in the "sub" claim)
        user_id: int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    # 3. Lool up the user in the database
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if user is None:
        raise credentials_exception

    # 4. Hand the valid user object back to the endpoint
    return user


# async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="It couldn't validate information",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         # 1. Decode the token using your secret key
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#
#         # 2. Extract the user ID (which we stored in the "sub" claim)
#         user_id: str = payload.get("sub")
#         if user_id is None:
#             raise credentials_exception
#     except InvalidTokenError:
#         raise credentials_exception
#
#     # 3. Lool up the user in the database
#     query = select(User).where(User.id == user_id)
#     result = await db.execute(query)
#     user = result.scalars().first()
#
#     if user is None:
#         raise credentials_exception
#
#     # 4. Hand the valid user object back to the endpoint
#     return user


@app.get("/weather/{city}")
async def get_weather(city: str,
                      db: AsyncSession = Depends(get_db),
                      current_user: User = Depends(get_current_user)
                      ):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric&lang=es"

    # Use httpx for non-blocking API calls
    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada o error en la API")

    data = response.json()

    # Save to PostgreSQL
    # NOTE: user_id is hardcoded to 1 until JWT auth is added
    try:
        new_search = SearchHistory(user_id=current_user.id, city=city)
        db.add(new_search)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Dabase error: {e}")

    return {
        "city": city,
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
    }

# Favorite endpoint
@app.post("/favorites/{city}")
async def add_favorite(
        city: str,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    try:
        new_favorite = Favorite(user_id=current_user.id, city=city)
        db.add(new_favorite)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo guardar al favorito")

    return {"message": f"{city} guardado en favoritos!"}


@app.get("/favorites")
async def get_favorites(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    query = select(Favorite).where(Favorite.user.id == current_user.id)
    result = await db.execute(query)
    favorites = result.scalars().all()

    return {"favorites": [{"city": record.city} for record in favorites]}
# Get Search History (Last 20)


@app.delete("/favorites/{city}")
async def remove_favorite(
        city: str,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Delete where the user is 1 AND the city matches the URL parameter
    query = delete(Favorite).where(Favorite.user.id == current_user.id, Favorite.city == city)
    result = await db.execute(query)

    # result.rowcount tells us how many rows were deleted
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada en favoritos")

    # Commit the transaction to save the deletion
    await db.commit()

    return {"message": f"{city} eliminado de favoritos"}


@app.get("/history")
async def get_history(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user) # <--- The Bouncer
):
    # Select searches for user 1, order by newest first, limit to 20
    query = (
        select(SearchHistory)
        .where(SearchHistory.user_id == current_user.id)
        .order_by(desc(SearchHistory.searched_at))
        .limit(20)
    )
    result = await db.execute(query)

    # .scalars().all() extracts the actual Python objects from the database result
    history = result.scalars().all()

    return {"history": [{"city": record.city, "searched_at": record.searched_at} for record in history]}

