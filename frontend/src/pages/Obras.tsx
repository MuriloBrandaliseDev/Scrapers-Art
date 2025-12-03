import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { ExternalLink, Image as ImageIcon, Filter, X, Search, ChevronDown, ChevronUp, Layers, Sparkles, BarChart3, DollarSign, Target, AlertCircle } from 'lucide-react'
import TruncatedText from '../components/TruncatedText'

export default function Obras() {
  const [page, setPage] = useState(1)
  const [scraper, setScraper] = useState('')
  const [categoria, setCategoria] = useState('')
  const [artista, setArtista] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: obras, isLoading, error } = useQuery({
    queryKey: ['obras', page, scraper, categoria, artista],
    queryFn: () =>
      apiService.getObras({
        page,
        per_page: 50,
        scraper: scraper || undefined,
        categoria: categoria || undefined,
        artista: artista || undefined,
      }),
    refetchInterval: 10000,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 30000,
  })

  const obrasFiltradas = useMemo(() => {
    return obras || []
  }, [obras])

  // Variável removida - não utilizada

  const statsTyped = stats as any
  const totalObras = statsTyped?.total_obras || 0

  // Calcular insights inteligentes
  const insights = useMemo(() => {
    if (!obras || obras.length === 0) {
      return {
        obrasComValor: 0,
        obrasComLances: 0,
        valorMedio: 0,
        categoriaMaisComum: null,
      }
    }

    const obrasComValor = obras.filter((o: any) => o.valor && o.valor !== 'N/A').length
    const obrasComLances = obras.filter((o: any) => (o.numero_lances || 0) > 0).length
    
    // Calcular valor médio
    const valores = obras
      .map((o: any) => {
        const v = o.valor || '0'
        const num = parseFloat(v.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        return num
      })
      .filter((v: number) => v > 0)
    const valorMedio = valores.length > 0 ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length : 0

    // Categoria mais comum
    const catCount: Record<string, number> = {}
    obras.forEach((o: any) => {
      if (o.categoria) {
        catCount[o.categoria] = (catCount[o.categoria] || 0) + 1
      }
    })
    const categoriaMaisComum = Object.entries(catCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null

    return {
      obrasComValor,
      obrasComLances,
      valorMedio,
      categoriaMaisComum,
    }
  }, [obras])

  const limparFiltros = () => {
    setScraper('')
    setCategoria('')
    setArtista('')
    setPage(1)
  }

  const temFiltrosAtivos = scraper || categoria || artista

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-8">
      {/* Header Premium com Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/50 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-[#b89a4f]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a961] via-[#d4b87a] to-[#b89a4f] rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-[#c9a961]/20">
              <Layers className="w-8 h-8 text-[#0f0f0f]" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mb-2">
                Todas as Obras
              </h1>
              <p className="text-[#888] text-sm">Catálogo completo de obras coletadas</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl font-bold text-[#c9a961] mb-1">{totalObras.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-[#888]">Total de Obras</div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-[#0f0f0f]" />
              </div>
              <div>
                <p className="text-xs text-[#666] uppercase tracking-wider">Com Valor</p>
                <p className="text-2xl font-bold text-[#c9a961]">{insights.obrasComValor}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b89a4f]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#b89a4f] to-[#a68a3d] rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-[#0f0f0f]" />
              </div>
              <div>
                <p className="text-xs text-[#666] uppercase tracking-wider">Com Lances</p>
                <p className="text-2xl font-bold text-[#c9a961]">{insights.obrasComLances}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4b87a]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#d4b87a] to-[#c9a961] rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-[#0f0f0f]" />
              </div>
              <div>
                <p className="text-xs text-[#666] uppercase tracking-wider">Valor Médio</p>
                <p className="text-2xl font-bold text-[#c9a961]">{formatCurrency(insights.valorMedio)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#a68a3d]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#a68a3d] to-[#8a6f2f] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-[#0f0f0f]" />
              </div>
              <div>
                <p className="text-xs text-[#666] uppercase tracking-wider">Categoria Top</p>
                <p className="text-lg font-bold text-[#c9a961]">{insights.categoriaMaisComum || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Premium */}
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-6 hover:bg-[#1a1a1a] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Filter className="w-5 h-5 text-[#0f0f0f]" />
            </div>
            <span className="font-semibold text-[#c9a961] text-lg">Filtros Avançados</span>
            {temFiltrosAtivos && (
              <span className="bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0f0f0f] text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                {[scraper, categoria, artista].filter(Boolean).length}
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5 text-[#888]" /> : <ChevronDown className="w-5 h-5 text-[#888]" />}
        </button>

        {showFilters && (
          <div className="p-6 pt-6 border-t border-[#2a2a2a] space-y-6 bg-gradient-to-b from-[#1a1a1a] to-[#151515]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filtro Scraper */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Scraper
                </label>
                <select
                  className="w-full px-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] transition-all duration-300 hover:border-[#c9a961]/50"
                  value={scraper}
                  onChange={(e) => {
                    setScraper(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todos os Scrapers</option>
                  <option value="iarremate">iArremate</option>
                  <option value="leiloes_br">LeilõesBR</option>
                </select>
              </div>

              {/* Filtro Categoria */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Categoria
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666] w-4 h-4" />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] placeholder-[#666] transition-all duration-300 hover:border-[#c9a961]/50"
                    placeholder="Buscar categoria..."
                    value={categoria}
                    onChange={(e) => {
                      setCategoria(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>

              {/* Filtro Artista */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Artista
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666] w-4 h-4" />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] placeholder-[#666] transition-all duration-300 hover:border-[#c9a961]/50"
                    placeholder="Nome do artista..."
                    value={artista}
                    onChange={(e) => {
                      setArtista(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Botão Limpar */}
            {temFiltrosAtivos && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={limparFiltros}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#888] hover:text-[#c9a961] hover:bg-[#1a1a1a] rounded-xl transition-all duration-300 font-medium border border-[#2a2a2a] hover:border-[#c9a961]/30"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Premium */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-[#2a2a2a] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[#c9a961] rounded-full animate-spin"></div>
            </div>
            <p className="text-[#888] text-lg font-medium">Carregando obras...</p>
            <p className="text-[#666] text-sm mt-2">Processando dados</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Erro ao carregar obras. Tente novamente.
          </p>
        </div>
      )}

      {/* Tabela Premium */}
      {!isLoading && !error && obrasFiltradas && obrasFiltradas.length > 0 ? (
        <>
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gradient-to-r from-[#1a1a1a] to-[#151515] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Artista</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Título</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Lances</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Scraper</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {obrasFiltradas.map((obra: any) => (
                    <tr key={String(obra.id || obra.titulo || Math.random())} className="hover:bg-[#1a1a1a]/50 transition-colors group">
                      <td className="px-6 py-4 max-w-[200px]">
                        <TruncatedText 
                          text={obra.nome_artista} 
                          maxLength={30}
                          className="font-semibold text-[#fff] text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 max-w-[300px]">
                        <TruncatedText 
                          text={obra.titulo || 'Sem título'} 
                          maxLength={40}
                          className="text-[#ccc] text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
                          {obra.categoria || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {obra.valor && obra.valor !== 'N/A' ? (
                          <div className="font-bold text-[#c9a961] text-sm">
                            R$ {obra.valor}
                          </div>
                        ) : (
                          <span className="text-[#666] text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {obra.numero_lances !== null && obra.numero_lances !== undefined && obra.numero_lances > 0 ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
                            {obra.numero_lances} {obra.numero_lances === 1 ? 'lance' : 'lances'}
                          </span>
                        ) : (
                          <span className="text-[#666] text-sm">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
                          {obra.scraper_name?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#888] text-sm">
                          {obra.data_coleta 
                            ? new Date(obra.data_coleta).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : <span className="text-[#666]">N/A</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const urlParaUsar = obra.url_original || obra.url;
                          const isImage = urlParaUsar && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlParaUsar);
                          const isValidUrl = urlParaUsar && urlParaUsar.startsWith('http') && !isImage;
                          
                          return isValidUrl ? (
                            <a
                              href={urlParaUsar}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#2a2a2a] hover:bg-[#1a1a1a] hover:border-[#c9a961] transition-all duration-300 group"
                              title="Ver obra no site"
                            >
                              <ExternalLink className="w-4 h-4 text-[#c9a961] group-hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <span className="text-[#666] text-sm">-</span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação Premium */}
          <div className="flex justify-between items-center bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-6 py-4 shadow-xl">
            <div className="text-sm text-[#888]">
              Mostrando <span className="font-semibold text-[#c9a961]">{obrasFiltradas.length}</span> obras
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 text-sm border border-[#2a2a2a] rounded-xl hover:bg-[#1a1a1a] hover:border-[#c9a961] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-[#ccc] hover:text-[#c9a961]"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span className="px-5 py-2.5 text-sm font-semibold text-[#c9a961] bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                Página {page}
              </span>
              <button
                className="px-5 py-2.5 text-sm border border-[#2a2a2a] rounded-xl hover:bg-[#1a1a1a] hover:border-[#c9a961] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-[#ccc] hover:text-[#c9a961]"
                onClick={() => setPage((p) => p + 1)}
                disabled={!obras || obras.length < 50}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      ) : !isLoading && !error ? (
        <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-16 text-center shadow-xl">
          <ImageIcon className="mx-auto mb-4 text-[#666] opacity-50 w-16 h-16" />
          <p className="text-xl font-semibold text-[#c9a961] mb-2">Nenhuma obra encontrada</p>
          <p className="text-sm text-[#888]">
            {temFiltrosAtivos
              ? 'Tente ajustar os filtros para encontrar mais resultados'
              : 'Execute um scraping para ver as obras aqui'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
