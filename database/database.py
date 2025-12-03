#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuração e conexão com banco de dados
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pathlib import Path
import os

from .models import Base

# Caminho do banco de dados
DB_DIR = Path(__file__).parent.parent / "database"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "scrapers.db"

# URL do banco de dados
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Engine e Session
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necessário para SQLite
    echo=False  # Mude para True para ver SQL queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Inicializa o banco de dados criando as tabelas"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Retorna uma sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_sync() -> Session:
    """Retorna uma sessão do banco de dados (síncrono)"""
    return SessionLocal()

