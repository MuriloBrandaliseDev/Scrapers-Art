import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error') || error.code === 'ERR_CONNECTION_REFUSED') {
      const errorMsg = '❌ Backend não está rodando!\n\n' +
        'Por favor, inicie o backend:\n' +
        '1. Execute: start_backend.bat\n' +
        '2. Ou no terminal: python start_api.py\n' +
        '3. Aguarde aparecer: "Uvicorn running on http://0.0.0.0:8000"\n' +
        '4. Recarregue esta página'
      console.error(errorMsg)
      // Mostrar alerta visual no navegador
      if (typeof window !== 'undefined' && !sessionStorage.getItem('backend-error-shown')) {
        sessionStorage.setItem('backend-error-shown', 'true')
        setTimeout(() => {
          alert(errorMsg)
          sessionStorage.removeItem('backend-error-shown')
        }, 1000)
      }
    }
    return Promise.reject(error)
  }
)

export interface ScraperRequest {
  max_paginas?: number
  categorias?: string[]
  delay_between_requests?: number
  max_retries?: number
}

export interface Obra {
  id: number
  nome_artista: string | null
  titulo: string | null
  descricao: string | null
  valor: string | null
  categoria: string | null
  url: string
  url_original?: string | null
  data_coleta: string
  lote?: string | null
  numero_lances?: number | null
  data_leilao?: string | null
  leiloeiro?: string | null
  local?: string | null
  scraper_name: string
}

export interface Session {
  id: number
  scraper_name: string
  status: string
  total_obras: number
  paginas_processadas: number
  inicio: string
  fim: string | null
  arquivo_saida: string | null
  erro: string | null
  categorias: string | null
}

export interface Stats {
  total_obras: number
  total_sessoes: number
  obras_por_categoria: Record<string, number>
  obras_por_scraper: Record<string, number>
}

// API Methods
export const apiService = {
  // Stats
  getStats: async (): Promise<Stats> => {
    const { data } = await api.get<Stats>('/stats')
    return data
  },

  // Obras
  getObras: async (params?: {
    page?: number
    per_page?: number
    scraper?: string
    categoria?: string
    artista?: string
  }) => {
    const { data } = await api.get<any>('/obras', { params })
    // Se retornar objeto com 'obras', usar isso; senão, usar o array direto (compatibilidade)
    if (data && typeof data === 'object' && 'obras' in data) {
      return data.obras as Obra[]
    }
    return data as Obra[]
  },

  // Sessions
  getSessions: async (params?: {
    page?: number
    per_page?: number
    status?: string
    scraper?: string
  }) => {
    const { data } = await api.get<Session[]>('/sessions', { params })
    return data
  },

  getSession: async (id: number): Promise<Session> => {
    const { data } = await api.get<Session>(`/sessions/${id}`)
    return data
  },

  // Start Scrapers
  startIArremate: async (request: ScraperRequest) => {
    const { data } = await api.post('/iarremate', request)
    return data
  },

  startLeiloesBR: async (request: ScraperRequest) => {
    const { data } = await api.post('/leiloes-br', request)
    return data
  },
}

export default api

