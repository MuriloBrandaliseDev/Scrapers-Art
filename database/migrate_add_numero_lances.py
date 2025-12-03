#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migração: Adiciona coluna numero_lances à tabela obras
"""

import sqlite3
from pathlib import Path

# Caminho do banco de dados
DB_DIR = Path(__file__).parent
DB_PATH = DB_DIR / "scrapers.db"

def migrate():
    """Adiciona a coluna numero_lances se não existir"""
    if not DB_PATH.exists():
        print("[ERRO] Banco de dados nao encontrado. Execute o script de extracao primeiro.")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(obras)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'numero_lances' in columns:
            print("[OK] Coluna 'numero_lances' ja existe. Nenhuma migracao necessaria.")
        else:
            # Adicionar coluna
            print("[INFO] Adicionando coluna 'numero_lances'...")
            cursor.execute("ALTER TABLE obras ADD COLUMN numero_lances INTEGER DEFAULT 0")
            conn.commit()
            print("[OK] Coluna 'numero_lances' adicionada com sucesso!")
            
            # Atualizar valores existentes para 0 se necessário
            cursor.execute("UPDATE obras SET numero_lances = 0 WHERE numero_lances IS NULL")
            conn.commit()
            print("[OK] Valores existentes atualizados.")
    
    except Exception as e:
        print(f"[ERRO] Erro na migracao: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

