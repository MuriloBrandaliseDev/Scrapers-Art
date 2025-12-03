#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor de Leilões em Tempo Real
Monitora obras com leilão agendado e atualiza valores durante o leilão
"""

import sys
import re
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))

from database.database import SessionLocal
from database.models import Obra
from src.iarremate_scraper import IArremateScraper


class MonitorLeiloesTempoReal:
    """Monitor que verifica e atualiza valores durante leilões ativos"""
    
    def __init__(self):
        self.scraper = IArremateScraper()
        self.leiloes_ativos = {}  # {obra_id: {'thread': thread, 'parar': False}}
        self.lock = threading.Lock()
        self.intervalo_verificacao = 30  # Verificar a cada 30 segundos durante leilão
        self.duracao_maxima_leilao = timedelta(hours=3)  # Máximo 3 horas de monitoramento
        
    def parsear_data_leilao(self, data_str: str) -> Optional[datetime]:
        """
        Parseia a data/hora do leilão do formato extraído
        Aceita formatos: DD/MM/YYYY HH:MM, countdown, etc.
        """
        if not data_str or data_str == "nao tem" or data_str == "N/A":
            return None
        
        try:
            # Formato 1: DD/MM/YYYY HH:MM ou DD/MM/YYYY HH:MM:SS
            match = re.search(r'(\d{2})/(\d{2})/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?', data_str)
            if match:
                grupos = match.groups()
                dia, mes, ano, hora, minuto = int(grupos[0]), int(grupos[1]), int(grupos[2]), int(grupos[3]), int(grupos[4])
                segundo = int(grupos[5]) if grupos[5] else 0
                return datetime(
                    year=ano,
                    month=mes,
                    day=dia,
                    hour=hora,
                    minute=minuto,
                    second=segundo
                )
            
            # Formato 2: Countdown (ex: "Countdown: 23D 22H 43M 36S" ou "23D 22H 43M 36S")
            if 'countdown' in data_str.lower() or re.search(r'\d+D\s+\d+H\s+\d+M', data_str):
                # Extrair dias, horas, minutos do countdown
                match = re.search(r'(\d+)D\s+(\d+)H\s+(\d+)M(?:\s+(\d+)S)?', data_str)
                if match:
                    grupos = match.groups()
                    dias = int(grupos[0])
                    horas = int(grupos[1])
                    minutos = int(grupos[2])
                    segundos = int(grupos[3]) if grupos[3] else 0
                    
                    delta = timedelta(
                        days=dias,
                        hours=horas,
                        minutes=minutos,
                        seconds=segundos
                    )
                    return datetime.utcnow() + delta
            
            # Formato 3: Outros formatos de data
            # Tentar parsear com datetime.strptime
            formatos = [
                '%d/%m/%Y %H:%M',
                '%d/%m/%Y %H:%M:%S',
                '%Y-%m-%d %H:%M',
                '%Y-%m-%d %H:%M:%S',
                '%d-%m-%Y %H:%M',
                '%d-%m-%Y %H:%M:%S',
            ]
            
            for formato in formatos:
                try:
                    return datetime.strptime(data_str.strip(), formato)
                except:
                    continue
                    
        except Exception as e:
            print(f"[MONITOR] Erro ao parsear data '{data_str}': {e}")
            import traceback
            traceback.print_exc()
        
        return None
    
    def obter_obras_com_leilao_agendado(self) -> List[Obra]:
        """Busca obras que têm leilão agendado"""
        db = SessionLocal()
        try:
            obras = db.query(Obra).filter(
                Obra.scraper_name == "iarremate",
                Obra.data_inicio_leilao.isnot(None),
                Obra.data_inicio_leilao != "nao tem",
                Obra.data_inicio_leilao != "N/A"
            ).all()
            return obras
        finally:
            db.close()
    
    def verificar_valor_atualizado(self, obra: Obra) -> Optional[str]:
        """Verifica o valor atualizado de uma obra específica"""
        try:
            response = self.scraper.fazer_requisicao(obra.url)
            if not response:
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            novo_valor = self.scraper.extrair_valor_iarremate(soup)
            
            if novo_valor and novo_valor != "N/A":
                return novo_valor
        except Exception as e:
            print(f"[MONITOR] Erro ao verificar valor da obra {obra.id}: {e}")
        
        return None
    
    def atualizar_valor_obra(self, obra_id: int, novo_valor: str):
        """Atualiza o valor de uma obra no banco"""
        db = SessionLocal()
        try:
            obra = db.query(Obra).filter(Obra.id == obra_id).first()
            if not obra:
                return
            
            valor_antigo = obra.valor or "N/A"
            
            # Comparar valores (remover formatação)
            valor_antigo_num = valor_antigo.replace('.', '').replace(',', '.').replace('R$', '').strip()
            novo_valor_num = novo_valor.replace('.', '').replace(',', '.').replace('R$', '').strip()
            
            try:
                valor_antigo_float = float(valor_antigo_num) if valor_antigo_num and valor_antigo_num != "N/A" else 0
                novo_valor_float = float(novo_valor_num) if novo_valor_num else 0
                
                # Se o valor mudou e é maior que zero
                if novo_valor_float != valor_antigo_float and novo_valor_float > 0:
                    # Salvar valor antigo em valor_atualizado se ainda não tiver
                    if not obra.valor_atualizado:
                        obra.valor_atualizado = obra.valor
                    
                    # Atualizar valor principal
                    obra.valor = novo_valor
                    obra.ultima_atualizacao = datetime.utcnow()
                    db.commit()
                    
                    print(f"[MONITOR] ✓ Obra {obra_id} atualizada: R$ {valor_antigo} -> R$ {novo_valor}")
                    return True
            except ValueError:
                # Se não conseguir converter, atualizar se for diferente
                if novo_valor != valor_antigo:
                    if not obra.valor_atualizado:
                        obra.valor_atualizado = obra.valor
                    obra.valor = novo_valor
                    obra.ultima_atualizacao = datetime.utcnow()
                    db.commit()
                    print(f"[MONITOR] ✓ Obra {obra_id} atualizada: {valor_antigo} -> {novo_valor}")
                    return True
        except Exception as e:
            print(f"[MONITOR] Erro ao atualizar obra {obra_id}: {e}")
            db.rollback()
        finally:
            db.close()
        
        return False
    
    def monitorar_obra(self, obra: Obra, data_inicio: datetime):
        """
        Monitora uma obra durante o leilão
        Verifica periodicamente se o valor mudou
        """
        obra_id = obra.id
        print(f"[MONITOR] 🎯 Iniciando monitoramento da obra {obra_id} (Leilão: {data_inicio.strftime('%d/%m/%Y %H:%M')})")
        
        # Aguardar até o início do leilão (se ainda não começou)
        agora = datetime.utcnow()
        if data_inicio > agora:
            tempo_espera = (data_inicio - agora).total_seconds()
            if tempo_espera > 0:
                minutos_espera = int(tempo_espera / 60)
                print(f"[MONITOR] ⏳ Aguardando {minutos_espera} minutos até o início do leilão...")
                # Aguardar em blocos de 60 segundos para poder verificar se deve parar
                while tempo_espera > 0:
                    with self.lock:
                        if obra_id not in self.leiloes_ativos:
                            return
                        if self.leiloes_ativos[obra_id].get('parar', False):
                            return
                    
                    sleep_time = min(60, tempo_espera)  # Máximo 60 segundos por vez
                    time.sleep(sleep_time)
                    tempo_espera -= sleep_time
                    
                    # Recalcular tempo restante
                    agora = datetime.utcnow()
                    tempo_espera = (data_inicio - agora).total_seconds()
                    if tempo_espera <= 0:
                        break
        else:
            print(f"[MONITOR] ⚡ Leilão já começou! Iniciando monitoramento imediato...")
        
        # Iniciar monitoramento intensivo
        inicio_monitoramento = datetime.utcnow()
        ultimo_valor = obra.valor
        
        while True:
            with self.lock:
                if obra_id not in self.leiloes_ativos:
                    break
                if self.leiloes_ativos[obra_id].get('parar', False):
                    break
            
            # Verificar se passou o tempo máximo
            tempo_decorrido = datetime.utcnow() - inicio_monitoramento
            if tempo_decorrido > self.duracao_maxima_leilao:
                print(f"[MONITOR] ⏰ Tempo máximo de monitoramento atingido para obra {obra_id}")
                break
            
            # Verificar valor atualizado
            novo_valor = self.verificar_valor_atualizado(obra)
            
            if novo_valor:
                # Comparar com último valor conhecido
                if novo_valor != ultimo_valor:
                    print(f"[MONITOR] 🔔 Mudança detectada na obra {obra_id}!")
                    if self.atualizar_valor_obra(obra_id, novo_valor):
                        ultimo_valor = novo_valor
            
            # Aguardar antes da próxima verificação
            time.sleep(self.intervalo_verificacao)
        
        # Remover do dicionário de leilões ativos
        with self.lock:
            if obra_id in self.leiloes_ativos:
                del self.leiloes_ativos[obra_id]
        
        print(f"[MONITOR] ✅ Monitoramento da obra {obra_id} finalizado")
    
    def iniciar_monitoramento_obra(self, obra: Obra):
        """Inicia o monitoramento de uma obra em thread separada"""
        data_inicio = self.parsear_data_leilao(obra.data_inicio_leilao)
        
        if not data_inicio:
            print(f"[MONITOR] ⚠️ Não foi possível parsear data do leilão para obra {obra.id}")
            return
        
        obra_id = obra.id
        agora = datetime.utcnow()
        
        # Verificar se o leilão já começou ou está próximo
        diferenca = (data_inicio - agora).total_seconds()
        
        # Só monitorar se:
        # 1. Leilão ainda não começou (mas está próximo - até 2 horas antes)
        # 2. Leilão começou há menos de 3 horas (ainda pode estar ativo)
        if diferenca > 7200:  # Mais de 2 horas antes
            horas_restantes = int(diferenca / 3600)
            print(f"[MONITOR] ⏭️ Leilão da obra {obra_id} ainda não está próximo (inicia em {horas_restantes}h)")
            return
        
        if diferenca < -10800:  # Mais de 3 horas depois
            horas_passadas = abs(int(diferenca / 3600))
            print(f"[MONITOR] ⏭️ Leilão da obra {obra_id} já passou há {horas_passadas}h (muito tempo)")
            return
        
        # Se o leilão já começou, iniciar monitoramento imediatamente
        if diferenca < 0:
            print(f"[MONITOR] ⚡ Leilão da obra {obra_id} já começou! Iniciando monitoramento imediato...")
        
        # Verificar se já está sendo monitorada
        with self.lock:
            if obra_id in self.leiloes_ativos:
                print(f"[MONITOR] ℹ️ Obra {obra_id} já está sendo monitorada")
                return
            
            # Criar thread para monitorar
            thread = threading.Thread(
                target=self.monitorar_obra,
                args=(obra, data_inicio),
                daemon=True
            )
            thread.start()
            
            self.leiloes_ativos[obra_id] = {
                'thread': thread,
                'parar': False,
                'data_inicio': data_inicio
            }
            
            print(f"[MONITOR] 🚀 Monitoramento iniciado para obra {obra_id}")
    
    def parar_monitoramento_obra(self, obra_id: int):
        """Para o monitoramento de uma obra específica"""
        with self.lock:
            if obra_id in self.leiloes_ativos:
                self.leiloes_ativos[obra_id]['parar'] = True
                print(f"[MONITOR] 🛑 Parando monitoramento da obra {obra_id}")
    
    def verificar_e_iniciar_monitoramentos(self):
        """Verifica obras com leilão agendado e inicia monitoramentos"""
        print(f"\n[{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}] Verificando leilões agendados...")
        
        obras = self.obter_obras_com_leilao_agendado()
        print(f"[MONITOR] Encontradas {len(obras)} obras com leilão agendado")
        
        for obra in obras:
            try:
                self.iniciar_monitoramento_obra(obra)
            except Exception as e:
                print(f"[MONITOR] Erro ao iniciar monitoramento da obra {obra.id}: {e}")
        
        print(f"[MONITOR] {len(self.leiloes_ativos)} obras sendo monitoradas atualmente")


def main():
    """Função principal para rodar o monitor"""
    monitor = MonitorLeiloesTempoReal()
    
    print("=" * 60)
    print("MONITOR DE LEILÕES EM TEMPO REAL")
    print("=" * 60)
    print("Monitorando obras com leilão agendado...")
    print("Pressione Ctrl+C para parar")
    print("=" * 60)
    
    # Verificar a cada 5 minutos se há novos leilões para monitorar
    while True:
        try:
            monitor.verificar_e_iniciar_monitoramentos()
            time.sleep(300)  # 5 minutos
        except KeyboardInterrupt:
            print("\n[MONITOR] Parando monitoramento...")
            break
        except Exception as e:
            print(f"[MONITOR] Erro: {e}")
            time.sleep(60)  # Aguardar 1 minuto antes de tentar novamente


if __name__ == "__main__":
    import sys
    main()

