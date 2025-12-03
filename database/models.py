#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Modelos de banco de dados para armazenar resultados dos scrapers
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class ScrapingSession(Base):
    """Sessão de scraping - armazena informações sobre cada execução"""
    __tablename__ = 'scraping_sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    scraper_name = Column(String(50), nullable=False, index=True)  # 'iarremate' ou 'leiloes_br'
    status = Column(String(20), nullable=False, default='executando')  # executando, concluido, erro
    total_obras = Column(Integer, default=0)
    paginas_processadas = Column(Integer, default=0)
    inicio = Column(DateTime, default=datetime.utcnow, nullable=False)
    fim = Column(DateTime, nullable=True)
    arquivo_saida = Column(String(255), nullable=True)
    erro = Column(Text, nullable=True)
    categorias = Column(String(255), nullable=True)  # JSON string para múltiplas categorias
    
    __table_args__ = (
        Index('idx_scraper_status', 'scraper_name', 'status'),
        Index('idx_inicio', 'inicio'),
    )


class Obra(Base):
    """Obra coletada - armazena dados de cada obra/quadro/escultura"""
    __tablename__ = 'obras'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, nullable=False, index=True)  # FK para scraping_sessions
    scraper_name = Column(String(50), nullable=False, index=True)
    categoria = Column(String(50), nullable=True, index=True)
    
    # Dados da obra
    nome_artista = Column(String(255), nullable=True, index=True)
    titulo = Column(Text, nullable=True)
    descricao = Column(Text, nullable=True)
    descricao_completa = Column(Text, nullable=True)  # Descrição completa da obra (campo "Inspiração do projeto")
    valor = Column(String(50), nullable=True)
    valor_atualizado = Column(String(50), nullable=True)  # Valor atualizado após leilão
    numero_lances = Column(Integer, nullable=True, default=0)  # Número de lances no leilão
    
    # Dados específicos LeilõesBR e iArremate
    lote = Column(String(50), nullable=True)
    data_leilao = Column(String(50), nullable=True)
    data_inicio_leilao = Column(String(100), nullable=True)  # Data/hora de início do leilão
    leiloeiro = Column(String(255), nullable=True)
    local = Column(String(255), nullable=True)
    info_leilao = Column(Text, nullable=True)  # Informações adicionais do leilão (data, horário, endereço, telefone, email)
    ultima_atualizacao = Column(DateTime, nullable=True)  # Data da última atualização de preço
    
    # URLs
    url = Column(Text, nullable=False, index=True)
    url_original = Column(Text, nullable=True)
    site_redirecionado = Column(String(255), nullable=True)
    
    # Metadados
    pagina = Column(Integer, nullable=True)
    data_coleta = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_session_scraper', 'session_id', 'scraper_name'),
        Index('idx_categoria', 'categoria'),
        Index('idx_artista', 'nome_artista'),
        Index('idx_data_coleta', 'data_coleta'),
        Index('idx_url_scraper', 'url', 'scraper_name'),  # Índice para verificar duplicatas
    )

