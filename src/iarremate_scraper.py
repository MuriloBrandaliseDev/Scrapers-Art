#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web Scraper para iArremate - Belas Artes
Coleta dados de quadros disponíveis no site iArremate
"""

import re
import time
from typing import Optional, Dict, List
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper


class IArremateScraper(BaseScraper):
    """Scraper para coletar dados de quadros do site iArremate"""
    
    def __init__(self, base_url: str = "https://www.iarremate.com/belas-artes", 
                 output_dir: str = "output", logs_dir: str = "logs", 
                 max_retries: int = 3, delay_between_requests: float = 1.0,
                 db_session=None, session_id: int = None):
        """
        Inicializa o scraper do iArremate
        
        Args:
            base_url: URL base do site
            output_dir: Diretório para salvar arquivos de saída
            logs_dir: Diretório para salvar logs
            max_retries: Número máximo de tentativas por requisição
            delay_between_requests: Delay entre requisições (segundos)
            db_session: Sessão do banco de dados para verificar duplicatas
            session_id: ID da sessão de scraping
        """
        super().__init__(
            base_url=base_url,
            output_dir=output_dir,
            logs_dir=logs_dir,
            max_retries=max_retries,
            delay_between_requests=delay_between_requests,
            scraper_name="iarremate"
        )
        self.db_session = db_session
        self.session_id = session_id
        self._parar_scraping = False  # Flag para parar o scraping
        self.urls_coletadas = set()  # Cache de URLs já coletadas nesta execução
    
    def descobrir_total_paginas(self, categoria: str = None) -> int:
        """Descobre o total de páginas disponíveis para uma categoria"""
        # URL específica para a categoria
        if categoria:
            if categoria.lower() == "quadros":
                url_base = "https://www.iarremate.com/belas-artes/quadros"
            elif categoria.lower() == "esculturas":
                url_base = "https://www.iarremate.com/belas-artes/esculturas"
            else:
                url_base = f"{self.base_url}/{categoria.lower()}"
        else:
            url_base = self.base_url
        
        self.logger.info(f"Descobrindo total de páginas para: {categoria or 'todas as categorias'}...")
        
        pagina_atual = 1
        max_paginas = 100  # Limite de segurança
        
        while pagina_atual <= max_paginas:
            if pagina_atual == 1:
                url = url_base
            else:
                url = f"{url_base}/pg{pagina_atual}"
            
            response = self.fazer_requisicao(url)
            if not response:
                break
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Verificar se a página tem conteúdo (quadros ou esculturas)
            tem_conteudo = False
            
            # Verificar se há links de obras
            links_obras = soup.find_all('a', href=True)
            for link in links_obras:
                href = link.get('href')
                if href and ('/belas-artes/' in href or '/quadro' in href or '/pintura' in href or '/escultura' in href):
                    tem_conteudo = True
                    break
            
            if not tem_conteudo:
                self.logger.info(
                    f"Página {pagina_atual} não contém obras. "
                    f"Total de páginas: {pagina_atual - 1}"
                )
                return pagina_atual - 1
            
            self.logger.debug(f"Página {pagina_atual} contém obras")
            pagina_atual += 1
            time.sleep(1)
        
        self.logger.warning(f"Limite de {max_paginas} páginas atingido")
        return max_paginas
    
    def processar_pagina(self, url: str, numero_pagina: int, categoria: str = None):
        """Processa uma página específica e extrai dados dos quadros"""
        # Verificar se deve parar antes de processar
        if self._parar_scraping:
            return
        
        self.logger.info(f"Processando página {numero_pagina}: {url}")
        
        response = self.fazer_requisicao(url)
        if not response:
            self.logger.error(f"Erro ao acessar página {numero_pagina}")
            return
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscar todos os links de quadros na página
        links_quadros = []
        
        # Estratégia 1: Buscar links que parecem ser de obras (quadros ou esculturas)
        for link in soup.find_all('a', href=True):
            if self._parar_scraping:
                break
            href = link.get('href')
            if href and ('/belas-artes/' in href or '/quadro' in href or '/pintura' in href or '/escultura' in href):
                if href.startswith('/'):
                    href = 'https://www.iarremate.com' + href
                if href not in links_quadros:
                    links_quadros.append(href)
        
        # Estratégia 2: Buscar em elementos com classes específicas
        if not self._parar_scraping:
            elementos_quadros = soup.find_all(
                ['div', 'article'], 
                class_=re.compile(r'item|quadro|pintura|artwork', re.IGNORECASE)
            )
            for elemento in elementos_quadros:
                if self._parar_scraping:
                    break
                link_elem = elemento.find('a', href=True)
                if link_elem:
                    href = link_elem.get('href')
                    if href and not href.startswith('http'):
                        href = 'https://www.iarremate.com' + href
                    if href not in links_quadros:
                        links_quadros.append(href)
        
        self.logger.info(f"Encontrados {len(links_quadros)} obras na página {numero_pagina}")
        
        # Processar cada obra encontrada
        for i, link_quadro in enumerate(links_quadros, 1):
            # Verificar se deve parar antes de cada obra
            if self._parar_scraping:
                self.logger.warning(f"Parada solicitada. Interrompendo processamento da página {numero_pagina}")
                break
            
            try:
                self.logger.debug(f"  Processando obra {i}/{len(links_quadros)}: {link_quadro}")
                self.processar_obra(link_quadro, numero_pagina, categoria)
                time.sleep(self.delay_between_requests)
            except Exception as e:
                self.logger.error(f"  Erro ao processar obra {link_quadro}: {e}")
                continue
    
    def obra_ja_existe(self, url: str) -> bool:
        """Verifica se a obra já existe no banco de dados"""
        if not self.db_session:
            return False
        
        try:
            from database.models import Obra
            existe = self.db_session.query(Obra).filter(
                Obra.url == url,
                Obra.scraper_name == "iarremate"
            ).first()
            return existe is not None
        except Exception as e:
            self.logger.warning(f"Erro ao verificar duplicata: {e}")
            return False
    
    def parar_scraping(self):
        """Marca o scraping para parar"""
        self._parar_scraping = True
        self.logger.info("⚠️ Solicitação de parada recebida. Finalizando após salvar dados atuais...")
    
    def _validar_titulo_obra(self, texto: str) -> bool:
        """Valida se o texto parece ser um título de obra válido"""
        if not texto or len(texto) < 10:
            return False
        
        texto_lower = texto.lower().strip()
        
        # Rejeitar textos genéricos comuns (exatamente ou contendo)
        textos_rejeitados = [
            'belas artes', 'utilizamos', 'cookies', 'política', 'privacidade',
            'termos', 'condições', 'sobre', 'contato', 'home', 'início',
            'menu', 'navegação', 'buscar', 'pesquisar', 'login', 'cadastro',
            'apóiam', 'apoiam', 'institutos', 'leilão', 'leilões', 'lote',
            'quadros', 'esculturas', 'arte africana', 'arte brasileira',
            'ficha técnica', 'valor atual', 'seu lance', 'lançar'
        ]
        
        # Rejeitar se o texto for exatamente um dos textos rejeitados
        if texto_lower in textos_rejeitados:
            return False
        
        # Rejeitar se começar com textos genéricos
        for rejeitado in textos_rejeitados:
            if texto_lower.startswith(rejeitado) or texto_lower == rejeitado:
                return False
        
        # Deve ter pelo menos uma palavra com mais de 3 letras (nome de artista/obra)
        palavras = re.findall(r'\b\w+\b', texto)
        palavras_validas = [p for p in palavras if len(p) > 3 and p.isalpha()]
        if len(palavras_validas) < 2:
            return False
        
        # Não deve ser apenas números ou caracteres especiais
        if re.match(r'^[\d\s\-.,R$]+$', texto):
            return False
        
        # Preferir títulos que tenham hífen (formato comum: "Artista - Título")
        # Mas não rejeitar se não tiver (alguns títulos podem não ter)
        # Se tiver hífen, é mais provável que seja um título válido
        
        return True
    
    def extrair_titulo_iarremate(self, soup: BeautifulSoup) -> str:
        """Extrai o título específico do iArremate com validação rigorosa"""
        titulo = "N/A"
        
        try:
            # Estratégia 1: Buscar em div.nome > h2 > a (estrutura mais específica)
            div_nome = soup.find('div', class_=re.compile(r'nome', re.IGNORECASE))
            if div_nome:
                h2 = div_nome.find('h2')
                if h2:
                    link = h2.find('a')
                    if link:
                        texto = link.get_text(strip=True)
                        if self._validar_titulo_obra(texto):
                            return texto
            
            # Estratégia 2: Buscar em h2 > a (estrutura comum do iArremate)
            h2_tags = soup.find_all('h2')
            for h2 in h2_tags:
                link = h2.find('a')
                if link:
                    texto = link.get_text(strip=True)
                    if self._validar_titulo_obra(texto):
                        return texto
            
            # Estratégia 3: Buscar em elementos com classes específicas de título
            classes_titulo = ['titulo', 'title', 'nome-obra', 'obra-titulo', 'artwork-title']
            for classe in classes_titulo:
                elementos = soup.find_all(['div', 'h1', 'h2', 'h3'], class_=re.compile(classe, re.IGNORECASE))
                for elemento in elementos:
                    texto = elemento.get_text(strip=True)
                    if self._validar_titulo_obra(texto):
                        return texto
            
            # Estratégia 4: Buscar próximo ao texto "Ficha Técnica" (contexto da página)
            ficha_tecnica = soup.find(text=re.compile(r'Ficha Técnica|Ficha tecnica', re.IGNORECASE))
            if ficha_tecnica:
                # Buscar elementos próximos
                parent = ficha_tecnica.parent
                if parent:
                    # Buscar h2 ou div com título antes da ficha técnica
                    elementos_anteriores = parent.find_all_previous(['h1', 'h2', 'div'], limit=5)
                    for elemento in elementos_anteriores:
                        texto = elemento.get_text(strip=True)
                        if self._validar_titulo_obra(texto):
                            return texto
            
            # Estratégia 5: Buscar em h1 (fallback com validação)
            h1_tag = soup.find('h1')
            if h1_tag:
                texto = h1_tag.get_text(strip=True)
                if self._validar_titulo_obra(texto):
                    return texto
            
            # Estratégia 6: Tag title (último recurso com validação)
            title_tag = soup.find('title')
            if title_tag:
                texto = title_tag.get_text(strip=True)
                # Limpar título se tiver " - iArremate" ou similar
                if 'iarremate' in texto.lower() or 'belas artes' in texto.lower():
                    partes = re.split(r'\s*-\s*', texto)
                    for parte in partes:
                        parte = parte.strip()
                        if self._validar_titulo_obra(parte):
                            return parte
                elif self._validar_titulo_obra(texto):
                    return texto
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair título iArremate: {e}")
        
        return titulo if titulo and titulo != "N/A" else "N/A"
    
    def extrair_descricao_iarremate(self, soup: BeautifulSoup, titulo: str = None) -> str:
        """Extrai a descrição específica do iArremate (usa o título se disponível)"""
        # A descrição curta é o mesmo que o título
        if titulo and titulo != "N/A":
            return titulo
        
        return "N/A"
    
    def extrair_data_inicio_leilao_iarremate(self, soup: BeautifulSoup) -> str:
        """Extrai a data/hora de início do leilão"""
        data_inicio = "nao tem"
        
        try:
            # Estratégia 1: Buscar por "ESTE LEILÃO COMEÇA EM" ou similar
            inicio_labels = soup.find_all(text=re.compile(r'ESTE LEILÃO COMEÇA EM|Este leilão começa em|Leilão começa|Começa em', re.IGNORECASE))
            for label in inicio_labels:
                parent = label.parent
                if parent:
                    # Buscar próximo elemento com a data/hora
                    next_sibling = parent.find_next_sibling()
                    if next_sibling:
                        texto = next_sibling.get_text(strip=True)
                        # Pode ser um countdown ou data específica
                        if texto:
                            data_inicio = texto
                            return data_inicio
                    
                    # Buscar no próprio elemento pai
                    texto_pai = parent.get_text(strip=True)
                    # Extrair data/hora do texto
                    # Padrão: "ESTE LEILÃO COMEÇA EM: DD/MM/YYYY HH:MM"
                    match = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})', texto_pai)
                    if match:
                        data_inicio = match.group(1)
                        return data_inicio
            
            # Estratégia 2: Buscar countdown timer (ex: "23D 22H 43M 36S")
            countdown_pattern = r'(\d+D\s+\d+H\s+\d+M\s+\d+S)'
            texto_completo = soup.get_text()
            match = re.search(countdown_pattern, texto_completo)
            if match:
                countdown = match.group(1)
                # Tentar encontrar data próxima ao countdown
                # Buscar por "ESTE LEILÃO COMEÇA EM" antes do countdown
                pos_countdown = texto_completo.find(countdown)
                texto_antes = texto_completo[max(0, pos_countdown-200):pos_countdown]
                match_data = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})', texto_antes)
                if match_data:
                    data_inicio = match_data.group(1)
                    return data_inicio
                else:
                    # Se não encontrar data, retornar o countdown
                    data_inicio = f"Countdown: {countdown}"
                    return data_inicio
            
            # Estratégia 3: Buscar em elementos com classes relacionadas a data/hora
            data_elements = soup.find_all(['div', 'span', 'time'], 
                                        class_=re.compile(r'data|hora|inicio|comeca|countdown|timer', re.IGNORECASE))
            for elemento in data_elements:
                texto = elemento.get_text(strip=True)
                # Verificar se contém data/hora
                match = re.search(r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})', texto)
                if match:
                    data_inicio = match.group(1)
                    return data_inicio
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair data de início do leilão: {e}")
        
        return data_inicio if data_inicio != "nao tem" else "nao tem"
    
    def extrair_lote_iarremate(self, soup: BeautifulSoup) -> str:
        """Extrai o número do lote do iArremate"""
        lote = "N/A"
        
        try:
            # Estratégia 1: Buscar div com class="nlote" (mais específico e confiável)
            lote_div = soup.find('div', class_='nlote')
            if lote_div:
                texto_lote = lote_div.get_text(strip=True)
                if texto_lote and re.match(r'^\d+$', texto_lote):
                    lote = texto_lote
                    return lote
            
            # Estratégia 2: Buscar div com class contendo "lote" (variações)
            lote_divs = soup.find_all('div', class_=lambda x: x and 'lote' in str(x).lower())
            for div in lote_divs:
                texto = div.get_text(strip=True)
                if texto and re.match(r'^\d+$', texto):
                    lote = texto
                    return lote
            
            # Estratégia 3: Buscar em elementos com classes relacionadas a lote
            lote_candidates = soup.find_all(['span', 'div', 'strong', 'b'], 
                                          class_=re.compile(r'badge|numero|lote|lot|num', re.IGNORECASE))
            for candidate in lote_candidates:
                texto = candidate.get_text(strip=True)
                # Se for apenas um número, pode ser o lote
                if re.match(r'^\d+$', texto):
                    # Verificar se está próximo a informações da obra
                    parent_text = candidate.parent.get_text() if candidate.parent else ""
                    if any(keyword in parent_text.lower() for keyword in ['belas artes', 'quadro', 'escultura', 'pintura']):
                        lote = texto
                        return lote
            
            # Estratégia 4: Buscar número que aparece antes de "Belas Artes"
            belas_artes_elements = soup.find_all(string=re.compile(r'Belas Artes', re.IGNORECASE))
            for belas_artes_text in belas_artes_elements:
                parent = belas_artes_text.parent
                if parent:
                    texto_completo = parent.get_text()
                    match = re.search(r'(\d+)\s*Belas Artes', texto_completo, re.IGNORECASE)
                    if match:
                        lote = match.group(1)
                        return lote
                    
                    # Buscar em irmãos anteriores
                    for sibling in parent.find_previous_siblings():
                        texto_sibling = sibling.get_text(strip=True)
                        if re.match(r'^\d+$', texto_sibling):
                            lote = texto_sibling
                            return lote
            
            # Estratégia 5: Buscar padrões comuns de lote no texto completo
            texto_completo = soup.get_text()
            lote_patterns = [
                r'Lote\s*[:\-]?\s*(\d+)',
                r'LOTE\s*[:\-]?\s*(\d+)',
                r'#\s*(\d+)',
            ]
            for pattern in lote_patterns:
                match = re.search(pattern, texto_completo, re.IGNORECASE)
                if match:
                    lote = match.group(1)
                    return lote
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair lote iArremate: {e}")
        
        return lote if lote and lote != "N/A" else "N/A"
    
    def extrair_valor_iarremate(self, soup: BeautifulSoup) -> str:
        """Extrai o valor específico do iArremate"""
        valor = "N/A"
        
        try:
            # Estratégia 1: Buscar por "Valor Atual (BRL)" ou "Valor Atual"
            valor_labels = soup.find_all(text=re.compile(r'Valor Atual|Valor atual', re.IGNORECASE))
            for label in valor_labels:
                # Buscar no elemento pai e irmãos
                parent = label.parent
                if parent:
                    # Buscar próximo elemento com o valor
                    next_sibling = parent.find_next_sibling()
                    if next_sibling:
                        texto = next_sibling.get_text(strip=True)
                        valor_match = re.search(r'R\$\s*([\d.,]+)', texto)
                        if valor_match:
                            valor = valor_match.group(1)
                            return valor
                    
                    # Buscar no próprio elemento pai
                    texto_pai = parent.get_text(strip=True)
                    valor_match = re.search(r'R\$\s*([\d.,]+)', texto_pai)
                    if valor_match:
                        valor = valor_match.group(1)
                        return valor
            
            # Estratégia 2: Buscar em div com classes relacionadas a valor
            valor_divs = soup.find_all(['div', 'span'], class_=re.compile(r'valor|price|preco|lance', re.IGNORECASE))
            for div in valor_divs:
                texto = div.get_text(strip=True)
                valor_match = re.search(r'R\$\s*([\d.,]+)', texto)
                if valor_match:
                    valor = valor_match.group(1)
                    # Validar que é um valor razoável (não muito pequeno)
                    valor_num = valor.replace('.', '').replace(',', '.')
                    try:
                        if float(valor_num) > 10:  # Valores acima de R$ 10
                            return valor
                    except:
                        pass
            
            # Estratégia 3: Buscar padrão R$ em qualquer lugar
            texto_completo = soup.get_text()
            valor_match = re.search(r'R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)', texto_completo)
            if valor_match:
                valor = valor_match.group(1)
                return valor
            
            # Estratégia 4: Usar método base como fallback
            valor = self.extrair_valor(soup)
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair valor iArremate: {e}")
            # Fallback para método base
            valor = self.extrair_valor(soup)
        
        return valor if valor and valor != "N/A" else "N/A"
    
    def processar_obra(self, url_quadro: str, numero_pagina: int, categoria: str = None):
        """Processa um quadro específico e extrai seus dados"""
        # Verificar se já foi coletado nesta execução
        if url_quadro in self.urls_coletadas:
            self.logger.debug(f"    ⊘ Obra já coletada nesta execução: {url_quadro}")
            return
        
        # Verificar se já existe no banco
        if self.obra_ja_existe(url_quadro):
            self.logger.info(f"    ⊘ Obra já existe no banco (pulando): {url_quadro}")
            self.urls_coletadas.add(url_quadro)
            return
        
        response = self.fazer_requisicao(url_quadro)
        if not response:
            return
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extrair dados do quadro usando métodos específicos do iArremate
        titulo = self.extrair_titulo_iarremate(soup)
        descricao = self.extrair_descricao_iarremate(soup, titulo)  # Descrição = título
        nome_artista = self.extrair_nome_artista(titulo, descricao)
        valor = self.extrair_valor_iarremate(soup)
        lote = self.extrair_lote_iarremate(soup)
        data_inicio_leilao = self.extrair_data_inicio_leilao_iarremate(soup)
        
        # VERIFICAR SE TEM VALOR - IGNORAR SE NÃO TIVER
        if not valor or valor == "N/A":
            self.logger.info(f"    ⊘ Obra sem valor (ignorando): {url_quadro}")
            self.urls_coletadas.add(url_quadro)  # Adicionar ao cache para não processar novamente
            return
        
        # Validar que o valor é um número válido
        try:
            valor_limpo = valor.replace('R$', '').replace('.', '').replace(',', '.').strip()
            valor_float = float(valor_limpo)
            if valor_float <= 0:
                self.logger.info(f"    ⊘ Obra com valor inválido (ignorando): {url_quadro} - Valor: {valor}")
                self.urls_coletadas.add(url_quadro)
                return
        except (ValueError, AttributeError):
            self.logger.info(f"    ⊘ Obra com valor inválido (ignorando): {url_quadro} - Valor: {valor}")
            self.urls_coletadas.add(url_quadro)
            return
        
        # Determinar categoria se não foi fornecida
        categoria_final = categoria
        if not categoria_final:
            # Tentar detectar pela URL
            if '/escultura' in url_quadro.lower():
                categoria_final = "Esculturas"
            elif '/quadro' in url_quadro.lower() or '/pintura' in url_quadro.lower():
                categoria_final = "Quadros"
            else:
                categoria_final = "Quadros"  # Padrão
        
        # Criar entrada de dados
        dados_quadro = {
            'Nome_Artista': nome_artista,
            'Categoria': categoria_final,
            'Pagina': numero_pagina,
            'Titulo': titulo,
            'Descricao': descricao,
            'Descricao_Completa': descricao_completa,
            'Valor': valor,
            'Lote': lote,
            'Data_Inicio_Leilao': data_inicio_leilao,
            'URL': url_quadro,
            'Data_Coleta': time.strftime('%d/%m/%Y %H:%M:%S')
        }
        
        self.dados_obras.append(dados_quadro)
        self.urls_coletadas.add(url_quadro)
        self.logger.info(f"    ✓ Obra coletada ({categoria_final}): {nome_artista} - Valor: R$ {valor}")
    
    def executar_scraping(self, categorias: List[str] = None, max_paginas: int = None):
        """Executa o scraping completo para quadros e esculturas"""
        self.logger.info("=== INICIANDO SCRAPING DO IARREMATE - BELAS ARTES ===")
        self.logger.info(f"URL Base: {self.base_url}")
        self._parar_scraping = False  # Resetar flag
        
        # Se não especificou categorias, buscar ambas (quadros e esculturas)
        if categorias is None:
            categorias = ["quadros", "esculturas"]
        
        self.logger.info(f"Categorias a coletar: {', '.join(categorias)}")
        
        total_obras_coletadas = 0
        
        # Processar cada categoria
        for categoria in categorias:
            if self._parar_scraping:
                break
            
            self.logger.info(f"\n{'='*60}")
            self.logger.info(f"COLETANDO: {categoria.upper()}")
            self.logger.info(f"{'='*60}")
            
            # URL específica para a categoria
            if categoria.lower() == "quadros":
                url_categoria = "https://www.iarremate.com/belas-artes/quadros"
            elif categoria.lower() == "esculturas":
                url_categoria = "https://www.iarremate.com/belas-artes/esculturas"
            else:
                # Fallback para outras categorias
                url_categoria = f"{self.base_url}/{categoria.lower()}"
            
            # Descobrir total de páginas para esta categoria
            if max_paginas is None:
                total_paginas = self.descobrir_total_paginas(categoria=categoria)
            else:
                total_paginas = max_paginas
                self.logger.info(f"Usando limite de {max_paginas} páginas para {categoria}")
            
            if total_paginas == 0:
                self.logger.warning(f"Nenhuma página encontrada para {categoria}!")
                continue
            
            self.logger.info(f"Iniciando coleta de {total_paginas} páginas de {categoria}...")
            
            # Processar cada página da categoria
            for pagina in range(1, total_paginas + 1):
                # Verificar se deve parar
                if self._parar_scraping:
                    self.logger.warning(f"⚠️ Scraping interrompido pelo usuário na página {pagina} de {categoria}")
                    self.logger.info(f"📊 Total coletado até agora: {len(self.dados_obras)} obras")
                    break
                
                if pagina == 1:
                    url = url_categoria
                else:
                    url = f"{url_categoria}/pg{pagina}"
                
                self.processar_pagina(url, pagina, categoria=categoria)
                
                # Log de progresso
                if pagina % 5 == 0:
                    self.logger.info(f"📈 Progresso {categoria}: {pagina}/{total_paginas} páginas | {len(self.dados_obras)} obras coletadas")
            
            obras_categoria = len(self.dados_obras) - total_obras_coletadas
            total_obras_coletadas = len(self.dados_obras)
            self.logger.info(f"✅ {categoria.capitalize()}: {obras_categoria} obras coletadas")
        
        if self._parar_scraping:
            self.logger.info("=== SCRAPING INTERROMPIDO PELO USUÁRIO ===")
        else:
            self.logger.info("=== SCRAPING CONCLUÍDO ===")
        
        self.logger.info(f"Total de obras coletadas: {len(self.dados_obras)}")
        self.logger.info(f"Total de obras únicas (sem duplicatas): {len(self.urls_coletadas)}")

