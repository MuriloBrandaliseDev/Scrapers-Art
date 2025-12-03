#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para parar um scraping em execução
"""

import requests
import sys

def parar_scraping(session_id):
    """Para um scraping em execução"""
    url = f"http://localhost:8000/api/v1/sessions/{session_id}/stop"
    
    try:
        print(f">>> Parando scraping da sessao {session_id}...")
        
        response = requests.post(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Solicitacao de parada enviada!")
            print(f"   Status: {data.get('status')}")
            print()
            print("Os dados coletados ate agora serao salvos automaticamente.")
        elif response.status_code == 404:
            print(f"[ERRO] Sessao {session_id} nao esta em execucao")
        else:
            print(f"[ERRO] Status: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("[ERRO] Backend nao esta rodando!")
        print("   Execute: python start_api.py")
    except requests.exceptions.Timeout:
        print("[ERRO] Timeout - Backend nao respondeu a tempo")
        print("   O backend pode estar travado. Tente:")
        print("   1. Parar o backend (Ctrl+C)")
        print("   2. Reiniciar: python start_api.py")
    except Exception as e:
        print(f"[ERRO] {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python parar_scraping.py <session_id>")
        print()
        print("Exemplo:")
        print("  python parar_scraping.py 1")
        sys.exit(1)
    
    try:
        session_id = int(sys.argv[1])
        parar_scraping(session_id)
    except ValueError:
        print("[ERRO] session_id deve ser um numero")
        sys.exit(1)

