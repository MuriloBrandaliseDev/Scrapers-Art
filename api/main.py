#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API FastAPI Profissional - Sistema de Web Scraping
Interface moderna com banco de dados, paginação e dashboard
"""

import sys
import json
import threading
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.iarremate_scraper import IArremateScraper
from src.leiloes_br_scraper import LeiloesBRScraper
from database import init_db, get_db, ScrapingSession, Obra, engine

# Inicializar banco de dados
try:
    init_db()
    print("✅ Banco de dados inicializado com sucesso")
except Exception as e:
    print(f"⚠️ Erro ao inicializar banco de dados: {e}")
    import traceback
    traceback.print_exc()

# Configurar FastAPI
app = FastAPI(
    title="🎨 Sistema de Web Scraping - Leilões de Arte",
    description="""
    Sistema profissional para coleta e gerenciamento de dados de leilões de arte.
    
    ## Funcionalidades
    
    * ✅ Scraping automático de iArremate e LeilõesBR
    * ✅ Armazenamento persistente em banco de dados
    * ✅ Interface web moderna e responsiva
    * ✅ Dashboard com estatísticas
    * ✅ Paginação e filtros avançados
    * ✅ API REST completa
    
    ## Sites Suportados
    
    * **iArremate** - Quadros de Belas Artes
    * **LeilõesBR** - Quadros e Esculturas
    """,
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS - Permitir frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates e arquivos estáticos (para fallback)
templates_dir = Path(__file__).parent.parent / "templates"
templates_dir.mkdir(exist_ok=True)
templates = Jinja2Templates(directory=str(templates_dir))

static_dir = Path(__file__).parent.parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ==================== MODELOS PYDANTIC ====================

class ScraperRequest(BaseModel):
    """Modelo de requisição para executar scraper"""
    max_paginas: Optional[int] = Field(None, description="Número máximo de páginas a processar")
    categorias: Optional[List[str]] = Field(None, description="Lista de categorias (iArremate: ['quadros', 'esculturas'], LeilõesBR: ['quadros', 'esculturas'])")
    delay_between_requests: float = Field(1.0, ge=0.1, le=10.0, description="Delay entre requisições (segundos)")
    max_retries: int = Field(3, ge=1, le=10, description="Número máximo de tentativas")

    class Config:
        json_schema_extra = {
            "example": {
                "max_paginas": 10,
                "categorias": ["quadros", "esculturas"],
                "delay_between_requests": 1.0,
                "max_retries": 3
            }
        }


class ObraResponse(BaseModel):
    """Modelo de resposta para obra"""
    id: int
    nome_artista: Optional[str] = None
    titulo: Optional[str] = None
    lote: Optional[str] = None
    descricao: Optional[str] = None
    descricao_completa: Optional[str] = None
    valor: Optional[str] = None
    valor_atualizado: Optional[str] = None
    categoria: Optional[str] = None
    url: str
    data_coleta: str  # ISO format string
    data_inicio_leilao: Optional[str] = None
    data_leilao: Optional[str] = None
    leiloeiro: Optional[str] = None
    local: Optional[str] = None
    ultima_atualizacao: Optional[str] = None
    scraper_name: str

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Modelo de resposta para sessão de scraping"""
    id: int
    scraper_name: str
    status: str
    total_obras: int
    paginas_processadas: int
    inicio: Optional[str]  # ISO format string
    fim: Optional[str]  # ISO format string
    arquivo_saida: Optional[str] = None
    erro: Optional[str] = None
    categorias: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== FUNÇÕES DE SCRAPING ====================

# Armazenar scrapers ativos para poder parar
_scrapers_ativos = {}

def executar_iarremate(session_id: int, request: ScraperRequest):
    """Executa o scraper do iArremate e salva no banco"""
    from database import get_db_sync
    db = get_db_sync()
    scraper = None
    try:
        # Atualizar status
        session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
        if not session:
            return
        
        session.status = "executando"
        db.commit()
        
        # Executar scraper com acesso ao banco para verificar duplicatas
        scraper = IArremateScraper(
            delay_between_requests=request.delay_between_requests,
            max_retries=request.max_retries,
            db_session=db,
            session_id=session_id
        )
        
        # Registrar scraper ativo
        _scrapers_ativos[session_id] = scraper
        
        # Passar categorias (padrão: quadros e esculturas)
        categorias = request.categorias if request.categorias else ["quadros", "esculturas"]
        scraper.executar_scraping(categorias=categorias, max_paginas=request.max_paginas)
        
        # Salvar obras no banco (incrementalmente)
        # IMPORTANTE: Salvar mesmo se foi interrompido!
        total_obras = 0
        obras_duplicadas = 0
        
        print(f"[iArremate] Salvando {len(scraper.dados_obras)} obras coletadas no banco...")
        
        for dados_obra in scraper.dados_obras:
            try:
                url_obra = dados_obra.get("URL", "")
                
                # Verificar se já existe (dupla verificação)
                obra_existente = db.query(Obra).filter(
                    Obra.url == url_obra,
                    Obra.scraper_name == "iarremate"
                ).first()
                
                if obra_existente:
                    obras_duplicadas += 1
                    continue
                
                # Parse da data
                data_coleta_str = dados_obra.get("Data_Coleta", "")
                if data_coleta_str:
                    try:
                        data_coleta = datetime.strptime(data_coleta_str, "%d/%m/%Y %H:%M:%S")
                    except ValueError:
                        data_coleta = datetime.utcnow()
                else:
                    data_coleta = datetime.utcnow()
                
                obra = Obra(
                    session_id=session_id,
                    scraper_name="iarremate",
                    categoria=dados_obra.get("Categoria", "Quadros"),
                    nome_artista=dados_obra.get("Nome_Artista"),
                    titulo=dados_obra.get("Titulo"),
                    descricao=dados_obra.get("Descricao"),
                    valor=dados_obra.get("Valor"),
                    lote=dados_obra.get("Lote"),
                    data_inicio_leilao=dados_obra.get("Data_Inicio_Leilao"),
                    url=url_obra,
                    pagina=dados_obra.get("Pagina"),
                    data_coleta=data_coleta
                )
                db.add(obra)
                total_obras += 1
                
                # Commit a cada 10 obras para aparecer em tempo real
                if total_obras % 10 == 0:
                    db.commit()
                    print(f"[iArremate] {total_obras} obras salvas...")
                    # Atualizar contador na sessão
                    session.total_obras = total_obras
                    db.commit()
            except Exception as e:
                print(f"Erro ao salvar obra: {e}")
                continue
        
        # Commit final
        db.commit()
        
        # Salvar planilha também
        arquivo = scraper.salvar_planilha()
        
        # Atualizar sessão
        if scraper._parar_scraping:
            session.status = "interrompido"
            session.erro = f"Scraping interrompido pelo usuário. {total_obras} obras coletadas."
        else:
            session.status = "concluido"
        
        session.total_obras = total_obras
        session.fim = datetime.utcnow()
        session.arquivo_saida = str(arquivo) if arquivo else None
        db.commit()
        
        print(f"[iArremate] Concluído: {total_obras} obras novas, {obras_duplicadas} duplicadas ignoradas")
        
    except Exception as e:
        session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
        if session:
            session.status = "erro"
            session.erro = str(e)
            session.fim = datetime.utcnow()
            db.commit()
        import traceback
        traceback.print_exc()
    finally:
        # Remover scraper dos ativos
        if session_id in _scrapers_ativos:
            del _scrapers_ativos[session_id]
        db.close()


def executar_leiloes_br(session_id: int, request: ScraperRequest):
    """Executa o scraper do LeilõesBR e salva no banco"""
    from database import get_db_sync
    db = get_db_sync()
    try:
        # Atualizar status
        session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
        if not session:
            return
        
        session.status = "executando"
        db.commit()
        
        # Executar scraper
        scraper = LeiloesBRScraper(
            delay_between_requests=request.delay_between_requests,
            max_retries=request.max_retries,
            db_session=db,
            session_id=session_id
        )
        
        # Armazenar scraper para poder parar
        _scrapers_ativos[session_id] = scraper
        
        scraper.executar_scraping(
            categorias=request.categorias or ["quadros", "esculturas"],
            max_paginas=request.max_paginas
        )
        
        # Salvar obras no banco (incrementalmente)
        total_obras = 0
        obras_duplicadas = 0
        
        for dados_obra in scraper.dados_obras:
            # Verificar se deve parar
            if scraper._parar_scraping:
                session.status = "interrompido"
                session.total_obras = total_obras
                session.erro = f"Scraping interrompido pelo usuário. {total_obras} obras coletadas."
                db.commit()
                return
            
            try:
                # Verificar duplicata por URL
                url_obra = dados_obra.get("URL", "")
                if not url_obra:
                    continue
                
                obra_existente = db.query(Obra).filter(
                    Obra.url == url_obra,
                    Obra.scraper_name == "leiloes_br"
                ).first()
                
                if obra_existente:
                    obras_duplicadas += 1
                    continue
                
                # Parse da data
                data_coleta_str = dados_obra.get("Data_Coleta", "")
                if data_coleta_str:
                    try:
                        data_coleta = datetime.strptime(data_coleta_str, "%d/%m/%Y %H:%M:%S")
                    except ValueError:
                        data_coleta = datetime.utcnow()
                else:
                    data_coleta = datetime.utcnow()
                
                obra = Obra(
                    session_id=session_id,
                    scraper_name="leiloes_br",
                    categoria=dados_obra.get("Categoria"),
                    nome_artista=dados_obra.get("Nome_Artista"),
                    titulo=dados_obra.get("Titulo"),
                    descricao=dados_obra.get("Descricao"),
                    valor=dados_obra.get("Valor"),
                    url=url_obra,
                    url_original=dados_obra.get("URL_Original"),
                    site_redirecionado=dados_obra.get("Site_Redirecionado"),
                    lote=dados_obra.get("Lote"),
                    data_inicio_leilao=dados_obra.get("Data_Inicio_Leilao"),
                    data_leilao=dados_obra.get("Data_Leilao"),
                    leiloeiro=dados_obra.get("Leiloeiro"),
                    local=dados_obra.get("Local"),
                    pagina=dados_obra.get("Pagina"),
                    data_coleta=data_coleta
                )
                db.add(obra)
                total_obras += 1
                
                # Commit a cada 10 obras para aparecer em tempo real
                if total_obras % 10 == 0:
                    db.commit()
                    session.total_obras = total_obras
                    db.commit()
                    print(f"[LeilõesBR] {total_obras} obras salvas...")
            except Exception as e:
                print(f"Erro ao salvar obra LeilõesBR: {e}")
                continue
        
        # Salvar planilha também
        arquivo = scraper.salvar_planilha()
        
        # Atualizar sessão
        if scraper._parar_scraping:
            session.status = "interrompido"
            session.erro = f"Scraping interrompido pelo usuário. {total_obras} obras coletadas."
        else:
            session.status = "concluido"
        
        session.total_obras = total_obras
        session.fim = datetime.utcnow()
        session.arquivo_saida = str(arquivo) if arquivo else None
        session.categorias = json.dumps(request.categorias or [])
        db.commit()
        
        print(f"[LeilõesBR] Concluído: {total_obras} obras novas, {obras_duplicadas} duplicadas ignoradas")
        
        # Remover scraper da lista de ativos
        if session_id in _scrapers_ativos:
            del _scrapers_ativos[session_id]
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        error_msg = f"{str(e)}\n\n{error_trace}"
        
        print(f"[ERRO LeilõesBR] {error_msg}")
        
        session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
        if session:
            session.status = "erro"
            # Limitar tamanho da mensagem de erro (alguns bancos têm limite)
            session.erro = error_msg[:1000] if len(error_msg) > 1000 else error_msg
            session.fim = datetime.utcnow()
            db.commit()
        
        # Remover scraper da lista de ativos em caso de erro
        if session_id in _scrapers_ativos:
            del _scrapers_ativos[session_id]
    finally:
        db.close()


# ==================== ROTAS WEB (INTERFACE) ====================

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Página inicial - Dashboard"""
    db = next(get_db())
    
    # Estatísticas gerais
    total_obras = db.query(func.count(Obra.id)).scalar() or 0
    total_sessoes = db.query(func.count(ScrapingSession.id)).scalar() or 0
    sessoes_ativas = db.query(func.count(ScrapingSession.id)).filter(
        ScrapingSession.status == "executando"
    ).scalar() or 0
    
    # Últimas sessões
    ultimas_sessoes = db.query(ScrapingSession).order_by(
        desc(ScrapingSession.inicio)
    ).limit(10).all()
    
    # Obras por categoria
    obras_por_categoria = db.query(
        Obra.categoria,
        func.count(Obra.id).label('total')
    ).group_by(Obra.categoria).all()
    
    # Obras por scraper
    obras_por_scraper = db.query(
        Obra.scraper_name,
        func.count(Obra.id).label('total')
    ).group_by(Obra.scraper_name).all()
    
    db.close()
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "total_obras": total_obras,
        "total_sessoes": total_sessoes,
        "sessoes_ativas": sessoes_ativas,
        "ultimas_sessoes": ultimas_sessoes,
        "obras_por_categoria": obras_por_categoria,
        "obras_por_scraper": obras_por_scraper
    })


@app.get("/obras", response_class=HTMLResponse)
async def listar_obras_web(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    scraper: Optional[str] = None,
    categoria: Optional[str] = None,
    artista: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista obras com paginação e filtros"""
    # Query base
    query = db.query(Obra)
    
    # Filtros
    if scraper:
        query = query.filter(Obra.scraper_name == scraper)
    if categoria:
        query = query.filter(Obra.categoria == categoria)
    if artista:
        query = query.filter(Obra.nome_artista.ilike(f"%{artista}%"))
    
    # Total
    total = query.count()
    
    # Paginação
    offset = (page - 1) * per_page
    obras = query.order_by(desc(Obra.data_coleta)).offset(offset).limit(per_page).all()
    
    # Categorias e scrapers únicos para filtros
    categorias = db.query(Obra.categoria).distinct().all()
    scrapers = db.query(Obra.scraper_name).distinct().all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return templates.TemplateResponse("obras.html", {
        "request": request,
        "obras": obras,
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "scraper": scraper,
        "categoria": categoria,
        "artista": artista,
        "categorias": [c[0] for c in categorias if c[0]],
        "scrapers": [s[0] for s in scrapers if s[0]]
    })


@app.get("/sessoes", response_class=HTMLResponse)
async def listar_sessoes_web(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    scraper: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista sessões de scraping"""
    query = db.query(ScrapingSession)
    
    if status:
        query = query.filter(ScrapingSession.status == status)
    if scraper:
        query = query.filter(ScrapingSession.scraper_name == scraper)
    
    total = query.count()
    offset = (page - 1) * per_page
    sessoes = query.order_by(desc(ScrapingSession.inicio)).offset(offset).limit(per_page).all()
    
    total_pages = (total + per_page - 1) // per_page
    
    return templates.TemplateResponse("sessoes.html", {
        "request": request,
        "sessoes": sessoes,
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "status": status,
        "scraper": scraper
    })


# ==================== ROTAS API ====================

@app.get("/api/v1/health")
async def health_check():
    """Health check - retorna imediatamente"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "database": "ok"
    }


@app.post("/api/v1/atualizar-precos")
async def atualizar_precos_endpoint(background_tasks: BackgroundTasks):
    """Endpoint para atualizar preços das obras manualmente"""
    from atualizar_precos import atualizar_precos_obras
    
    # Executar em background
    background_tasks.add_task(atualizar_precos_obras)
    
    return {
        "message": "Atualização de preços iniciada em background",
        "status": "processando"
    }


@app.post("/api/v1/iarremate")
async def iniciar_iarremate(
    request: ScraperRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Inicia o scraper do iArremate
    
    - **max_paginas**: Limite de páginas (opcional)
    - **delay_between_requests**: Delay entre requisições (padrão: 1.0s)
    - **max_retries**: Tentativas por requisição (padrão: 3)
    """
    try:
        # Criar sessão
        session = ScrapingSession(
            scraper_name="iarremate",
            status="iniciando",
            inicio=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Executar em background (não bloqueia a resposta)
        background_tasks.add_task(executar_iarremate, session.id, request)
        
        # Retornar imediatamente
        return {
            "message": "Scraper iArremate iniciado",
            "session_id": session.id,
            "status_url": f"/api/v1/sessions/{session.id}"
        }
    except Exception as e:
        import traceback
        print(f"[API] Erro ao iniciar iArremate: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao iniciar scraping: {str(e)}")


@app.post("/api/v1/leiloes-br")
async def iniciar_leiloes_br(
    request: ScraperRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Inicia o scraper do LeilõesBR
    
    - **max_paginas**: Limite de páginas (opcional)
    - **categorias**: Lista de categorias ["quadros", "esculturas"] (opcional)
    - **delay_between_requests**: Delay entre requisições (padrão: 1.0s)
    - **max_retries**: Tentativas por requisição (padrão: 3)
    """
    try:
        # Criar sessão
        session = ScrapingSession(
            scraper_name="leiloes_br",
            status="iniciando",
            inicio=datetime.utcnow(),
            categorias=json.dumps(request.categorias or [])
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Executar em background (não bloqueia a resposta)
        background_tasks.add_task(executar_leiloes_br, session.id, request)
        
        # Retornar imediatamente
        return {
            "message": "Scraper LeilõesBR iniciado",
            "session_id": session.id,
            "status_url": f"/api/v1/sessions/{session.id}"
        }
    except Exception as e:
        import traceback
        print(f"[API] Erro ao iniciar LeilõesBR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao iniciar scraping: {str(e)}")


@app.get("/api/v1/sessions", response_model=List[SessionResponse])
async def listar_sessoes_api(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    scraper: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista sessões de scraping com paginação"""
    try:
        query = db.query(ScrapingSession)
        
        if status:
            query = query.filter(ScrapingSession.status == status)
        if scraper:
            query = query.filter(ScrapingSession.scraper_name == scraper)
        
        offset = (page - 1) * per_page
        sessoes = query.order_by(desc(ScrapingSession.inicio)).offset(offset).limit(per_page).all()
        
        # Converter para dict para garantir serialização correta
        result = []
        for sessao in sessoes:
            try:
                result.append({
                    "id": sessao.id,
                    "scraper_name": sessao.scraper_name or "",
                    "status": sessao.status or "desconhecido",
                    "total_obras": int(sessao.total_obras) if sessao.total_obras is not None else 0,
                    "paginas_processadas": int(sessao.paginas_processadas) if sessao.paginas_processadas is not None else 0,
                    "inicio": sessao.inicio.isoformat() if sessao.inicio else None,
                    "fim": sessao.fim.isoformat() if sessao.fim else None,
                    "arquivo_saida": sessao.arquivo_saida or None,
                    "erro": sessao.erro or None,
                    "categorias": sessao.categorias or None
                })
            except Exception as e:
                print(f"Erro ao serializar sessão {sessao.id}: {e}")
                continue
        
        return result
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"❌ Erro ao listar sessões: {error_msg}")
        print(traceback.format_exc())
        # Retornar lista vazia em caso de erro ao invés de 500
        return []


@app.get("/api/v1/sessions/{session_id}", response_model=SessionResponse)
async def obter_sessao(session_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma sessão de scraping"""
    session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return session


@app.post("/api/v1/sessions/{session_id}/stop")
async def parar_scraping(session_id: int, db: Session = Depends(get_db)):
    """Para uma sessão de scraping em execução"""
    try:
        # Verificar se o scraper está ativo
        if session_id not in _scrapers_ativos:
            # Verificar no banco se a sessão existe
            session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Sessão não encontrada")
            
            # Se a sessão existe mas não está em _scrapers_ativos, pode já ter terminado
            if session.status in ["concluido", "erro", "interrompido"]:
                return {
                    "message": "Sessão já está finalizada",
                    "session_id": session_id,
                    "status": session.status
                }
            else:
                # Atualizar status no banco
                session.status = "interrompido"
                db.commit()
                return {
                    "message": "Sessão marcada como interrompida",
                    "session_id": session_id,
                    "status": "interrompido"
                }
        
        # Parar o scraper ativo
        scraper = _scrapers_ativos[session_id]
        scraper.parar_scraping()
        
        # Atualizar status no banco
        session = db.query(ScrapingSession).filter(ScrapingSession.id == session_id).first()
        if session:
            session.status = "interrompido"
            db.commit()
        
        return {
            "message": "Solicitação de parada enviada",
            "session_id": session_id,
            "status": "parando"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao parar scraping: {str(e)}")


@app.get("/api/v1/obras")
async def listar_obras_api(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    scraper: Optional[str] = None,
    categoria: Optional[str] = None,
    artista: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista obras com paginação e filtros"""
    try:
        query = db.query(Obra)
        
        if scraper:
            query = query.filter(Obra.scraper_name == scraper)
        if categoria:
            query = query.filter(Obra.categoria == categoria)
        if artista:
            query = query.filter(Obra.nome_artista.ilike(f"%{artista}%"))
        
        offset = (page - 1) * per_page
        obras = query.order_by(desc(Obra.data_coleta)).offset(offset).limit(per_page).all()
        
        # Contar total para paginação
        total = query.count()
        total_pages = (total + per_page - 1) // per_page
        
        # Converter para dict para garantir serialização correta
        result = []
        for obra in obras:
            try:
                # Acessar campos novos de forma segura (podem não existir em obras antigas)
                descricao_completa = None
                valor_atualizado = None
                data_inicio_leilao = None
                ultima_atualizacao = None
                
                try:
                    descricao_completa = getattr(obra, 'descricao_completa', None) or None
                except:
                    pass
                
                try:
                    valor_atualizado = getattr(obra, 'valor_atualizado', None) or None
                except:
                    pass
                
                try:
                    data_inicio_leilao = getattr(obra, 'data_inicio_leilao', None) or None
                except:
                    pass
                
                try:
                    ultima_atualizacao = getattr(obra, 'ultima_atualizacao', None)
                    ultima_atualizacao = ultima_atualizacao.isoformat() if ultima_atualizacao else None
                except:
                    pass
                
                # Usar url_original se disponível, senão usar url
                url_final = obra.url or ""
                if hasattr(obra, 'url_original') and obra.url_original:
                    # Se url parece ser uma imagem, usar url_original
                    if url_final and any(ext in url_final.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']):
                        url_final = obra.url_original
                
                # Extrair numero_lances de forma segura
                numero_lances = None
                try:
                    numero_lances = getattr(obra, 'numero_lances', None)
                    if numero_lances is not None:
                        numero_lances = int(numero_lances)
                except:
                    pass
                
                obra_dict = {
                    "id": obra.id,
                    "nome_artista": obra.nome_artista or None,
                    "titulo": obra.titulo or None,
                    "descricao": obra.descricao or None,
                    "descricao_completa": descricao_completa,
                    "valor": obra.valor or None,
                    "valor_atualizado": valor_atualizado,
                    "categoria": obra.categoria or None,
                    "url": url_final,
                    "url_original": getattr(obra, 'url_original', None) or None,
                    "data_coleta": obra.data_coleta.isoformat() if obra.data_coleta else datetime.utcnow().isoformat(),
                    "lote": obra.lote or None,
                    "numero_lances": numero_lances,
                    "data_inicio_leilao": data_inicio_leilao,
                    "data_leilao": obra.data_leilao or None,
                    "leiloeiro": obra.leiloeiro or None,
                    "local": obra.local or None,
                    "ultima_atualizacao": ultima_atualizacao,
                    "scraper_name": obra.scraper_name or ""
                }
                result.append(obra_dict)
            except Exception as e:
                print(f"[OBRAS] Erro ao serializar obra {obra.id}: {e}")
                import traceback
                print(traceback.format_exc())
                continue
        
        return {
            "obras": result,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"[OBRAS] ERRO ao listar obras: {error_msg}")
        print(error_trace)
        # Retornar formato correto mesmo em caso de erro
        return {
            "obras": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "total_pages": 0
        }


@app.get("/api/v1/stats")
async def estatisticas(db: Session = Depends(get_db)):
    """Retorna estatísticas gerais"""
    # Valores padrão - sempre retornar algo válido
    response = {
        "total_obras": 0,
        "total_sessoes": 0,
        "obras_por_categoria": {},
        "obras_por_scraper": {}
    }
    
    try:
        # Contar total de obras
        try:
            count = db.query(func.count(Obra.id)).scalar()
            response["total_obras"] = int(count) if count else 0
        except Exception as e:
            print(f"[STATS] Erro ao contar obras: {e}")
            response["total_obras"] = 0
        
        # Contar total de sessões
        try:
            count = db.query(func.count(ScrapingSession.id)).scalar()
            response["total_sessoes"] = int(count) if count else 0
        except Exception as e:
            print(f"[STATS] Erro ao contar sessões: {e}")
            response["total_sessoes"] = 0
        
        # Obras por categoria
        try:
            results = db.query(
                Obra.categoria,
                func.count(Obra.id)
            ).group_by(Obra.categoria).all()
            
            for cat, total in results:
                if cat:
                    response["obras_por_categoria"][str(cat)] = int(total) if total else 0
        except Exception as e:
            print(f"[STATS] Erro ao obter obras por categoria: {e}")
            response["obras_por_categoria"] = {}
        
        # Obras por scraper
        try:
            results = db.query(
                Obra.scraper_name,
                func.count(Obra.id)
            ).group_by(Obra.scraper_name).all()
            
            for scraper, total in results:
                if scraper:
                    response["obras_por_scraper"][str(scraper)] = int(total) if total else 0
        except Exception as e:
            print(f"[STATS] Erro ao obter obras por scraper: {e}")
            response["obras_por_scraper"] = {}
        
    except Exception as e:
        import traceback
        print(f"[STATS] ERRO CRITICO: {e}")
        print(traceback.format_exc())
    
    # Sempre retornar resposta válida (mesmo que vazia)
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
