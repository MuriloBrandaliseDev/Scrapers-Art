import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { Clock, Filter, Download, AlertCircle, X, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import TruncatedText from '../components/TruncatedText'

export default function Sessoes() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [scraper, setScraper] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [errorModal, setErrorModal] = useState<{ show: boolean; error: string }>({ show: false, error: '' })

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', page, status, scraper],
    queryFn: () =>
      apiService.getSessions({
        page,
        per_page: 50,
        status: status || undefined,
        scraper: scraper || undefined,
      }),
    refetchInterval: 30000,
  })

  // Buscar total geral de sessões (sem paginação)
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', status, scraper],
    queryFn: () =>
      apiService.getSessions({
        per_page: 10000, // Número grande para pegar todas
        status: status || undefined,
        scraper: scraper || undefined,
      }),
    refetchInterval: 30000,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 30000,
  })

  // Filtrar sessões localmente se necessário
  const sessoesFiltradas = useMemo(() => {
    return sessions || []
  }, [sessions])

  // Total geral de sessões (não apenas as exibidas)
  const totalSessoes = allSessions?.length || stats?.total_sessoes || 0
  const sessoesAtivas = allSessions?.filter((s: any) => s.status === 'executando').length || 0

  const limparFiltros = () => {
    setStatus('')
    setScraper('')
    setPage(1)
  }

  const temFiltrosAtivos = status || scraper

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Concluído
          </span>
        )
      case 'executando':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#c9a961]/20 text-[#c9a961] border border-[#c9a961]/30 animate-pulse">
            Executando
          </span>
        )
      case 'erro':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            Erro
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
            {status}
          </span>
        )
    }
  }

  const getDuration = (inicio: string, fim: string | null) => {
    if (!fim) return <span className="text-[#666] text-xs">Em andamento...</span>
    const start = new Date(inicio)
    const end = new Date(fim)
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
    return <span className="text-[#888] text-xs">{minutes} min</span>
  }

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Header Dark Professional */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-7 h-7 text-[#0f0f0f]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#c9a961] mb-1">Sessões de Scraping</h1>
              <p className="text-[#888] text-sm">Histórico completo de execuções dos scrapers</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-bold text-[#c9a961]">{totalSessoes.toLocaleString('pt-BR')}</div>
            <div className="text-sm text-[#888]">
              {sessoesAtivas > 0 ? `${sessoesAtivas} Ativas` : 'Total de Sessões'}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Dark */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1f1f1f] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#c9a961]" />
            <span className="font-semibold text-[#c9a961]">Filtros Avançados</span>
            {temFiltrosAtivos && (
              <span className="bg-[#c9a961] text-[#0f0f0f] text-xs px-2.5 py-0.5 rounded-full font-medium">
                {[status, scraper].filter(Boolean).length}
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5 text-[#888]" /> : <ChevronDown className="w-5 h-5 text-[#888]" />}
        </button>

        {showFilters && (
          <div className="p-5 pt-6 border-t border-[#2a2a2a] space-y-4 bg-[#1a1a1a]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro Status */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#c9a961] focus:border-[#c9a961] bg-[#151515] text-[#fff]"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todos</option>
                  <option value="concluido">Concluído</option>
                  <option value="executando">Executando</option>
                  <option value="erro">Erro</option>
                </select>
              </div>

              {/* Filtro Scraper */}
              <div>
                <label className="block text-xs font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                  Scraper
                </label>
                <select
                  className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-[#c9a961] focus:border-[#c9a961] bg-[#151515] text-[#fff]"
                  value={scraper}
                  onChange={(e) => {
                    setScraper(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">Todos</option>
                  <option value="iarremate">iArremate</option>
                  <option value="leiloes_br">LeilõesBR</option>
                </select>
              </div>
            </div>

            {/* Botão Limpar */}
            {temFiltrosAtivos && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={limparFiltros}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#888] hover:text-[#c9a961] hover:bg-[#1f1f1f] rounded-lg transition-colors font-medium border border-[#2a2a2a]"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 bg-[#151515] border border-[#2a2a2a] rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2a2a2a] border-t-[#d4af37] mx-auto mb-3"></div>
            <p className="text-sm text-[#888]">Carregando sessões...</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">Erro ao carregar sessões. Tente novamente.</p>
        </div>
      )}

      {/* Tabela Dark Professional */}
      {!isLoading && !error && sessoesFiltradas && sessoesFiltradas.length > 0 ? (
        <>
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-lg overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Scraper</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Obras</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Páginas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Início</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Fim</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Duração</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {sessoesFiltradas.map((session: any) => (
                    <tr key={session.id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-3">
                        <strong className="text-[#fff] text-xs font-semibold">#{session.id}</strong>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
                          <TruncatedText 
                            text={session.scraper_name?.toUpperCase()} 
                            maxLength={15}
                            className="text-[#c9a961]"
                            showExpandIcon={false}
                          />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-[#c9a961] text-xs font-semibold">{session.total_obras}</strong>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#888] text-xs">{session.paginas_processadas}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#888] text-xs">
                          {new Date(session.inicio).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#888] text-xs">
                          {session.fim
                            ? new Date(session.fim).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : <span className="text-[#666]">-</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getDuration(session.inicio, session.fim)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {session.arquivo_saida && (
                            <a
                              href={`/static/${session.arquivo_saida}`}
                              download
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#2a2a2a] hover:bg-[#1f1f1f] hover:border-[#c9a961] transition-colors"
                              title="Download Excel"
                            >
                              <Download className="w-4 h-4 text-[#c9a961]" />
                            </a>
                          )}
                          {session.erro && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setErrorModal({ show: true, error: session.erro || '' })
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors"
                              title="Ver erro completo"
                            >
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                          {!session.arquivo_saida && !session.erro && (
                            <span className="text-[#666] text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação Dark */}
          <div className="flex justify-between items-center bg-[#151515] border border-[#2a2a2a] rounded-xl px-5 py-3 shadow-lg">
            <div className="text-sm text-[#888]">
              Mostrando <span className="font-semibold text-[#c9a961]">{sessoesFiltradas.length}</span> sessões
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 text-sm border border-[#2a2a2a] rounded-lg hover:bg-[#1f1f1f] hover:border-[#c9a961] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-[#ccc]"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-[#c9a961] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                Página {page}
              </span>
              <button
                className="px-4 py-2 text-sm border border-[#2a2a2a] rounded-lg hover:bg-[#1f1f1f] hover:border-[#c9a961] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-[#ccc]"
                onClick={() => setPage((p) => p + 1)}
                disabled={!sessions || sessions.length < 50}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      ) : !isLoading && !error ? (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-12 text-center shadow-lg">
          <TrendingUp className="mx-auto mb-3 text-[#666]" />
          <p className="text-lg font-semibold text-[#c9a961] mb-1">Nenhuma sessão encontrada</p>
          <p className="text-sm text-[#888]">
            {temFiltrosAtivos
              ? 'Tente ajustar os filtros'
              : 'Execute um scraping para ver as sessões aqui'}
          </p>
        </div>
      ) : null}

      {/* Modal de Erro */}
      {errorModal.show && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setErrorModal({ show: false, error: '' })}
        >
          <div
            className="bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 className="text-lg font-semibold text-red-400">Erro na Sessão</h3>
              <button
                onClick={() => setErrorModal({ show: false, error: '' })}
                className="p-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#c9a961] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-red-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {errorModal.error}
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2a2a2a] flex justify-end">
              <button
                onClick={() => setErrorModal({ show: false, error: '' })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
