#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Classe base abstrata para scrapers
"""

import requests
import random
import re
import time
import sys
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from bs4 import BeautifulSoup
import pandas as pd
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Desabilita avisos de SSL
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Configura UTF-8
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Lista de User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edge/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
]


class BaseScraper(ABC):
    """Classe base abstrata para todos os scrapers"""
    
    def __init__(self, base_url: str, output_dir: str = "output", 
                 logs_dir: str = "logs", max_retries: int = 3, 
                 delay_between_requests: float = 1.0, scraper_name: str = "scraper"):
        """
        Inicializa o scraper base
        
        Args:
            base_url: URL base do site
            output_dir: Diretório para salvar arquivos de saída
            logs_dir: Diretório para salvar logs
            max_retries: Número máximo de tentativas por requisição
            delay_between_requests: Delay entre requisições (segundos)
            scraper_name: Nome do scraper (para logs e arquivos)
        """
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.logs_dir = Path(logs_dir)
        self.max_retries = max_retries
        self.delay_between_requests = delay_between_requests
        self.scraper_name = scraper_name
        
        # Criar diretórios se não existirem
        self.output_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
        
        # Dados coletados
        self.dados_obras: List[Dict] = []
        self.session = requests.Session()
        
        # Configurar logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Configura o sistema de logging"""
        log_filename = self.logs_dir / f"{self.scraper_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger(self.scraper_name)
        self.logger.info(f"Logging configurado. Arquivo: {log_filename}")
    
    def get_headers(self) -> Dict[str, str]:
        """Retorna headers aleatórios para evitar bloqueios"""
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
    
    def fazer_requisicao(self, url: str, follow_redirects: bool = True) -> Optional[requests.Response]:
        """Faz requisição com retry automático e suporte a redirecionamentos"""
        for tentativa in range(self.max_retries):
            try:
                response = self.session.get(
                    url, 
                    headers=self.get_headers(), 
                    verify=False, 
                    timeout=30,
                    allow_redirects=follow_redirects
                )
                if response.status_code == 200:
                    return response
                elif response.status_code in [301, 302, 303, 307, 308] and follow_redirects:
                    # Seguir redirecionamento manualmente se necessário
                    redirect_url = response.headers.get('Location')
                    if redirect_url:
                        if not redirect_url.startswith('http'):
                            # URL relativa
                            from urllib.parse import urljoin
                            redirect_url = urljoin(url, redirect_url)
                        self.logger.info(f"Redirecionando para: {redirect_url}")
                        return self.fazer_requisicao(redirect_url, follow_redirects=True)
                else:
                    self.logger.warning(
                        f"Tentativa {tentativa + 1}/{self.max_retries}: "
                        f"Status {response.status_code} para {url}"
                    )
            except Exception as e:
                self.logger.warning(
                    f"Tentativa {tentativa + 1}/{self.max_retries}: "
                    f"Erro {e} para {url}"
                )
                if tentativa < self.max_retries - 1:
                    time.sleep(2)
        
        self.logger.error(f"Falha ao acessar {url} após {self.max_retries} tentativas")
        return None
    
    def extrair_valor(self, soup: BeautifulSoup) -> str:
        """Extrai o valor atual da obra com múltiplas estratégias"""
        valor = "N/A"
        
        # Estratégia 1: Buscar por "Valor Atual" ou similar
        try:
            valor_element = soup.find(text=re.compile(r'Valor Atual|Valor atual|Preço|Preco', re.IGNORECASE))
            if valor_element:
                parent = valor_element.parent
                valor_text = parent.get_text(strip=True)
                valor_match = re.search(r'R\$\s*([\d.,]+)', valor_text)
                if valor_match:
                    valor = valor_match.group(1)
                    return valor
        except Exception as e:
            self.logger.debug(f"Estratégia 1 falhou: {e}")
        
        # Estratégia 2: Buscar por padrões de moeda brasileira
        try:
            valor_patterns = [
                r'R\$\s*([\d.,]+)',
                r'R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
                r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*reais?',
            ]
            
            for pattern in valor_patterns:
                matches = soup.find_all(text=re.compile(pattern))
                for match in matches:
                    valor_match = re.search(pattern, match)
                    if valor_match:
                        valor = valor_match.group(1)
                        return valor
        except Exception as e:
            self.logger.debug(f"Estratégia 2 falhou: {e}")
        
        # Estratégia 3: Buscar em elementos com classes específicas
        try:
            classes_valor = ['valor-atual', 'current-value', 'price', 'valor', 'preco', 'lance']
            for classe in classes_valor:
                elementos = soup.find_all(class_=re.compile(classe, re.IGNORECASE))
                for elemento in elementos:
                    texto = elemento.get_text(strip=True)
                    valor_match = re.search(r'R\$\s*([\d.,]+)', texto)
                    if valor_match:
                        valor = valor_match.group(1)
                        return valor
        except Exception as e:
            self.logger.debug(f"Estratégia 3 falhou: {e}")
        
        return valor
    
    def extrair_titulo_descricao(self, soup: BeautifulSoup) -> Tuple[str, str]:
        """Extrai título e descrição da obra"""
        titulo = "N/A"
        descricao = "N/A"
        
        try:
            # Buscar título em h1 primeiro
            h1_tag = soup.find('h1')
            if h1_tag:
                titulo = h1_tag.get_text(strip=True)
            
            # Fallback: tag title
            if titulo == "N/A":
                title_tag = soup.find('title')
                if title_tag:
                    titulo = title_tag.get_text(strip=True)
            
            # Buscar descrição em meta tags
            desc_meta = soup.find('meta', attrs={'name': 'description'})
            if desc_meta and desc_meta.get('content'):
                descricao = desc_meta.get('content')
            
            # Buscar descrição em elementos específicos
            if descricao == "N/A":
                desc_elementos = soup.find_all(
                    ['p', 'div', 'span'], 
                    class_=re.compile(r'desc|info|detail|descricao', re.IGNORECASE)
                )
                for elemento in desc_elementos:
                    texto = elemento.get_text(strip=True)
                    if len(texto) > 20:
                        descricao = texto
                        break
        except Exception as e:
            self.logger.debug(f"Erro ao extrair título/descrição: {e}")
        
        return titulo, descricao
    
    def extrair_nome_artista(self, titulo: str, descricao: str) -> str:
        """Extrai o nome do artista do título ou descrição"""
        nome_artista = "N/A"
        
        try:
            # Buscar no título primeiro
            if titulo != "N/A":
                # Padrão comum: "NOME DO ARTISTA - Título da Obra"
                match = re.search(r'^([^-]+?)\s*-\s*', titulo)
                if match:
                    nome_artista = match.group(1).strip()
                    return nome_artista
            
            # Buscar na descrição
            if descricao != "N/A":
                patterns = [
                    r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                    r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-\s*',
                    r'Artista:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, descricao)
                    if match:
                        nome_artista = match.group(1).strip()
                        break
        except Exception as e:
            self.logger.debug(f"Erro ao extrair nome do artista: {e}")
        
        return nome_artista
    
    def salvar_planilha(self, nome_arquivo: str = None) -> Optional[Path]:
        """Salva os dados coletados em uma planilha Excel"""
        if not self.dados_obras:
            self.logger.warning("Nenhum dado para salvar!")
            return None
        
        if not nome_arquivo:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            nome_arquivo = f"{self.scraper_name}_{timestamp}.xlsx"
        
        arquivo_path = self.output_dir / nome_arquivo
        
        # Criar DataFrame
        df = pd.DataFrame(self.dados_obras)
        
        # Salvar em Excel
        try:
            df.to_excel(arquivo_path, index=False, engine='openpyxl')
            self.logger.info(f"Planilha salva com sucesso: {arquivo_path}")
            self.logger.info(f"Total de registros: {len(df)}")
            return arquivo_path
        except Exception as e:
            self.logger.error(f"Erro ao salvar planilha: {e}")
            # Tentar salvar como CSV se Excel falhar
            arquivo_csv = arquivo_path.with_suffix('.csv')
            df.to_csv(arquivo_csv, index=False, encoding='utf-8-sig')
            self.logger.info(f"Salvo como CSV: {arquivo_csv}")
            return arquivo_csv
    
    # Métodos abstratos que devem ser implementados pelas classes filhas
    @abstractmethod
    def descobrir_total_paginas(self, categoria: str = None) -> int:
        """Descobre o total de páginas disponíveis"""
        pass
    
    @abstractmethod
    def processar_pagina(self, url: str, numero_pagina: int, categoria: str = None):
        """Processa uma página específica e extrai dados das obras"""
        pass
    
    @abstractmethod
    def processar_obra(self, url_obra: str, numero_pagina: int, categoria: str = None):
        """Processa uma obra específica e extrai seus dados"""
        pass
    
    @abstractmethod
    def executar_scraping(self, categorias: List[str] = None, max_paginas: int = None):
        """Executa o scraping completo"""
        pass

