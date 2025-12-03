#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scheduler para atualizar preços automaticamente à meia-noite
E monitor de leilões em tempo real
"""

import schedule
import time
import threading
from datetime import datetime
from atualizar_precos import atualizar_precos_obras
from atualizar_obras_coletadas import atualizar_obras_coletadas
from monitor_leiloes_tempo_real import MonitorLeiloesTempoReal

# Instância global do monitor
monitor_leiloes = MonitorLeiloesTempoReal()

def job_atualizar_precos():
    """Job que roda à meia-noite para atualizar preços (obras com leilão agendado)"""
    print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Executando atualizacao de precos...")
    atualizar_precos_obras()
    print(f"[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Atualizacao concluida\n")

def job_atualizar_obras_coletadas():
    """Job que roda à meia-noite para verificar e atualizar todas as obras coletadas"""
    print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Executando atualizacao de obras coletadas...")
    atualizar_obras_coletadas()
    print(f"[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Atualizacao de obras concluida\n")

def job_verificar_leiloes():
    """Job que verifica leilões agendados e inicia monitoramentos"""
    print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Verificando leiloes agendados...")
    monitor_leiloes.verificar_e_iniciar_monitoramentos()
    print(f"[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Verificacao concluida\n")

def main():
    """Inicia o scheduler"""
    print("=" * 60)
    print("SCHEDULER DE ATUALIZACAO + MONITOR DE LEILOES")
    print("=" * 60)
    print("Atualizacao de precos (leiloes agendados): Diariamente as 00:00")
    print("Atualizacao de obras coletadas: Diariamente as 00:05")
    print("Monitor de leiloes: A cada 5 minutos")
    print("Pressione Ctrl+C para parar")
    print("=" * 60)
    
    # Agendar atualização de preços à meia-noite (obras com leilão agendado)
    schedule.every().day.at("00:00").do(job_atualizar_precos)
    
    # Agendar atualização de todas as obras coletadas às 00:05
    # (5 minutos depois para não sobrecarregar o servidor)
    schedule.every().day.at("00:05").do(job_atualizar_obras_coletadas)
    
    # Agendar verificação de leilões a cada 5 minutos
    schedule.every(5).minutes.do(job_verificar_leiloes)
    
    # Verificar leilões imediatamente na primeira vez
    print("\n[INICIO] Verificando leiloes agendados pela primeira vez...")
    job_verificar_leiloes()
    
    # Loop principal
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verificar a cada minuto

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[SCHEDULER] Parado pelo usuario")

