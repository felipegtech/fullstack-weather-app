import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

load_dotenv()

# PostgreSQL set up
DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER')}"
    f":{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST')}:5432"
    f"/{os.getenv('POSTGRES_DB')}"
)

engine = create_async_engine(DATABASE_URL)

# Async_sessionmaker: correct way to create async database sessions
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
# Dependency to yield DB sessions per request
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

