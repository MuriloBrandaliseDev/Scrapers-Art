#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Atualização Automática de Obras Coletadas
Verifica todas as obras coletadas e atualiza dados se houver mudanças
Roda automaticamente todos os dias às 00:00
"""

import sys
import re
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, Tuple
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))

from database.database import SessionLocal
from database.models import Obra
from src.iarremate_scraper import IArremateScraper
from src.leiloes_br_scraper import LeiloesBRScraper


class AtualizadorObras:
    """Classe para atualizar obras coletadas verificando mudanças nos sites"""
    
    def __init__(self):
        self.scraper_iarremate = IArremateScraper()
        self.scraper_leiloes_br = LeiloesBRScraper()
        self.delay_entre_requisicoes = 1.0  # Delay entre requisições para não sobrecarregar
        
    def normalizar_valor(self, valor: str) -> float:
        """Normaliza valor para comparação numérica"""
        if not valor or valor == "N/A":
            return 0.0
        try:
            valor_limpo = valor.replace('R$', '').replace('.', '').replace(',', '.').strip()
            return float(valor_limpo)
        except:
            return 0.0
    
    def comparar_valores(self, valor_antigo: str, valor_novo: str) -> bool:
        """Compara dois valores e retorna True se forem diferentes"""
        if valor_antigo == valor_novo:
            return False
        
        valor_antigo_num = self.normalizar_valor(valor_antigo or "N/A")
        valor_novo_num = self.normalizar_valor(valor_novo or "N/A")
        
        return valor_antigo_num != valor_novo_num
    
    def atualizar_obra_iarremate(self, obra: Obra, soup: BeautifulSoup) -> Tuple[bool, Dict[str, str]]:
        """
        Atualiza uma obra do iArremate
        Retorna (houve_mudanca, campos_atualizados)
        """
        mudancas = {}
        houve_mudanca = False
        
        try:
            # Extrair novos dados
            novo_titulo = self.scraper_iarremate.extrair_titulo_iarremate(soup)
            nova_descricao = self.scraper_iarremate.extrair_descricao_iarremate(soup, novo_titulo)
            novo_nome_artista = self.scraper_iarremate.extrair_nome_artista(novo_titulo, nova_descricao)
            novo_valor = self.scraper_iarremate.extrair_valor_iarremate(soup)
            novo_lote = self.scraper_iarremate.extrair_lote_iarremate(soup)
            nova_data_inicio = self.scraper_iarremate.extrair_data_inicio_leilao_iarremate(soup)
            
            # Comparar e atualizar título
            if novo_titulo and novo_titulo != "N/A" and novo_titulo != obra.titulo:
                mudancas['titulo'] = f"{obra.titulo} -> {novo_titulo}"
                obra.titulo = novo_titulo
                houve_mudanca = True
            
            # Comparar e atualizar descrição
            if nova_descricao and nova_descricao != "N/A" and nova_descricao != obra.descricao:
                mudancas['descricao'] = f"{obra.descricao} -> {nova_descricao}"
                obra.descricao = nova_descricao
                houve_mudanca = True
            
            # Comparar e atualizar artista
            if novo_nome_artista and novo_nome_artista != "N/A" and novo_nome_artista != obra.nome_artista:
                mudancas['nome_artista'] = f"{obra.nome_artista} -> {novo_nome_artista}"
                obra.nome_artista = novo_nome_artista
                houve_mudanca = True
            
            # Comparar e atualizar valor (mais importante)
            if novo_valor and novo_valor != "N/A":
                if self.comparar_valores(obra.valor or "N/A", novo_valor):
                    # Salvar valor antigo se ainda não tiver
                    if not obra.valor_atualizado and obra.valor:
                        obra.valor_atualizado = obra.valor
                    mudancas['valor'] = f"{obra.valor} -> {novo_valor}"
                    obra.valor = novo_valor
                    obra.ultima_atualizacao = datetime.utcnow()
                    houve_mudanca = True
            
            # Comparar e atualizar lote
            if novo_lote and novo_lote != "N/A" and novo_lote != obra.lote:
                mudancas['lote'] = f"{obra.lote} -> {novo_lote}"
                obra.lote = novo_lote
                houve_mudanca = True
            
            # Comparar e atualizar data início leilão
            if nova_data_inicio and nova_data_inicio != "nao tem" and nova_data_inicio != obra.data_inicio_leilao:
                mudancas['data_inicio_leilao'] = f"{obra.data_inicio_leilao} -> {nova_data_inicio}"
                obra.data_inicio_leilao = nova_data_inicio
                houve_mudanca = True
                
        except Exception as e:
            print(f"    [ERRO] Erro ao extrair dados iArremate: {e}")
        
        return houve_mudanca, mudancas
    
    def atualizar_obra_leiloes_br(self, obra: Obra, soup: BeautifulSoup) -> Tuple[bool, Dict[str, str]]:
        """
        Atualiza uma obra do LeilõesBR
        Retorna (houve_mudanca, campos_atualizados)
        """
        mudancas = {}
        houve_mudanca = False
        
        try:
            # Extrair novos dados
            novo_titulo = self.scraper_leiloes_br.extrair_titulo_leiloes_br(soup, obra.titulo or "N/A")
            nova_descricao = self.scraper_leiloes_br.extrair_descricao_leiloes_br(soup, novo_titulo)
            novo_nome_artista = self.scraper_leiloes_br.extrair_nome_artista(novo_titulo, nova_descricao)
            novo_valor = self.scraper_leiloes_br.extrair_valor_leiloes_br(soup, obra.valor or "N/A")
            novo_lote = self.scraper_leiloes_br.extrair_lote_leiloes_br(soup, obra.url)
            nova_data_inicio = self.scraper_leiloes_br.extrair_data_inicio_leilao_leiloes_br(soup)
            nova_data_leilao = self.scraper_leiloes_br.extrair_data_leilao_leiloes_br(soup)
            novo_leiloeiro = self.scraper_leiloes_br.extrair_leiloeiro_leiloes_br(soup)
            novo_local = self.scraper_leiloes_br.extrair_local_leiloes_br(soup)
            
            # Comparar e atualizar título
            if novo_titulo and novo_titulo != "N/A" and novo_titulo != obra.titulo:
                mudancas['titulo'] = f"{obra.titulo} -> {novo_titulo}"
                obra.titulo = novo_titulo
                houve_mudanca = True
            
            # Comparar e atualizar descrição
            if nova_descricao and nova_descricao != "N/A" and nova_descricao != obra.descricao:
                mudancas['descricao'] = f"{obra.descricao} -> {nova_descricao}"
                obra.descricao = nova_descricao
                houve_mudanca = True
            
            # Comparar e atualizar artista
            if novo_nome_artista and novo_nome_artista != "N/A" and novo_nome_artista != obra.nome_artista:
                mudancas['nome_artista'] = f"{obra.nome_artista} -> {novo_nome_artista}"
                obra.nome_artista = novo_nome_artista
                houve_mudanca = True
            
            # Comparar e atualizar valor (mais importante)
            if novo_valor and novo_valor != "N/A":
                if self.comparar_valores(obra.valor or "N/A", novo_valor):
                    # Salvar valor antigo se ainda não tiver
                    if not obra.valor_atualizado and obra.valor:
                        obra.valor_atualizado = obra.valor
                    mudancas['valor'] = f"{obra.valor} -> {novo_valor}"
                    obra.valor = novo_valor
                    obra.ultima_atualizacao = datetime.utcnow()
                    houve_mudanca = True
            
            # Comparar e atualizar lote
            if novo_lote and novo_lote != "N/A" and novo_lote != obra.lote:
                mudancas['lote'] = f"{obra.lote} -> {novo_lote}"
                obra.lote = novo_lote
                houve_mudanca = True
            
            # Comparar e atualizar data início leilão
            if nova_data_inicio and nova_data_inicio != "nao tem" and nova_data_inicio != obra.data_inicio_leilao:
                mudancas['data_inicio_leilao'] = f"{obra.data_inicio_leilao} -> {nova_data_inicio}"
                obra.data_inicio_leilao = nova_data_inicio
                houve_mudanca = True
            
            # Comparar e atualizar data leilão
            if nova_data_leilao and nova_data_leilao != "N/A" and nova_data_leilao != obra.data_leilao:
                mudancas['data_leilao'] = f"{obra.data_leilao} -> {nova_data_leilao}"
                obra.data_leilao = nova_data_leilao
                houve_mudanca = True
            
            # Comparar e atualizar leiloeiro
            if novo_leiloeiro and novo_leiloeiro != "N/A" and novo_leiloeiro != obra.leiloeiro:
                mudancas['leiloeiro'] = f"{obra.leiloeiro} -> {novo_leiloeiro}"
                obra.leiloeiro = novo_leiloeiro
                houve_mudanca = True
            
            # Comparar e atualizar local
            if novo_local and novo_local != "N/A" and novo_local != obra.local:
                mudancas['local'] = f"{obra.local} -> {novo_local}"
                obra.local = novo_local
                houve_mudanca = True
                
        except Exception as e:
            print(f"    [ERRO] Erro ao extrair dados LeilõesBR: {e}")
        
        return houve_mudanca, mudancas
    
    def atualizar_todas_obras(self, scraper_name: Optional[str] = None, limite: Optional[int] = None):
        """
        Atualiza todas as obras coletadas
        Args:
            scraper_name: 'iarremate', 'leiloes_br' ou None para ambos
            limite: Número máximo de obras para processar (None = todas)
        """
        print("=" * 80)
        print("SISTEMA DE ATUALIZAÇÃO DE OBRAS COLETADAS")
        print("=" * 80)
        print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print()
        
        db = SessionLocal()
        
        try:
            # Buscar obras
            query = db.query(Obra)
            
            if scraper_name:
                query = query.filter(Obra.scraper_name == scraper_name)
            
            if limite:
                query = query.limit(limite)
            
            obras = query.all()
            
            total_obras = len(obras)
            print(f"[INFO] Encontradas {total_obras} obras para verificar")
            
            if total_obras == 0:
                print("[OK] Nenhuma obra para atualizar")
                return
            
            # Estatísticas
            atualizadas = 0
            sem_mudanca = 0
            erros = 0
            nao_encontradas = 0
            
            # Processar cada obra
            for i, obra in enumerate(obras, 1):
                try:
                    # Log de progresso
                    if i % 50 == 0 or i == 1:
                        print(f"\n[PROGRESSO] {i}/{total_obras} obras processadas | "
                              f"Atualizadas: {atualizadas} | Sem mudança: {sem_mudanca} | Erros: {erros}")
                    
                    titulo_display = (obra.titulo[:50] + "...") if obra.titulo and len(obra.titulo) > 50 else (obra.titulo or "N/A")
                    print(f"\n[{i}/{total_obras}] Verificando obra ID {obra.id} ({obra.scraper_name}): {titulo_display}")
                    
                    # Escolher scraper apropriado
                    if obra.scraper_name == "iarremate":
                        scraper = self.scraper_iarremate
                    elif obra.scraper_name == "leiloes_br":
                        scraper = self.scraper_leiloes_br
                    else:
                        print(f"  [PULAR] Scraper desconhecido: {obra.scraper_name}")
                        continue
                    
                    # Fazer requisição
                    response = scraper.fazer_requisicao(obra.url)
                    if not response:
                        print(f"  [ERRO] Não foi possível acessar a URL")
                        nao_encontradas += 1
                        erros += 1
                        continue
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Atualizar obra
                    if obra.scraper_name == "iarremate":
                        houve_mudanca, mudancas = self.atualizar_obra_iarremate(obra, soup)
                    else:
                        houve_mudanca, mudancas = self.atualizar_obra_leiloes_br(obra, soup)
                    
                    if houve_mudanca:
                        db.commit()
                        print(f"  [ATUALIZADO] {len(mudancas)} campo(s) alterado(s):")
                        for campo, mudanca in mudancas.items():
                            print(f"    - {campo}: {mudanca}")
                        atualizadas += 1
                    else:
                        print(f"  [SEM MUDANÇA] Dados mantidos")
                        sem_mudanca += 1
                    
                    # Delay entre requisições
                    time.sleep(self.delay_entre_requisicoes)
                    
                except Exception as e:
                    print(f"  [ERRO] Erro ao processar obra {obra.id}: {e}")
                    import traceback
                    traceback.print_exc()
                    erros += 1
                    continue
            
            # Resumo final
            print("\n" + "=" * 80)
            print("RESUMO DA ATUALIZAÇÃO")
            print("=" * 80)
            print(f"  Total de obras verificadas: {total_obras}")
            print(f"  Obras atualizadas: {atualizadas}")
            print(f"  Obras sem mudança: {sem_mudanca}")
            print(f"  Obras não encontradas: {nao_encontradas}")
            print(f"  Erros: {erros}")
            print(f"Concluído em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n[ERRO CRÍTICO] Erro durante atualização: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()


def atualizar_obras_coletadas(scraper_name: Optional[str] = None, limite: Optional[int] = None):
    """
    Função principal para atualizar obras coletadas
    Args:
        scraper_name: 'iarremate', 'leiloes_br' ou None para ambos
        limite: Número máximo de obras para processar (None = todas)
    """
    atualizador = AtualizadorObras()
    atualizador.atualizar_todas_obras(scraper_name=scraper_name, limite=limite)


if __name__ == "__main__":
    # Permitir passar parâmetros via linha de comando
    scraper_name = None
    limite = None
    
    if len(sys.argv) > 1:
        scraper_name = sys.argv[1] if sys.argv[1] in ['iarremate', 'leiloes_br'] else None
    
    if len(sys.argv) > 2:
        try:
            limite = int(sys.argv[2])
        except ValueError:
            limite = None
    
    atualizar_obras_coletadas(scraper_name=scraper_name, limite=limite)

