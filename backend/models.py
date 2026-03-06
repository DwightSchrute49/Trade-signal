from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base, engine


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    rsi = Column(Float, nullable=False)
    ema50 = Column(Float, nullable=True)
    ema200 = Column(Float, nullable=True)
    signal = Column(String, nullable=False)  # BUY / SELL / HOLD
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified.")
