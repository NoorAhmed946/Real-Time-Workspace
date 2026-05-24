from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

# Async engine requires postgresql+asyncpg:// (not psycopg2)
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
