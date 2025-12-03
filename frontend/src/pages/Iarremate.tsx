import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { ExternalLink, Image as ImageIcon, Filter, X, Search, ChevronDown, ChevronUp, Download, AlertCircle } from 'lucide-react'
import { exportToExcel } from '../utils/excelExport'
import TruncatedText from '../components/TruncatedText'

export default function Iarremate() {
  const [page, setPage] = useState(1)
  const [categoria, setCategoria] = useState('')
  const [artista, setArtista] = useState('')
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: obras, isLoading, error } = useQuery({
    queryKey: ['obras', 'iarremate', page, categoria, artista],
    queryFn: async () => {
      const result = await apiService.getObras({
        page,
        per_page: 50,
        scraper: 'iarremate',
        categoria: categoria || undefined,
        artista: artista || undefined,
      })
      console.log('[Iarremate] Obras recebidas:', result?.length || 0, result)
      return result
    },
    refetchInterval: 10000,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 30000,
  })

  // Estado para controlar loading do export
  const [isLoadingExport, setIsLoadingExport] = useState(false)

  // Filtrar obras localmente por valor (já que a API não suporta)
  const obrasFiltradas = useMemo(() => {
    if (!obras) return []
    
    return obras.filter((obra: any) => {
      // Filtro de valor mínimo
      if (valorMin) {
        const valorObra = parseFloat((obra.valor || '0').replace(/[^\d,]/g, '').replace(',', '.'))
        const min = parseFloat(valorMin.replace(/[^\d,]/g, '').replace(',', '.'))
        if (isNaN(valorObra) || valorObra < min) return false
      }
      
      // Filtro de valor máximo
      if (valorMax) {
        const valorObra = parseFloat((obra.valor || '0').replace(/[^\d,]/g, '').replace(',', '.'))
        const max = parseFloat(valorMax.replace(/[^\d,]/g, '').replace(',', '.'))
        if (isNaN(valorObra) || valorObra > max) return false
      }
      
      return true
    })
  }, [obras, valorMin, valorMax])

  // Categorias únicas para filtro
  const categorias = obras
    ? [...new Set(obras.map((o: any) => o.categoria).filter(Boolean))]
    : []

  // Total geral de obras do iArremate (não apenas as exibidas)
  const statsTyped = stats as any
  const totalObras = statsTyped?.obras_por_scraper?.['iarremate'] 
    || statsTyped?.obras_por_scraper?.['IARREMATE'] 
    || statsTyped?.obras_por_scraper?.['iArremate']
    || Object.entries(statsTyped?.obras_por_scraper || {}).find(([key]) => 
        key.toLowerCase() === 'iarremate'
      )?.[1]
    || 0

  const limparFiltros = () => {
    setCategoria('')
    setArtista('')
    setValorMin('')
    setValorMax('')
    setPage(1)
  }

  const temFiltrosAtivos = categoria || artista || valorMin || valorMax

  const handleDownloadExcel = async () => {
    setIsLoadingExport(true)
    try {
      // Buscar todas as obras com paginação
      const todasObrasData: any[] = []
      let page = 1
      let hasMore = true
      const perPage = 100 // Tamanho razoável por página
      
      while (hasMore) {
        const obrasPage = await apiService.getObras({
          page,
          per_page: perPage,
          scraper: 'iarremate',
        })
        
        if (obrasPage && obrasPage.length > 0) {
          todasObrasData.push(...obrasPage)
          // Se retornou menos que perPage, não há mais páginas
          if (obrasPage.length < perPage) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      if (todasObrasData.length > 0) {
        const filename = `iArremate_Obras_${new Date().toISOString().split('T')[0]}.xlsx`
        exportToExcel(todasObrasData, filename)
      } else {
        alert('Nenhuma obra encontrada para exportar.')
      }
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      alert('Erro ao exportar Excel. Tente novamente.')
    } finally {
      setIsLoadingExport(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-8">
      {/* Header Premium com Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/50 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-[#b89a4f]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a961] via-[#d4b87a] to-[#b89a4f] rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-[#c9a961]/20">
              <ImageIcon className="w-8 h-8 text-[#0f0f0f]" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mb-2">
                iArremate
              </h1>
              <p className="text-[#888] text-sm">Quadros e Esculturas Coletadas</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl font-bold text-[#c9a961] mb-1">{totalObras.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-[#888]">Obras Coletadas</div>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={isLoadingExport || totalObras === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0f0f0f] rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              title="Baixar todas as obras em Excel"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Excel</span>
            </button>
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
                {[categoria, artista, valorMin, valorMax].filter(Boolean).length}
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5 text-[#888]" /> : <ChevronDown className="w-5 h-5 text-[#888]" />}
        </button>

        {showFilters && (
          <div className="p-6 pt-6 border-t border-[#2a2a2a] space-y-6 bg-gradient-to-b from-[#1a1a1a] to-[#151515]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Filtro Categoria */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Categoria
                </label>
                <select
                  className="w-full px-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] transition-all duration-300 hover:border-[#c9a961]/50"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat: string) => (
                    <option key={cat || ''} value={cat || ''}>
                      {cat}
                    </option>
                  ))}
                </select>
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
                    placeholder="Buscar artista..."
                    value={artista}
                    onChange={(e) => {
                      setArtista(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>

              {/* Filtro Valor Mínimo */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Valor Mínimo (R$)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] placeholder-[#666] transition-all duration-300 hover:border-[#c9a961]/50"
                  placeholder="0,00"
                  value={valorMin}
                  onChange={(e) => {
                    setValorMin(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              {/* Filtro Valor Máximo */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Valor Máximo (R$)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-sm border border-[#2a2a2a] rounded-xl focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] bg-[#151515] text-[#fff] placeholder-[#666] transition-all duration-300 hover:border-[#c9a961]/50"
                  placeholder="999.999,99"
                  value={valorMax}
                  onChange={(e) => {
                    setValorMax(e.target.value)
                    setPage(1)
                  }}
                />
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden md:table-cell">Lote</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Lances</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden lg:table-cell">Início Leilão</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden lg:table-cell">Data Coleta</th>
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
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-[#888] text-sm font-medium">
                          {obra.lote || <span className="text-[#666] font-normal">N/A</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {obra.valor && obra.valor !== 'N/A' ? (
                          <div>
                            <div className="font-bold text-[#c9a961] text-sm">
                              R$ {obra.valor}
                            </div>
                            {obra.valor_atualizado && obra.valor_atualizado !== obra.valor && (
                              <div className="text-xs text-[#666] mt-0.5">
                                Ant: R$ {obra.valor_atualizado}
                              </div>
                            )}
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
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-[#888] text-sm">
                          {obra.data_inicio_leilao && obra.data_inicio_leilao !== 'nao tem' 
                            ? obra.data_inicio_leilao 
                            : <span className="text-[#666]">N/A</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
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
              : 'Execute um scraping do iArremate para ver as obras aqui'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
