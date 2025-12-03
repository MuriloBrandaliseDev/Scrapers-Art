#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para verificar obras no banco de dados"""

from database.database import SessionLocal
from database.models import Obra

db = SessionLocal()

try:
    total = db.query(Obra).count()
    print(f"Total de obras no banco: {total}")
    
    if total == 0:
        print("\n[AVISO] Nenhuma obra encontrada no banco!")
        print("Execute o script extrair_obras_especificas.py primeiro.")
    else:
        # Scrapers únicos
        scrapers = db.query(Obra.scraper_name).distinct().all()
        print(f"\nScrapers encontrados: {[s[0] for s in scrapers if s[0]]}")
        
        # Contar por scraper
        iarremate_count = db.query(Obra).filter(Obra.scraper_name == 'iarremate').count()
        leiloes_br_count = db.query(Obra).filter(Obra.scraper_name == 'leiloes_br').count()
        
        print(f"\nObras iarremate: {iarremate_count}")
        print(f"Obras leiloes_br: {leiloes_br_count}")
        
        # Mostrar algumas obras
        print("\n=== Primeiras 5 obras ===")
        obras = db.query(Obra).limit(5).all()
        for obra in obras:
            print(f"ID {obra.id}: scraper={obra.scraper_name}, titulo={obra.titulo[:60] if obra.titulo else 'Sem titulo'}")
        
        # Verificar se há obras com scraper_name diferente
        print("\n=== Verificando valores diferentes de scraper_name ===")
        todos_scrapers = db.query(Obra.scraper_name).distinct().all()
        for scraper_tuple in todos_scrapers:
            scraper = scraper_tuple[0]
            if scraper:
                count = db.query(Obra).filter(Obra.scraper_name == scraper).count()
                print(f"  '{scraper}': {count} obras")
finally:
    db.close()

