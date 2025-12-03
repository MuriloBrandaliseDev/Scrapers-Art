#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpar TODOS os dados coletados automaticamente (sem confirmação)
"""

import os
import sys
import requests
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent))

from database.database import SessionLocal
from database.models import Obra, ScrapingSession

def parar_scrapers_ativos():
    """Tenta parar qualquer scraper em execução"""
    print("=" * 60)
    print("VERIFICANDO SCRAPERS ATIVOS")
    print("=" * 60)
    
    try:
        # Buscar sessões em execução
        db = SessionLocal()
        sessoes_ativas = db.query(ScrapingSession).filter(
            ScrapingSession.status.in_(["iniciando", "em_andamento"])
        ).all()
        db.close()
        
        if not sessoes_ativas:
            print("[OK] Nenhum scraper ativo encontrado.")
            return
        
        print(f"\n[AVISO] Encontradas {len(sessoes_ativas)} sessao(oes) ativa(s):")
        for sessao in sessoes_ativas:
            print(f"   - Sessao {sessao.id} ({sessao.scraper_name}) - Status: {sessao.status}")
        
        # Tentar parar via API
        print("\n[PARANDO] Tentando parar scrapers ativos...")
        for sessao in sessoes_ativas:
            try:
                response = requests.post(
                    f"http://localhost:8000/api/v1/sessions/{sessao.id}/stop",
                    timeout=5
                )
                if response.status_code == 200:
                    print(f"   [OK] Sessao {sessao.id} parada com sucesso")
                else:
                    print(f"   [AVISO] Nao foi possivel parar sessao {sessao.id}")
            except Exception as e:
                print(f"   [AVISO] Erro ao parar sessao {sessao.id}: {e}")
        
        # Atualizar status no banco
        db = SessionLocal()
        db.query(ScrapingSession).filter(
            ScrapingSession.status.in_(["iniciando", "em_andamento"])
        ).update({"status": "interrompido"})
        db.commit()
        db.close()
        
        print("\n[OK] Status das sessoes atualizado.")
        
    except Exception as e:
        print(f"[AVISO] Erro ao verificar scrapers: {e}")

def limpar_banco_dados():
    """Limpa todas as tabelas do banco de dados"""
    print("\n" + "=" * 60)
    print("LIMPEZA DO BANCO DE DADOS")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Contar registros antes
        total_obras = db.query(Obra).count()
        total_sessoes = db.query(ScrapingSession).count()
        
        print(f"\n[DADOS] Dados atuais:")
        print(f"   - Obras coletadas: {total_obras}")
        print(f"   - Sessoes de scraping: {total_sessoes}")
        
        if total_obras == 0 and total_sessoes == 0:
            print("\n[OK] Banco de dados ja esta vazio!")
            return
        
        print("\n[DELETANDO] Deletando dados...")
        
        # Deletar todas as obras
        obras_deletadas = db.query(Obra).delete()
        print(f"   [OK] {obras_deletadas} obras deletadas")
        
        # Deletar todas as sessões
        sessoes_deletadas = db.query(ScrapingSession).delete()
        print(f"   [OK] {sessoes_deletadas} sessoes deletadas")
        
        # Commit
        db.commit()
        
        print("\n[OK] Banco de dados limpo com sucesso!")
        
    except Exception as e:
        print(f"\n[ERRO] Erro ao limpar banco de dados: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def limpar_arquivos_output():
    """Limpa arquivos de output (Excel, CSV)"""
    print("\n" + "=" * 60)
    print("LIMPEZA DE ARQUIVOS DE OUTPUT")
    print("=" * 60)
    
    output_dir = Path("output")
    if not output_dir.exists():
        print("[OK] Pasta 'output' nao existe.")
        return
    
    arquivos = list(output_dir.glob("*.xlsx")) + list(output_dir.glob("*.csv"))
    
    if not arquivos:
        print("[OK] Nenhum arquivo de output encontrado.")
        return
    
    print(f"\n[ARQUIVOS] Arquivos encontrados: {len(arquivos)}")
    deletados = 0
    for arquivo in arquivos:
        try:
            arquivo.unlink()
            deletados += 1
            print(f"   [OK] Deletado: {arquivo.name}")
        except Exception as e:
            print(f"   [ERRO] Erro ao deletar {arquivo.name}: {e}")
    
    print(f"\n[OK] {deletados} arquivo(s) deletado(s)!")

def limpar_logs():
    """Limpa arquivos de log"""
    print("\n" + "=" * 60)
    print("LIMPEZA DE LOGS")
    print("=" * 60)
    
    logs_dir = Path("logs")
    if not logs_dir.exists():
        print("[OK] Pasta 'logs' nao existe.")
        return
    
    arquivos = list(logs_dir.glob("*.log"))
    
    if not arquivos:
        print("[OK] Nenhum arquivo de log encontrado.")
        return
    
    print(f"\n[ARQUIVOS] Arquivos de log encontrados: {len(arquivos)}")
    deletados = 0
    for arquivo in arquivos:
        try:
            arquivo.unlink()
            deletados += 1
        except Exception as e:
            print(f"   [ERRO] Erro ao deletar {arquivo.name}: {e}")
    
    print(f"\n[OK] {deletados} arquivo(s) de log deletado(s)!")

def main():
    """Função principal"""
    print("\n" + "=" * 60)
    print("LIMPEZA COMPLETA DO SISTEMA")
    print("=" * 60)
    print("\nEste script ira:")
    print("  1. Parar qualquer scraper em execucao")
    print("  2. Limpar todos os dados do banco de dados")
    print("  3. Deletar arquivos de output (Excel/CSV)")
    print("  4. Deletar arquivos de log")
    print("\n[INICIANDO] Limpeza automatica...")
    
    try:
        # 1. Parar scrapers ativos
        parar_scrapers_ativos()
        
        # 2. Limpar banco de dados
        limpar_banco_dados()
        
        # 3. Limpar arquivos de output
        limpar_arquivos_output()
        
        # 4. Limpar logs
        limpar_logs()
        
        print("\n" + "=" * 60)
        print("LIMPEZA CONCLUIDA COM SUCESSO!")
        print("=" * 60)
        print("\nO sistema esta pronto para uma nova coleta de dados.")
        print("Voce pode iniciar um novo scraping agora:")
        print("   - python iniciar_iarremate.py 10")
        print("   - python iniciar_leiloes_br.py 10")
        
    except Exception as e:
        print(f"\n[ERRO] Erro durante a limpeza: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

