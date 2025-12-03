#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para iniciar scraping do iArremate via API
"""

import requests
import json
import sys

def iniciar_iarremate(max_paginas=None, delay=1.0, max_retries=3):
    """Inicia o scraping do iArremate"""
    url = "http://localhost:8000/api/v1/iarremate"
    
    payload = {
        "delay_between_requests": delay,
        "max_retries": max_retries
    }
    
    if max_paginas:
        payload["max_paginas"] = max_paginas
    
    try:
        print(">>> Iniciando scraping do iArremate...")
        print(f"   Configuracao: {json.dumps(payload, indent=2)}")
        print()
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Scraping iniciado com sucesso!")
            print(f"   Session ID: {data.get('session_id')}")
            print(f"   Status URL: http://localhost:8000{data.get('status_url')}")
            print()
            print("Acompanhe o progresso em:")
            print("   - Frontend: http://localhost:3000/iarremate")
            print("   - Sessoes: http://localhost:3000/sessoes")
            print()
            print("Para parar o scraping:")
            print(f"   python parar_scraping.py {data.get('session_id')}")
            return data.get('session_id')
        else:
            print(f"[ERRO] Status: {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.ConnectionError:
        print("[ERRO] Backend nao esta rodando!")
        print("   Execute: python start_api.py")
        return None
    except Exception as e:
        print(f"[ERRO] {e}")
        return None

if __name__ == "__main__":
    # Permitir passar max_paginas como argumento
    max_paginas = None
    if len(sys.argv) > 1:
        try:
            max_paginas = int(sys.argv[1])
        except ValueError:
            print("[ERRO] max_paginas deve ser um numero")
            sys.exit(1)
    
    session_id = iniciar_iarremate(max_paginas=max_paginas)
    
    if session_id:
        print(f"[OK] Session ID: {session_id}")
        sys.exit(0)
    else:
        print("[ERRO] Falha ao iniciar scraping")
        sys.exit(1)

