# Sistema de Web Scraping para Leilões de Arte

Sistema profissional e modular para coleta de dados de quadros e esculturas de sites de leilões online.

## 🎯 Sites Suportados

- ✅ **iArremate** - Belas Artes (Quadros)
- ✅ **LeilõesBR** - Quadros e Esculturas

## 📋 Características

- ✅ **Arquitetura Modular**: Sistema base extensível para novos scrapers
- ✅ **API REST FastAPI**: Controle via endpoints HTTP
- ✅ **Múltiplas Estratégias**: Extração robusta com fallbacks
- ✅ **Suporte a Redirecionamentos**: Detecta e processa sites redirecionados
- ✅ **Logging Profissional**: Sistema completo de logs
- ✅ **Retry Automático**: Tratamento robusto de erros
- ✅ **Headers Aleatórios**: Evita bloqueios
- ✅ **Pronto para Produção**: Estrutura organizada para servidores

## 🚀 Instalação

### Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passos

1. **Clone ou baixe o repositório**

2. **Crie um ambiente virtual (recomendado):**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

## 📖 Uso

### Opção 1: Scripts Diretos

#### iArremate
```bash
python run.py
```

#### LeilõesBR
```bash
python run_leiloes_br.py
```

### Opção 2: API FastAPI (Recomendado para Servidores)

#### Iniciar a API
```bash
python start_api.py
```

A API estará disponível em: `http://localhost:8000`

#### Documentação Interativa
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### Endpoints Disponíveis

**Iniciar Scraper iArremate:**
```bash
curl -X POST "http://localhost:8000/api/v1/iarremate" \
  -H "Content-Type: application/json" \
  -d '{"max_paginas": 10, "delay_between_requests": 1.0}'
```

**Iniciar Scraper LeilõesBR:**
```bash
curl -X POST "http://localhost:8000/api/v1/leiloes-br" \
  -H "Content-Type: application/json" \
  -d '{
    "categorias": ["quadros", "esculturas"],
    "max_paginas": 10,
    "delay_between_requests": 1.0
  }'
```

**Verificar Status:**
```bash
curl "http://localhost:8000/api/v1/status/{scraper_id}"
```

**Listar Todos os Scrapers:**
```bash
curl "http://localhost:8000/api/v1/scrapers"
```

### Opção 3: Como Módulo Python

```python
from src.iarremate_scraper import IArremateScraper
from src.leiloes_br_scraper import LeiloesBRScraper

# iArremate
scraper_iarremate = IArremateScraper()
scraper_iarremate.executar_scraping(max_paginas=10)
scraper_iarremate.salvar_planilha()

# LeilõesBR
scraper_leiloes = LeiloesBRScraper()
scraper_leiloes.executar_scraping(
    categorias=["quadros", "esculturas"],
    max_paginas=10
)
scraper_leiloes.salvar_planilha()
```

## 📊 Dados Coletados

### iArremate
- Nome_Artista
- Categoria
- Pagina
- Titulo
- Descricao
- Valor
- URL
- Data_Coleta

### LeilõesBR
- Nome_Artista
- Categoria (Quadros/Esculturas)
- Pagina
- Lote
- Titulo
- Descricao
- Valor
- Data_Leilao
- Leiloeiro
- Local
- URL
- URL_Original
- Site_Redirecionado (quando aplicável)
- Data_Coleta

## 📁 Estrutura do Projeto

```
DesafioWebscrapping/
├── src/
│   ├── __init__.py
│   ├── base_scraper.py          # Classe base abstrata
│   ├── iarremate_scraper.py     # Scraper iArremate
│   └── leiloes_br_scraper.py    # Scraper LeilõesBR
├── api/
│   ├── __init__.py
│   └── main.py                  # API FastAPI
├── output/                      # Arquivos de saída (Excel/CSV)
├── logs/                        # Arquivos de log
├── config/                      # Arquivos de configuração
├── run.py                       # Script iArremate
├── run_leiloes_br.py            # Script LeilõesBR
├── start_api.py                 # Script para iniciar API
├── requirements.txt             # Dependências
├── .gitignore                   # Arquivos ignorados
└── README.md                    # Este arquivo
```

## 🔧 Configurações Avançadas

### Parâmetros do Scraper

```python
scraper = LeiloesBRScraper(
    base_url="https://www.leiloesbr.com.br",
    output_dir="output",              # Diretório de saída
    logs_dir="logs",                  # Diretório de logs
    max_retries=3,                    # Tentativas por requisição
    delay_between_requests=1.0        # Delay entre requisições (segundos)
)
```

### Executar com Limites

```python
# Limitar número de páginas
scraper.executar_scraping(max_paginas=5)

# Filtrar categorias (LeilõesBR)
scraper.executar_scraping(categorias=["quadros"])
```

## 🌐 Deploy em Servidor

### Usando uvicorn diretamente:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### Usando systemd (Linux):

Crie um arquivo `/etc/systemd/system/scrapers-api.service`:

```ini
[Unit]
Description=Web Scrapers API
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/projeto
Environment="PATH=/caminho/para/venv/bin"
ExecStart=/caminho/para/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Ative o serviço:
```bash
sudo systemctl enable scrapers-api
sudo systemctl start scrapers-api
```

### Usando Docker (opcional):

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔍 Estratégias de Extração

Cada scraper utiliza múltiplas estratégias para garantir coleta de dados:

1. **Busca por Texto Específico**: "Valor Atual", "Lance Atual", etc.
2. **Busca por Padrões Regex**: R$ seguido de números
3. **Busca em Classes CSS**: Elementos com classes relacionadas
4. **Busca em Elementos HTML**: Spans, divs, inputs, etc.

## 📝 Logging

O sistema gera logs detalhados em:
- **Console**: Saída em tempo real
- **Arquivo**: `logs/{scraper_name}_YYYYMMDD_HHMMSS.log`

Níveis de log:
- `INFO`: Informações gerais
- `WARNING`: Avisos (retries, etc.)
- `ERROR`: Erros não críticos
- `DEBUG`: Informações detalhadas

## ⚠️ Considerações Importantes

1. **Respeite os termos de uso dos sites**
2. **Use delays adequados** entre requisições
3. **Os sites podem alterar estrutura** - os scrapers têm fallbacks
4. **Algumas obras podem não ter valor disponível** - aparecerá como "N/A"
5. **LeilõesBR pode redirecionar** para outros sites - o sistema detecta automaticamente

## 🐛 Solução de Problemas

### Erro de Conexão
- Verifique conexão com internet
- Site pode estar temporariamente indisponível
- Verifique logs em `logs/`

### Nenhuma Obra Encontrada
- Site pode ter alterado estrutura
- Verifique URLs base
- Consulte logs para detalhes

### Valores Não Coletados
- Site pode ter mudado formato de exibição
- Scraper tenta múltiplas estratégias automaticamente
- Verifique logs para estratégias utilizadas

### Problemas com Redirecionamentos
- Sistema detecta automaticamente
- Verifique campo "Site_Redirecionado" nos dados
- Logs mostram redirecionamentos

## 🔄 Próximas Melhorias

- [ ] Suporte a mais sites de leilões
- [ ] Interface web para monitoramento
- [ ] Suporte a banco de dados
- [ ] Agendamento automático (cron jobs)
- [ ] Notificações por email/webhook
- [ ] Cache de requisições
- [ ] Rate limiting configurável

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e profissionais.

## 🤝 Contribuição

Sugestões e melhorias são bem-vindas!

---

**Desenvolvido por MuriloDEV** 🚀
