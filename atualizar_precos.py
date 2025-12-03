#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar preços de obras após leilões
Roda automaticamente à meia-noite para verificar e atualizar preços
"""

import sys
import time
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).parent))

from database.database import SessionLocal
from database.models import Obra
from src.iarremate_scraper import IArremateScraper

def atualizar_precos_obras():
    """Atualiza os preços de todas as obras que tiveram leilões"""
    print("=" * 60)
    print("ATUALIZACAO DE PRECOS DAS OBRAS")
    print("=" * 60)
    print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    
    db = SessionLocal()
    
    try:
        # Buscar todas as obras do iArremate que têm data de início de leilão
        obras = db.query(Obra).filter(
            Obra.scraper_name == "iarremate",
            Obra.data_inicio_leilao.isnot(None),
            Obra.data_inicio_leilao != "nao tem"
        ).all()
        
        print(f"\n[INFO] Encontradas {len(obras)} obras com data de leilão")
        
        if len(obras) == 0:
            print("[OK] Nenhuma obra para atualizar")
            return
        
        # Criar scraper para fazer requisições
        scraper = IArremateScraper()
        
        atualizadas = 0
        sem_mudanca = 0
        erros = 0
        
        for obra in obras:
            try:
                print(f"\n[PROCESSANDO] Obra ID {obra.id}: {obra.titulo[:50] if obra.titulo else 'N/A'}...")
                
                # Fazer requisição para obter o valor atual
                response = scraper.fazer_requisicao(obra.url)
                if not response:
                    print(f"  [ERRO] Nao foi possivel acessar a URL")
                    erros += 1
                    continue
                
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extrair novo valor
                novo_valor = scraper.extrair_valor_iarremate(soup)
                
                if novo_valor and novo_valor != "N/A":
                    valor_antigo = obra.valor or "N/A"
                    
                    # Comparar valores (remover formatação para comparar)
                    valor_antigo_num = valor_antigo.replace('.', '').replace(',', '.').replace('R$', '').strip()
                    novo_valor_num = novo_valor.replace('.', '').replace(',', '.').replace('R$', '').strip()
                    
                    try:
                        valor_antigo_float = float(valor_antigo_num) if valor_antigo_num and valor_antigo_num != "N/A" else 0
                        novo_valor_float = float(novo_valor_num) if novo_valor_num else 0
                        
                        if novo_valor_float != valor_antigo_float and novo_valor_float > 0:
                            # Atualizar valor (mover valor antigo para valor_atualizado se ainda não tiver)
                            if not obra.valor_atualizado:
                                obra.valor_atualizado = obra.valor
                            # Atualizar valor principal com o novo
                            obra.valor = novo_valor
                            obra.ultima_atualizacao = datetime.utcnow()
                            db.commit()
                            
                            print(f"  [ATUALIZADO] Valor: R$ {valor_antigo} -> R$ {novo_valor}")
                            atualizadas += 1
                        else:
                            print(f"  [SEM MUDANCA] Valor mantido: R$ {valor_antigo}")
                            sem_mudanca += 1
                    except ValueError:
                        # Se não conseguir converter, atualizar mesmo assim se for diferente
                        if novo_valor != valor_antigo:
                            if not obra.valor_atualizado:
                                obra.valor_atualizado = obra.valor
                            obra.valor = novo_valor
                            obra.ultima_atualizacao = datetime.utcnow()
                            db.commit()
                            print(f"  [ATUALIZADO] Valor: {valor_antigo} -> {novo_valor}")
                            atualizadas += 1
                        else:
                            sem_mudanca += 1
                else:
                    print(f"  [SEM VALOR] Nao foi possivel extrair novo valor")
                    sem_mudanca += 1
                
                # Delay entre requisições
                time.sleep(1)
                
            except Exception as e:
                print(f"  [ERRO] Erro ao processar obra {obra.id}: {e}")
                erros += 1
                continue
        
        print("\n" + "=" * 60)
        print("RESUMO DA ATUALIZACAO")
        print("=" * 60)
        print(f"  Obras atualizadas: {atualizadas}")
        print(f"  Obras sem mudanca: {sem_mudanca}")
        print(f"  Erros: {erros}")
        print(f"  Total processado: {len(obras)}")
        
    except Exception as e:
        print(f"\n[ERRO] Erro durante atualizacao: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    atualizar_precos_obras()

