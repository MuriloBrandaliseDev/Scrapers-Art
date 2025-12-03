#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inicia a API FastAPI com scheduler de atualização de preços
"""

import uvicorn
import threading
from scheduler_atualizacao import main as scheduler_main

def run_scheduler():
    """Executa o scheduler em thread separada"""
    scheduler_main()

if __name__ == "__main__":
    # Iniciar scheduler em thread separada
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("=" * 60)
    print("API FastAPI + Scheduler de Atualizacao + Monitor de Leiloes")
    print("=" * 60)
    print("API: http://localhost:8000")
    print("Scheduler: Rodando em background")
    print("  - Atualiza precos (leiloes agendados): Diariamente as 00:00")
    print("  - Atualiza obras coletadas: Diariamente as 00:05")
    print("  - Monitor de leiloes: A cada 5 minutos")
    print("=" * 60)
    
    # Iniciar API
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )

