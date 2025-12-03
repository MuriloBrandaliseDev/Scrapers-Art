#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Testa se a API está retornando dados corretamente"""

import requests
import json

# Testar endpoint da API
base_url = "http://localhost:8000/api/v1"

print("Testando API...")
print("=" * 60)

# Testar stats
print("\n1. Testando /stats")
try:
    response = requests.get(f"{base_url}/stats", timeout=5)
    if response.status_code == 200:
        stats = response.json()
        print(f"   Total obras: {stats.get('total_obras', 0)}")
        print(f"   Obras por scraper: {stats.get('obras_por_scraper', {})}")
    else:
        print(f"   Erro: Status {response.status_code}")
except Exception as e:
    print(f"   Erro ao conectar: {e}")
    print("   [AVISO] Backend pode nao estar rodando!")

# Testar obras sem filtro
print("\n2. Testando /obras (sem filtro)")
try:
    response = requests.get(f"{base_url}/obras?page=1&per_page=5", timeout=5)
    if response.status_code == 200:
        data = response.json()
        obras = data.get('obras', [])
        print(f"   Total retornado: {len(obras)} obras")
        print(f"   Total no banco: {data.get('total', 0)}")
        if obras:
            print(f"   Primeira obra: ID {obras[0].get('id')}, scraper={obras[0].get('scraper_name')}")
    else:
        print(f"   Erro: Status {response.status_code}")
except Exception as e:
    print(f"   Erro: {e}")

# Testar obras com filtro iarremate
print("\n3. Testando /obras?scraper=iarremate")
try:
    response = requests.get(f"{base_url}/obras?page=1&per_page=5&scraper=iarremate", timeout=5)
    if response.status_code == 200:
        data = response.json()
        obras = data.get('obras', [])
        print(f"   Total retornado: {len(obras)} obras")
        print(f"   Total no banco: {data.get('total', 0)}")
        if obras:
            print(f"   Primeira obra: ID {obras[0].get('id')}, scraper={obras[0].get('scraper_name')}")
            print(f"   Titulo: {obras[0].get('titulo', 'N/A')[:60]}")
        else:
            print("   [AVISO] Nenhuma obra retornada!")
    else:
        print(f"   Erro: Status {response.status_code}")
        print(f"   Resposta: {response.text[:200]}")
except Exception as e:
    print(f"   Erro: {e}")

print("\n" + "=" * 60)
print("Teste concluido!")

