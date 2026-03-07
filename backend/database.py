import os
import re
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./signals.db"
    print("[WARN] No DATABASE_URL found. Using local SQLite DB (signals.db)")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Strip 'channel_binding' from the URL — SQLAlchemy doesn't parse it correctly
    # as a URL query param; psycopg2 receives sslmode via connect_args instead.
    clean_url = re.sub(r"[?&]channel_binding=[^&]*", "", DATABASE_URL)
    # Ensure the URL starts with postgresql+psycopg2://
    clean_url = clean_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    engine = create_engine(
        clean_url,
        connect_args={"sslmode": "require"},
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
