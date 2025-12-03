#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web Scraper para LeilõesBR - Quadros e Esculturas
Coleta dados de quadros e esculturas do site LeilõesBR
"""

import re
import time
from typing import Optional, Dict, List
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from .base_scraper import BaseScraper


class LeiloesBRScraper(BaseScraper):
    """Scraper para coletar dados de quadros e esculturas do site LeilõesBR"""
    
    def __init__(self, base_url: str = "https://leiloesbr.com.br", 
                 output_dir: str = "output", logs_dir: str = "logs", 
                 max_retries: int = 3, delay_between_requests: float = 1.0,
                 db_session=None, session_id: int = None):
        """
        Inicializa o scraper do LeilõesBR
        
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
            scraper_name="leiloes_br"
        )
        self.db_session = db_session
        self.session_id = session_id
        self._parar_scraping = False
        self.urls_coletadas = set()
        
        # URLs específicas fornecidas pelo usuário
        self.url_quadros = "https://leiloesbr.com.br/busca_andamento.asp?op=1&pesquisa=quadros&ga=*&uf=*&v=126&b=0&tp=|"
        self.url_esculturas = "https://leiloesbr.com.br/buscapos.asp?pesquisa=Esculturas"
    
    def parar_scraping(self):
        """Marca o scraping para parar"""
        self._parar_scraping = True
        self.logger.info("⚠️ Solicitação de parada recebida. Finalizando após salvar dados atuais...")
    
    def obra_ja_existe(self, url: str) -> bool:
        """Verifica se a obra já existe no banco de dados"""
        if not self.db_session:
            return False
        
        try:
            from database.models import Obra
            existe = self.db_session.query(Obra).filter(
                Obra.url == url,
                Obra.scraper_name == "leiloes_br"
            ).first()
            return existe is not None
        except Exception as e:
            self.logger.warning(f"Erro ao verificar duplicata: {e}")
            return False
    
    def descobrir_total_paginas(self, categoria: str = None) -> int:
        """Descobre o total de páginas disponíveis para uma categoria"""
        if categoria.lower() == "quadros":
            url_base = self.url_quadros
        elif categoria.lower() == "esculturas":
            url_base = self.url_esculturas
        else:
            self.logger.error(f"Categoria inválida: {categoria}")
            return 0
        
        self.logger.info(f"Descobrindo total de páginas para: {categoria}...")
        
        # Fazer requisição da primeira página
        response = self.fazer_requisicao(url_base)
        if not response:
            return 0
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscar paginação
        try:
            # Estratégia 1: Contar itens e dividir por itens por página
            # Buscar "X Itens encontrados"
            itens_text = soup.find(text=re.compile(r'\d+\s+Itens encontrados', re.IGNORECASE))
            if itens_text:
                match = re.search(r'(\d+)\s+Itens encontrados', itens_text, re.IGNORECASE)
                if match:
                    total_itens = int(match.group(1))
                    # Buscar quantos itens por página (padrão: 126 ou 21)
                    visualizar_text = soup.find(text=re.compile(r'VISUALIZAR:', re.IGNORECASE))
                    itens_por_pagina = 126  # Padrão para quadros
                    if visualizar_text:
                        parent = visualizar_text.parent
                        if parent:
                            # Buscar select ou próximo elemento com número
                            select = parent.find_next('select')
                            if select:
                                option = select.find('option', selected=True)
                                if option:
                                    itens_por_pagina = int(option.get_text(strip=True))
                            else:
                                # Tentar pegar número próximo ao texto "VISUALIZAR:"
                                texto_parent = parent.get_text()
                                match_num = re.search(r'VISUALIZAR:\s*(\d+)', texto_parent, re.IGNORECASE)
                                if match_num:
                                    itens_por_pagina = int(match_num.group(1))
                    
                    total_paginas = (total_itens + itens_por_pagina - 1) // itens_por_pagina
                    self.logger.info(f"Total calculado: {total_paginas} páginas ({total_itens} itens, {itens_por_pagina} por página)")
                    return total_paginas
            
            # Estratégia 2: Buscar por "PÁGINA:" e encontrar os números de página
            pagina_elements = soup.find_all(text=re.compile(r'PÁGINA|Página', re.IGNORECASE))
            for elem in pagina_elements:
                parent = elem.parent
                if parent:
                    # Buscar todos os links e números próximos
                    # Pode estar em links <a> ou em spans/divs
                    max_pagina = 1
                    
                    # Buscar links de página
                    links_pagina = parent.find_all_next('a', href=True, limit=30)
                    for link in links_pagina:
                        texto = link.get_text(strip=True)
                        if texto.isdigit():
                            num = int(texto)
                            if num > max_pagina and num < 1000:  # Limite razoável
                                max_pagina = num
                    
                    # Buscar números no texto próximo
                    texto_parent = parent.get_text()
                    numeros = re.findall(r'\b(\d+)\b', texto_parent)
                    for num_str in numeros:
                        num = int(num_str)
                        if num > max_pagina and num < 1000:
                            max_pagina = num
                    
                    if max_pagina > 1:
                        self.logger.info(f"Total de páginas encontrado: {max_pagina}")
                        return max_pagina
        except Exception as e:
            self.logger.warning(f"Erro ao descobrir páginas: {e}")
        
        # Se não conseguir descobrir, retornar 1 (pelo menos uma página)
        self.logger.warning("Não foi possível descobrir total de páginas, usando 1")
        return 1
    
    def processar_pagina(self, url: str, numero_pagina: int, categoria: str = None):
        """Processa uma página específica e extrai dados das obras"""
        if self._parar_scraping:
            return
        
        self.logger.info(f"Processando página {numero_pagina}: {url}")
        
        response = self.fazer_requisicao(url)
        if not response:
            self.logger.error(f"Erro ao acessar página {numero_pagina}")
            return
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Buscar obras na página - geralmente estão em divs com classes específicas
        obras = self._encontrar_obras_na_pagina(soup)
        
        self.logger.info(f"Encontradas {len(obras)} obras na página {numero_pagina}")
        
        # Processar cada obra encontrada
        total_obras = len(obras)
        self.logger.info(f"📦 Encontradas {total_obras} obras na página {numero_pagina}")
        
        if total_obras == 0:
            self.logger.warning("⚠️ Nenhuma obra encontrada na página!")
            return
        
        obras_processadas = 0
        obras_puladas = 0
        
        for i, obra_data in enumerate(obras, 1):
            if self._parar_scraping:
                break
            
            try:
                # Log de progresso a cada 5 obras ou na primeira
                if i % 5 == 0 or i == 1:
                    self.logger.info(f"  ⏳ Progresso: {i}/{total_obras} obras | Processadas: {obras_processadas} | Puladas: {obras_puladas}")
                
                # Verificar se já existe antes de fazer requisição (mais rápido)
                url_obra = obra_data.get('url', '')
                if url_obra and self.obra_ja_existe(url_obra):
                    obras_puladas += 1
                    self.urls_coletadas.add(url_obra)
                    continue
                
                self.processar_obra_da_listagem(obra_data, numero_pagina, categoria)
                obras_processadas += 1
                
                # Delay reduzido entre requisições (0.3s ao invés de 1s para ser mais rápido)
                time.sleep(0.3)
            except Exception as e:
                self.logger.error(f"  ❌ Erro ao processar obra {i}: {e}")
                continue
        
        self.logger.info(f"✅ Página {numero_pagina} concluída: {obras_processadas} novas, {obras_puladas} puladas")
    
    def _encontrar_obras_na_pagina(self, soup: BeautifulSoup) -> List[Dict]:
        """Encontra todas as obras na página de listagem"""
        obras = []
        
        try:
            # Estratégia 1: Buscar por divs com classes de produto/card (mais confiável)
            # Baseado na estrutura do site, os cards têm classes específicas
            cards = soup.find_all(['div', 'article', 'section'], 
                                class_=lambda x: x and any(
                                    keyword in str(x).lower() 
                                    for keyword in ['product', 'item', 'card', 'peca', 'obra', 'lote', 'grid']
                                ))
            
            for card in cards:
                # Buscar link dentro do card
                link = card.find('a', href=re.compile(r'peca\.asp|item\.asp|lote|busca', re.IGNORECASE))
                if not link:
                    # Tentar buscar qualquer link no card
                    link = card.find('a', href=True)
                    if not link:
                        continue
                
                href = link.get('href', '')
                if not href:
                    continue
                
                # Filtrar links que não são de obras
                if any(skip in href.lower() for skip in ['busca', 'categoria', 'filtro', 'pagina']):
                    continue
                
                # Normalizar URL
                if href.startswith('/'):
                    href = urljoin(self.base_url, href)
                elif not href.startswith('http'):
                    href = urljoin(self.base_url, '/' + href)
                
                # Extrair dados básicos do card
                titulo = self._extrair_titulo_do_card(card, link)
                valor = self._extrair_valor_do_card(card)
                imagem_url = self._extrair_imagem_do_card(card)
                data_leilao = self._extrair_data_leilao_do_card(card)
                leiloeiro = self._extrair_leiloeiro_do_card(card)
                
                # Verificar se já foi adicionada (evitar duplicatas)
                if href not in [o.get('url') for o in obras]:
                    obras.append({
                        'url': href,
                        'titulo': titulo,
                        'valor': valor,
                        'imagem': imagem_url,
                        'data_leilao': data_leilao,
                        'leiloeiro': leiloeiro,
                        'card_element': card
                    })
            
            # Estratégia 2: Se não encontrou nada, buscar por links diretos
            if not obras:
                links_pecas = soup.find_all('a', href=re.compile(r'peca\.asp|item\.asp', re.IGNORECASE))
                
                for link in links_pecas:
                    href = link.get('href', '')
                    if not href:
                        continue
                    
                    # Normalizar URL
                    if href.startswith('/'):
                        href = urljoin(self.base_url, href)
                    elif not href.startswith('http'):
                        href = urljoin(self.base_url, '/' + href)
                    
                    # Buscar informações da obra no elemento pai
                    parent_card = link.find_parent(['div', 'article', 'section'])
                    if not parent_card:
                        continue
                    
                    titulo = self._extrair_titulo_do_card(parent_card, link)
                    valor = self._extrair_valor_do_card(parent_card)
                    imagem_url = self._extrair_imagem_do_card(parent_card)
                    
                    if href not in [o.get('url') for o in obras]:
                        obras.append({
                            'url': href,
                            'titulo': titulo,
                            'valor': valor,
                            'imagem': imagem_url,
                            'card_element': parent_card
                        })
        
        except Exception as e:
            self.logger.error(f"Erro ao encontrar obras na página: {e}")
        
        return obras
    
    def _extrair_titulo_do_card(self, card, link) -> str:
        """Extrai o título da obra do card da listagem"""
        try:
            # Estratégia 1: Buscar em divs com classes de título/nome
            titulo_divs = card.find_all(['div', 'span', 'p'], 
                                      class_=lambda x: x and any(
                                          keyword in str(x).lower() 
                                          for keyword in ['title', 'titulo', 'nome', 'name', 'product-title']
                                      ))
            for div in titulo_divs:
                titulo = div.get_text(strip=True)
                # Remover quebras de linha e espaços extras
                titulo = ' '.join(titulo.split())
                if titulo and len(titulo) > 10:
                    return titulo
            
            # Estratégia 2: Buscar em h2, h3, h4 dentro do card
            for tag in ['h2', 'h3', 'h4', 'h5']:
                heading = card.find(tag)
                if heading:
                    titulo = heading.get_text(strip=True)
                    titulo = ' '.join(titulo.split())
                    if titulo and len(titulo) > 10:
                        return titulo
            
            # Estratégia 3: Tentar pegar do texto do link
            titulo = link.get_text(strip=True)
            titulo = ' '.join(titulo.split())
            if titulo and len(titulo) > 10:
                return titulo
            
            # Estratégia 4: Buscar em qualquer elemento dentro do card que tenha texto longo
            # Mas não seja preço, data, etc.
            elementos = card.find_all(['div', 'span', 'p', 'a'])
            for elem in elementos:
                texto = elem.get_text(strip=True)
                texto = ' '.join(texto.split())
                # Verificar se não é preço, data, ou texto muito curto
                if (len(texto) > 15 and 
                    not re.search(r'R\$\s*[\d.,]+', texto) and
                    not re.search(r'\d{2}/\d{2}/\d{4}', texto) and
                    'leilão' not in texto.lower() and
                    'leiloeiro' not in texto.lower()):
                    return texto
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair título do card: {e}")
        
        return "N/A"
    
    def _extrair_valor_do_card(self, card) -> str:
        """Extrai o valor da obra do card da listagem"""
        try:
            # Estratégia 1: Buscar em elementos com classes específicas de preço
            # Baseado na imagem: class="product-price venda-price"
            valor_elements = card.find_all(['div', 'span', 'strong', 'p'], 
                                         class_=lambda x: x and any(
                                             keyword in str(x).lower() 
                                             for keyword in ['price', 'valor', 'preco', 'venda']
                                         ))
            for elem in valor_elements:
                texto = elem.get_text(strip=True)
                # Buscar padrão R$ seguido de números
                match = re.search(r'R\$\s*([\d.,]+)', texto)
                if match:
                    valor = match.group(1)
                    # Validar que é um valor razoável
                    valor_num = valor.replace('.', '').replace(',', '.')
                    try:
                        if float(valor_num) > 0:
                            return valor
                    except:
                        pass
            
            # Estratégia 2: Buscar por padrão R$ seguido de números no texto do card
            texto_card = card.get_text()
            matches = list(re.finditer(r'R\$\s*([\d.,]+)', texto_card))
            if matches:
                # Pegar o primeiro valor encontrado (geralmente é o valor da obra)
                for match in matches:
                    valor = match.group(1)
                    valor_num = valor.replace('.', '').replace(',', '.')
                    try:
                        if float(valor_num) > 0:
                            return valor
                    except:
                        continue
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair valor do card: {e}")
        
        return "N/A"
    
    def _extrair_imagem_do_card(self, card) -> str:
        """Extrai a URL da imagem do card"""
        try:
            img = card.find('img', src=True)
            if img:
                src = img.get('src', '')
                if src.startswith('/'):
                    return urljoin(self.base_url, src)
                elif not src.startswith('http'):
                    return urljoin(self.base_url, '/' + src)
                return src
        except:
            pass
        return ""
    
    def _extrair_data_leilao_do_card(self, card) -> str:
        """Extrai a data/hora do leilão do card"""
        try:
            texto_card = card.get_text()
            # Padrão: "DD/MM/YYYY - HHh" ou "DD/MM/YYYY HH:MM"
            match = re.search(r'(\d{2}/\d{2}/\d{4})\s*[-–]\s*(\d{1,2})h', texto_card)
            if match:
                return f"{match.group(1)} {match.group(2)}:00"
            
            match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})', texto_card)
            if match:
                return f"{match.group(1)} {match.group(2)}"
        except:
            pass
        return ""
    
    def _extrair_leiloeiro_do_card(self, card) -> str:
        """Extrai o nome do leiloeiro do card"""
        try:
            texto_card = card.get_text()
            # Buscar padrões comuns de nomes de leiloeiros
            # Geralmente aparece no final do card
            leiloeiro_elements = card.find_all(['div', 'span', 'p'], 
                                              class_=re.compile(r'leiloeiro|seller|vendedor', re.IGNORECASE))
            for elem in leiloeiro_elements:
                texto = elem.get_text(strip=True)
                if texto and len(texto) > 5:
                    return texto
        except:
            pass
        return ""
    
    def processar_obra(self, url_obra: str, numero_pagina: int, categoria: str = None):
        """Processa uma obra específica e extrai seus dados (método abstrato requerido)"""
        # Wrapper para processar_obra_da_listagem
        obra_data = {
            'url': url_obra,
            'titulo': 'N/A',
            'valor': 'N/A',
            'imagem': '',
            'data_leilao': '',
            'leiloeiro': ''
        }
        self.processar_obra_da_listagem(obra_data, numero_pagina, categoria)
    
    def processar_obra_da_listagem(self, obra_data: Dict, numero_pagina: int, categoria: str):
        """Processa uma obra encontrada na listagem"""
        url_obra = obra_data.get('url', '')
        if not url_obra:
            return
        
        # Verificar se já foi coletada nesta execução (mesma regra do iArremate)
        if url_obra in self.urls_coletadas:
            self.logger.debug(f"    ⊘ Obra já coletada nesta execução: {url_obra}")
            return
        
        # Verificar se já existe no banco ANTES de fazer requisição (mesma regra do iArremate)
        if self.obra_ja_existe(url_obra):
            self.logger.info(f"    ⊘ Obra já existe no banco (pulando): {url_obra}")
            self.urls_coletadas.add(url_obra)  # Adicionar ao cache para não verificar novamente
            return
        
        # Fazer requisição para a página da obra (pode redirecionar)
        response = self.fazer_requisicao(url_obra)
        if not response:
            return
        
        url_final = response.url
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extrair dados da página da obra
        # Usar dados do card como fallback se disponíveis
        titulo_card = obra_data.get('titulo', 'N/A')
        valor_card = obra_data.get('valor', 'N/A')
        
        titulo = self.extrair_titulo_leiloes_br(soup, titulo_card)
        descricao = self.extrair_descricao_leiloes_br(soup, titulo)
        nome_artista = self.extrair_nome_artista(titulo, descricao)
        valor = self.extrair_valor_leiloes_br(soup, valor_card)
        
        # VERIFICAR SE TEM VALOR - IGNORAR SE NÃO TIVER
        if not valor or valor == "N/A":
            self.logger.info(f"    ⊘ Obra sem valor (ignorando): {url_obra}")
            self.urls_coletadas.add(url_obra)  # Adicionar ao cache para não processar novamente
            return
        
        # Validar que o valor é um número válido
        try:
            valor_limpo = valor.replace('R$', '').replace('.', '').replace(',', '.').strip()
            valor_float = float(valor_limpo)
            if valor_float <= 0:
                self.logger.info(f"    ⊘ Obra com valor inválido (ignorando): {url_obra} - Valor: {valor}")
                self.urls_coletadas.add(url_obra)
                return
        except (ValueError, AttributeError):
            self.logger.info(f"    ⊘ Obra com valor inválido (ignorando): {url_obra} - Valor: {valor}")
            self.urls_coletadas.add(url_obra)
            return
        
        lote = self.extrair_lote_leiloes_br(soup, url_final)
        
        # Usar data do card se disponível, senão extrair da página
        data_inicio_leilao = obra_data.get('data_leilao', '')
        if not data_inicio_leilao:
            data_inicio_leilao = self.extrair_data_inicio_leilao_leiloes_br(soup)
        
        # Informações adicionais
        leiloeiro = obra_data.get('leiloeiro', '')
        if not leiloeiro or leiloeiro == '':
            leiloeiro = self.extrair_leiloeiro_leiloes_br(soup)
        
        local = self.extrair_local_leiloes_br(soup)
        data_leilao = self.extrair_data_leilao_leiloes_br(soup)
        
        # Determinar categoria
        categoria_final = categoria or "Quadros"
        
        # Log detalhado para debug
        self.logger.debug(f"    📋 Dados extraídos:")
        self.logger.debug(f"       Título: {titulo}")
        self.logger.debug(f"       Artista: {nome_artista}")
        self.logger.debug(f"       Valor: {valor}")
        self.logger.debug(f"       Lote: {lote}")
        self.logger.debug(f"       Data Início: {data_inicio_leilao}")
        self.logger.debug(f"       Data Leilão: {data_leilao}")
        self.logger.debug(f"       Leiloeiro: {leiloeiro}")
        self.logger.debug(f"       Local: {local}")
        
        # Criar entrada de dados
        dados_obra = {
            'Nome_Artista': nome_artista,
            'Categoria': categoria_final,
            'Pagina': numero_pagina,
            'Titulo': titulo,
            'Descricao': descricao,
            'Valor': valor,
            'Lote': lote,
            'Data_Inicio_Leilao': data_inicio_leilao,
            'Data_Leilao': data_leilao,
            'Leiloeiro': leiloeiro,
            'Local': local,
            'URL': url_final,
            'URL_Original': url_obra,
            'Site_Redirecionado': self._extrair_dominio_redirecionado(url_final) if url_final != url_obra else "N/A",
            'Data_Coleta': time.strftime('%d/%m/%Y %H:%M:%S')
        }
        
        self.dados_obras.append(dados_obra)
        self.urls_coletadas.add(url_obra)  # Adicionar ao cache após coletar (mesma regra do iArremate)
        self.logger.info(f"    ✓ Obra coletada ({categoria_final}): {nome_artista} - Valor: R$ {valor} | Lote: {lote} | Leiloeiro: {leiloeiro}")
    
    def _extrair_dominio_redirecionado(self, url: str) -> str:
        """Extrai o domínio de uma URL"""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"
    
    def extrair_titulo_leiloes_br(self, soup: BeautifulSoup, titulo_listagem: str = "N/A") -> str:
        """Extrai o título da obra da página individual"""
        # NÃO usar título da listagem se for "Lotes relacionados" ou similar
        if titulo_listagem and titulo_listagem != "N/A":
            # Ignorar títulos genéricos como "Lotes relacionados"
            if 'lotes relacionados' not in titulo_listagem.lower():
                return titulo_listagem
        
        try:
            # ESTRATÉGIA 1: Buscar em div.lote-desc (Miguel Salles específico)
            # O título real está em <div class="lote-desc text-list"> <p>...</p>
            lote_desc_divs = soup.find_all('div', class_=re.compile(r'lote-desc', re.IGNORECASE))
            for div in lote_desc_divs:
                # Buscar parágrafo dentro do div
                paragrafo = div.find('p')
                if paragrafo:
                    titulo = paragrafo.get_text(strip=True)
                    # Validar: deve ser uma descrição completa da obra (não só "Lote X")
                    if (titulo and len(titulo) > 20 and 
                        'lotes relacionados' not in titulo.lower() and
                        not titulo.lower().startswith('lote') and
                        not re.match(r'^[\d\sR$.,:LoteVisitasLance]+$', titulo, re.IGNORECASE)):
                        return titulo
                # Se não tiver <p>, pegar texto do div
                else:
                    titulo = div.get_text(strip=True)
                    if (titulo and len(titulo) > 20 and 
                        'lotes relacionados' not in titulo.lower()):
                        return titulo
            
            # ESTRATÉGIA 2: Buscar em divs com classes específicas de descrição
            # Miguel Salles e Roberto Haddad usam classes como: is-pecadesc, product-description, lote-desc, etc.
            desc_divs = soup.find_all(['div', 'span', 'p'], 
                                     class_=re.compile(r'desc|description|is-pecadesc|product-description|lote-desc|text-list', re.IGNORECASE))
            for div in desc_divs:
                titulo = div.get_text(strip=True)
                # Validar título: deve ter mais de 20 caracteres e não ser genérico
                if (titulo and len(titulo) > 20 and 
                    'lotes relacionados' not in titulo.lower() and
                    not titulo.lower().startswith('lote') and
                    not re.match(r'^[\d\sR$.,:LoteVisitasLance]+$', titulo, re.IGNORECASE)):
                    return titulo
            
            # ESTRATÉGIA 3: Buscar em h1, h2, h3 (mas validar melhor)
            for tag in ['h1', 'h2', 'h3']:
                headings = soup.find_all(tag)
                for heading in headings:
                    titulo = heading.get_text(strip=True)
                    # Validar título: deve ter mais de 10 caracteres e não ser genérico
                    if (titulo and len(titulo) > 10 and 
                        'lotes relacionados' not in titulo.lower() and
                        not titulo.lower().startswith('lote') and
                        'lote' not in titulo.lower()[:20]):  # Ignorar se começar com "Lote"
                        return titulo
            
            # ESTRATÉGIA 4: Buscar próximo ao texto "PEÇA" ou "Tipo:"
            # Geralmente o título aparece próximo a esses textos
            peca_elem = soup.find(text=re.compile(r'PEÇA|Tipo:', re.IGNORECASE))
            if peca_elem:
                parent = peca_elem.parent
                if parent:
                    # Buscar próximo elemento com descrição
                    next_elem = parent.find_next(['div', 'p', 'span'], 
                                                class_=re.compile(r'desc|description|lote-desc', re.IGNORECASE))
                    if next_elem:
                        titulo = next_elem.get_text(strip=True)
                        if (titulo and len(titulo) > 20 and 
                            'lotes relacionados' not in titulo.lower()):
                            return titulo
            
            # ESTRATÉGIA 5: Buscar tag title e limpar
            title_tag = soup.find('title')
            if title_tag:
                titulo = title_tag.get_text(strip=True)
                # Limpar se tiver " - LeilõesBR" ou similar
                if 'leilões' in titulo.lower() or 'leiloes' in titulo.lower():
                    partes = re.split(r'\s*-\s*', titulo)
                    for parte in partes:
                        parte = parte.strip()
                        if (len(parte) > 10 and 
                            'leilões' not in parte.lower() and
                            'lotes relacionados' not in parte.lower()):
                            return parte
                # Se não tiver "leilões", usar direto se for válido
                if len(titulo) > 10 and 'lotes relacionados' not in titulo.lower():
                    return titulo
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair título: {e}")
        
        return "N/A"
    
    def extrair_descricao_leiloes_br(self, soup: BeautifulSoup, titulo: str = None) -> str:
        """Extrai a descrição (usa o título se disponível)"""
        if titulo and titulo != "N/A":
            return titulo
        return "N/A"
    
    def extrair_valor_leiloes_br(self, soup: BeautifulSoup, valor_listagem: str = "N/A") -> str:
        """Extrai o valor da obra"""
        if valor_listagem and valor_listagem != "N/A":
            return valor_listagem
        
        try:
            # Buscar por padrão R$ seguido de números
            texto_completo = soup.get_text()
            matches = list(re.finditer(r'R\$\s*([\d.,]+)', texto_completo))
            if matches:
                # Pegar o primeiro valor encontrado (geralmente é o valor atual)
                return matches[0].group(1)
            
            # Buscar em elementos com classes de preço
            valor_elements = soup.find_all(['div', 'span', 'strong'], 
                                         class_=re.compile(r'price|valor|preco|venda', re.IGNORECASE))
            for elem in valor_elements:
                texto = elem.get_text(strip=True)
                match = re.search(r'R\$\s*([\d.,]+)|([\d.,]+)', texto)
                if match:
                    valor = match.group(1) or match.group(2)
                    # Validar que é um valor razoável
                    valor_num = valor.replace('.', '').replace(',', '.')
                    try:
                        if float(valor_num) > 10:
                            return valor
                    except:
                        pass
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair valor: {e}")
        
        return "N/A"
    
    def extrair_lote_leiloes_br(self, soup: BeautifulSoup, url: str) -> str:
        """Extrai o número do lote (pode estar no site redirecionado)"""
        lote = "N/A"
        
        try:
            # Estratégia 1: Buscar em breadcrumbs (mais confiável em sites redirecionados)
            # Exemplo: "HOME > LISTA DE CATÁLOGOS > LEILÃO 55780 > CATÁLOGO DE PEÇAS > LOTE 20"
            breadcrumbs = soup.find_all(['div', 'nav', 'section'], 
                                      class_=lambda x: x and any(
                                          keyword in str(x).lower() 
                                          for keyword in ['breadcrumb', 'navegacao', 'navigation']
                                      ))
            for breadcrumb in breadcrumbs:
                texto = breadcrumb.get_text()
                match = re.search(r'Lote\s+(\d+)', texto, re.IGNORECASE)
                if match:
                    lote = match.group(1)
                    return lote
            
            # Estratégia 2: Buscar no título (ex: "Lote 20" no título)
            title_tag = soup.find('title')
            if title_tag:
                titulo = title_tag.get_text()
                match = re.search(r'Lote\s+(\d+)', titulo, re.IGNORECASE)
                if match:
                    lote = match.group(1)
                    return lote
            
            # Estratégia 3: Buscar em h1, h2, h3 que contenham "Lote"
            for tag in ['h1', 'h2', 'h3', 'h4']:
                headings = soup.find_all(tag)
                for heading in headings:
                    texto = heading.get_text()
                    match = re.search(r'Lote\s+(\d+)', texto, re.IGNORECASE)
                    if match:
                        lote = match.group(1)
                        return lote
            
            # Estratégia 4: Buscar por "Lote" seguido de número em qualquer texto
            textos_lote = soup.find_all(text=re.compile(r'Lote\s+\d+|LOTE\s+\d+', re.IGNORECASE))
            for texto in textos_lote:
                match = re.search(r'Lote\s+(\d+)', str(texto), re.IGNORECASE)
                if match:
                    lote = match.group(1)
                    return lote
            
            # Estratégia 5: Buscar em elementos com classe "lote" ou similar
            lote_elements = soup.find_all(['div', 'span', 'strong', 'h1', 'h2', 'h3'], 
                                        class_=lambda x: x and 'lote' in str(x).lower())
            for elem in lote_elements:
                texto = elem.get_text(strip=True)
                # Se for apenas um número, pode ser o lote
                if re.match(r'^\d+$', texto):
                    lote = texto
                    return lote
                # Ou "Lote X"
                match = re.search(r'Lote\s+(\d+)', texto, re.IGNORECASE)
                if match:
                    lote = match.group(1)
                    return lote
            
            # Estratégia 6: Buscar em tabelas (comum em sites de leilão)
            tabelas = soup.find_all('table')
            for tabela in tabelas:
                linhas = tabela.find_all('tr')
                for linha in linhas:
                    texto_linha = linha.get_text()
                    if re.search(r'lote', texto_linha, re.IGNORECASE):
                        tds = linha.find_all('td')
                        if len(tds) >= 2:
                            # O segundo td geralmente tem o número do lote
                            texto_td = tds[1].get_text(strip=True)
                            match = re.search(r'(\d+)', texto_td)
                            if match:
                                lote = match.group(1)
                                return lote
                        # Ou buscar "Lote X" na linha
                        match = re.search(r'Lote\s+(\d+)', texto_linha, re.IGNORECASE)
                        if match:
                            lote = match.group(1)
                            return lote
            
            # Estratégia 7: Buscar padrão "Lote X" no texto completo da página
            texto_completo = soup.get_text()
            matches = list(re.finditer(r'Lote\s+(\d+)', texto_completo, re.IGNORECASE))
            if matches:
                # Pegar o primeiro match (geralmente é o lote da obra)
                lote = matches[0].group(1)
                return lote
            
            # Estratégia 8: Buscar apenas números que podem ser lote (em contexto de leilão)
            # Buscar em elementos que contenham "lote" no texto próximo
            elementos_com_lote = soup.find_all(['div', 'span', 'p', 'td'], 
                                              string=re.compile(r'\d+', re.IGNORECASE))
            for elem in elementos_com_lote:
                parent = elem.parent
                if parent:
                    texto_parent = parent.get_text()
                    if re.search(r'lote', texto_parent, re.IGNORECASE):
                        numero = elem.get_text(strip=True)
                        if re.match(r'^\d+$', numero) and 1 <= int(numero) <= 10000:
                            lote = numero
                            return lote
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair lote: {e}")
        
        return lote if lote != "N/A" else "N/A"
    
    def extrair_data_inicio_leilao_leiloes_br(self, soup: BeautifulSoup) -> str:
        """Extrai a data/hora de início do leilão - melhorado"""
        data_inicio = "nao tem"
        
        try:
            # Estratégia 1: Buscar por "DIA DO LEILÃO", "Início", "Data do Leilão"
            keywords = ['dia do leilão', 'início', 'inicio', 'data do leilão', 'data do leilao', 'horário', 'horario']
            for keyword in keywords:
                textos = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for texto in textos:
                    parent = texto.parent
                    if parent:
                        texto_completo = parent.get_text()
                        # Padrão: DD/MM/YYYY - HHh ou DD/MM/YYYY HH:MM
                        match = re.search(r'(\d{2}/\d{2}/\d{4})\s*[-–]\s*(\d{1,2})h', texto_completo)
                        if match:
                            data_inicio = f"{match.group(1)} {match.group(2)}:00"
                            return data_inicio
                        
                        match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})', texto_completo)
                        if match:
                            data_inicio = f"{match.group(1)} {match.group(2)}"
                            return data_inicio
                        
                        # Apenas data sem hora
                        match = re.search(r'(\d{2}/\d{2}/\d{4})', texto_completo)
                        if match:
                            data_inicio = match.group(1)
                            return data_inicio
            
            # Estratégia 2: Buscar em elementos com classes relacionadas a data/hora
            data_elements = soup.find_all(['div', 'span', 'td', 'p'], 
                                        class_=lambda x: x and any(
                                            keyword in str(x).lower() 
                                            for keyword in ['data', 'hora', 'horario', 'leilao', 'auction', 'inicio', 'início']
                                        ))
            for elem in data_elements:
                texto = elem.get_text(strip=True)
                # Padrão com hora: DD/MM/YYYY - HHh
                match = re.search(r'(\d{2}/\d{2}/\d{4})\s*[-–]\s*(\d{1,2})h', texto)
                if match:
                    data_inicio = f"{match.group(1)} {match.group(2)}:00"
                    return data_inicio
                
                # Padrão com hora completa: DD/MM/YYYY HH:MM
                match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2})', texto)
                if match:
                    data_inicio = f"{match.group(1)} {match.group(2)}"
                    return data_inicio
            
            # Estratégia 3: Buscar em tabelas
            tabelas = soup.find_all('table')
            for tabela in tabelas:
                linhas = tabela.find_all('tr')
                for linha in linhas:
                    texto_linha = linha.get_text()
                    if re.search(r'data|início|inicio|leilão', texto_linha, re.IGNORECASE):
                        tds = linha.find_all('td')
                        if len(tds) >= 2:
                            texto_td = tds[1].get_text(strip=True)
                            match = re.search(r'(\d{2}/\d{2}/\d{4})(?:\s+(\d{2}:\d{2})|\s*[-–]\s*(\d{1,2})h)?', texto_td)
                            if match:
                                data = match.group(1)
                                hora = match.group(2) or (match.group(3) + ":00" if match.group(3) else "")
                                if hora:
                                    data_inicio = f"{data} {hora}"
                                else:
                                    data_inicio = data
                                return data_inicio
        
        except Exception as e:
            self.logger.debug(f"Erro ao extrair data de início do leilão: {e}")
        
        return data_inicio if data_inicio != "nao tem" else "nao tem"
    
    def extrair_data_leilao_leiloes_br(self, soup: BeautifulSoup) -> str:
        """Extrai a data do leilão (formato simples) - melhorado"""
        try:
            # Estratégia 1: Buscar em elementos com classes relacionadas a data
            data_elements = soup.find_all(['div', 'span', 'td', 'p'], 
                                        class_=lambda x: x and any(
                                            keyword in str(x).lower() 
                                            for keyword in ['data', 'date', 'leilao', 'auction', 'dia']
                                        ))
            for elem in data_elements:
                texto = elem.get_text(strip=True)
                # Buscar padrão DD/MM/YYYY
                match = re.search(r'(\d{2}/\d{2}/\d{4})', texto)
                if match:
                    return match.group(1)
            
            # Estratégia 2: Buscar próximo a palavras-chave
            keywords = ['data', 'leilão', 'leilao', 'dia', 'realização']
            for keyword in keywords:
                textos = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for texto in textos:
                    parent = texto.parent
                    if parent:
                        texto_completo = parent.get_text()
                        match = re.search(r'(\d{2}/\d{2}/\d{4})', texto_completo)
                        if match:
                            return match.group(1)
            
            # Estratégia 3: Buscar qualquer data no texto completo (última tentativa)
            texto_completo = soup.get_text()
            matches = list(re.finditer(r'(\d{2}/\d{2}/\d{4})', texto_completo))
            if matches:
                # Pegar a primeira data encontrada (geralmente é a do leilão)
                return matches[0].group(1)
        except Exception as e:
            self.logger.debug(f"Erro ao extrair data do leilão: {e}")
        return "N/A"
    
    def extrair_leiloeiro_leiloes_br(self, soup: BeautifulSoup) -> str:
        """Extrai o nome do leiloeiro - melhorado"""
        try:
            # Estratégia 1: Buscar em elementos com classes específicas
            leiloeiro_elements = soup.find_all(['div', 'span', 'td', 'p'], 
                                              class_=lambda x: x and any(
                                                  keyword in str(x).lower() 
                                                  for keyword in ['leiloeiro', 'seller', 'vendedor', 'escritorio', 'auctioneer']
                                              ))
            for elem in leiloeiro_elements:
                texto = elem.get_text(strip=True)
                # Remover a palavra "Leiloeiro:" ou similar
                texto_limpo = re.sub(r'^(?:Leiloeiro|Leiloeira|Escritório)[:\s]+', '', texto, flags=re.IGNORECASE)
                texto_limpo = texto_limpo.strip()
                if texto_limpo and len(texto_limpo) > 3 and len(texto_limpo) < 100:
                    return texto_limpo
            
            # Estratégia 2: Buscar próximo a palavras-chave
            keywords = ['leiloeiro', 'leiloeira', 'escritório', 'escritorio', 'leilão por']
            for keyword in keywords:
                textos = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for texto in textos:
                    parent = texto.parent
                    if parent:
                        texto_completo = parent.get_text()
                        # Padrão: "Leiloeiro: Nome" ou "Leiloeiro Nome"
                        match = re.search(
                            r'(?:Leiloeiro|Leiloeira|Escritório|Escritorio)[:\s]+([A-ZÁÉÍÓÚÇ][a-záéíóúç]+(?:\s+[A-ZÁÉÍÓÚÇ][a-záéíóúç]+)*)',
                            texto_completo,
                            re.IGNORECASE
                        )
                        if match:
                            nome = match.group(1).strip()
                            if len(nome) > 3 and len(nome) < 100:
                                return nome
                        
                        # Tentar pegar texto após os dois pontos
                        if ':' in texto_completo:
                            partes = texto_completo.split(':')
                            if len(partes) > 1:
                                nome = partes[1].strip()
                                # Limpar nome (remover datas, números, etc)
                                nome = re.sub(r'\d{2}/\d{2}/\d{4}.*$', '', nome).strip()
                                nome = re.sub(r'\s+', ' ', nome)
                                if len(nome) > 3 and len(nome) < 100 and not re.match(r'^\d+$', nome):
                                    return nome
            
            # Estratégia 3: Buscar em tabelas (geralmente tem informações estruturadas)
            tabelas = soup.find_all('table')
            for tabela in tabelas:
                linhas = tabela.find_all('tr')
                for linha in linhas:
                    texto_linha = linha.get_text()
                    if re.search(r'leiloeiro|leiloeira', texto_linha, re.IGNORECASE):
                        tds = linha.find_all('td')
                        if len(tds) >= 2:
                            # O segundo td geralmente tem o nome
                            nome = tds[1].get_text(strip=True)
                            if len(nome) > 3 and len(nome) < 100:
                                return nome
        except Exception as e:
            self.logger.debug(f"Erro ao extrair leiloeiro: {e}")
        return "N/A"
    
    def extrair_local_leiloes_br(self, soup: BeautifulSoup) -> str:
        """Extrai o local do leilão - melhorado"""
        try:
            # Estratégia 1: Buscar em elementos com classes específicas
            local_elements = soup.find_all(['div', 'span', 'td', 'p'], 
                                         class_=lambda x: x and any(
                                             keyword in str(x).lower() 
                                             for keyword in ['local', 'location', 'cidade', 'city', 'endereco']
                                         ))
            for elem in local_elements:
                texto = elem.get_text(strip=True)
                # Remover a palavra "Local:" ou similar
                texto_limpo = re.sub(r'^(?:Local|LOCAL|Cidade|Endereço)[:\s]+', '', texto, flags=re.IGNORECASE)
                texto_limpo = texto_limpo.strip()
                if texto_limpo and len(texto_limpo) > 3 and len(texto_limpo) < 100:
                    return texto_limpo
            
            # Estratégia 2: Buscar próximo a palavras-chave
            keywords = ['local', 'cidade', 'endereço', 'endereco', 'realização']
            for keyword in keywords:
                textos = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for texto in textos:
                    parent = texto.parent
                    if parent:
                        texto_completo = parent.get_text()
                        # Padrão: "Local: Cidade - Estado" ou "Cidade - Estado"
                        match = re.search(
                            r'(?:Local|LOCAL|Cidade|Endereço)[:\s]+([A-ZÁÉÍÓÚÇ][a-záéíóúç]+(?:\s+[A-ZÁÉÍÓÚÇ][a-záéíóúç]+)*)\s*[-–]\s*([A-Z]{2})',
                            texto_completo,
                            re.IGNORECASE
                        )
                        if match:
                            return f"{match.group(1)} - {match.group(2)}"
                        
                        # Padrão alternativo: apenas cidade - estado
                        match = re.search(
                            r'([A-ZÁÉÍÓÚÇ][a-záéíóúç]+(?:\s+[A-ZÁÉÍÓÚÇ][a-záéíóúç]+)*)\s*[-–]\s*([A-Z]{2})',
                            texto_completo
                        )
                        if match:
                            cidade = match.group(1).strip()
                            estado = match.group(2).strip()
                            # Validar que não é uma data ou número
                            if not re.search(r'\d{2}/\d{2}', cidade) and len(cidade) > 3:
                                return f"{cidade} - {estado}"
                        
                        # Tentar pegar texto após os dois pontos
                        if ':' in texto_completo:
                            partes = texto_completo.split(':')
                            if len(partes) > 1:
                                local = partes[1].strip()
                                # Limpar local (remover datas, números, etc)
                                local = re.sub(r'\d{2}/\d{2}/\d{4}.*$', '', local).strip()
                                local = re.sub(r'\s+', ' ', local)
                                if len(local) > 3 and len(local) < 100:
                                    return local
            
            # Estratégia 3: Buscar em tabelas
            tabelas = soup.find_all('table')
            for tabela in tabelas:
                linhas = tabela.find_all('tr')
                for linha in linhas:
                    texto_linha = linha.get_text()
                    if re.search(r'local|cidade|endereço', texto_linha, re.IGNORECASE):
                        tds = linha.find_all('td')
                        if len(tds) >= 2:
                            local = tds[1].get_text(strip=True)
                            if len(local) > 3 and len(local) < 100:
                                return local
        except Exception as e:
            self.logger.debug(f"Erro ao extrair local: {e}")
        return "N/A"
    
    def executar_scraping(self, categorias: List[str] = None, max_paginas: int = None):
        """Executa o scraping completo para quadros e esculturas"""
        self.logger.info("=== INICIANDO SCRAPING DO LEILÕESBR ===")
        self.logger.info(f"URL Base: {self.base_url}")
        self._parar_scraping = False
        
        # Se não especificou categorias, buscar ambas
        if categorias is None:
            categorias = ["quadros", "esculturas"]
        
        self.logger.info(f"Categorias a coletar: {', '.join(categorias)}")
        
        total_obras_coletadas = 0
        
        # Processar cada categoria
        for categoria in categorias:
            if self._parar_scraping:
                break
            
            if categoria.lower() not in ["quadros", "esculturas"]:
                self.logger.warning(f"Categoria inválida ignorada: {categoria}")
                continue
            
            self.logger.info(f"\n{'='*60}")
            self.logger.info(f"COLETANDO: {categoria.upper()}")
            self.logger.info(f"{'='*60}")
            
            # URL específica para a categoria
            if categoria.lower() == "quadros":
                url_categoria = self.url_quadros
            else:
                url_categoria = self.url_esculturas
            
            # Descobrir total de páginas
            if max_paginas is None:
                total_paginas = self.descobrir_total_paginas(categoria=categoria)
            else:
                total_paginas = max_paginas
                self.logger.info(f"Usando limite de {max_paginas} páginas para {categoria}")
            
            if total_paginas == 0:
                self.logger.warning(f"Nenhuma página encontrada para {categoria}!")
                continue
            
            self.logger.info(f"Iniciando coleta de {total_paginas} páginas de {categoria}...")
            
            # Processar cada página
            for pagina in range(1, total_paginas + 1):
                if self._parar_scraping:
                    self.logger.warning(f"⚠️ Scraping interrompido pelo usuário na página {pagina} de {categoria}")
                    break
                
                # Construir URL da página
                if pagina == 1:
                    url = url_categoria
                else:
                    # Adicionar parâmetro de página
                    # Para busca_andamento.asp, usar parâmetro 'b'
                    # Para buscapos.asp, usar parâmetro 'pagina'
                    if 'busca_andamento' in url_categoria:
                        # Substituir ou adicionar parâmetro 'b'
                        if '&b=' in url_categoria:
                            url = re.sub(r'&b=\d+', f'&b={pagina - 1}', url_categoria)
                        else:
                            url = f"{url_categoria}&b={pagina - 1}"
                    else:
                        # Para buscapos.asp
                        if '?' in url_categoria:
                            url = f"{url_categoria}&pagina={pagina}"
                        else:
                            url = f"{url_categoria}?pagina={pagina}"
                
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
