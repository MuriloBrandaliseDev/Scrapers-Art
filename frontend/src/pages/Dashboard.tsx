import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { 
  TrendingUp, Image as ImageIcon, Clock, Activity, BarChart3, Zap, 
  Award, DollarSign, Sparkles, Crown, Target, ArrowUpRight, 
  LineChart, PieChart as PieChartIcon, Brain, AlertCircle, CheckCircle2,
  Users, Layers, Gauge, Percent
} from 'lucide-react'
import TruncatedText from '../components/TruncatedText'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, Area } from 'recharts'
import { useMemo } from 'react'

export default function Dashboard() {
  const { data: stats, isLoading, error: statsError } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 30000,
    retry: 1,
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions', { limit: 10 }],
    queryFn: () => apiService.getSessions({ per_page: 10 }),
    retry: 1,
  })

  // Buscar TODAS as obras para cálculos precisos
  const { data: obrasSample, isLoading: isLoadingObras } = useQuery({
    queryKey: ['obras-dashboard'],
    queryFn: async () => {
      const allObras = []
      let page = 1
      let hasMore = true
      
      while (hasMore && page <= 50) {
        try {
          const obras = await apiService.getObras({ page, per_page: 100 })
          if (obras && obras.length > 0) {
            allObras.push(...obras)
            if (obras.length < 100) {
              hasMore = false
            } else {
              page++
            }
          } else {
            hasMore = false
          }
        } catch (error) {
          console.error(`Erro ao buscar página ${page}:`, error)
          hasMore = false
        }
      }
      
      return allObras
    },
    retry: 1,
    refetchInterval: 30000,
  })

  const defaultStats = {
    total_obras: 0,
    total_sessoes: 0,
    obras_por_categoria: {} as Record<string, number>,
    obras_por_scraper: {} as Record<string, number>,
  }

  const currentStats = stats || defaultStats
  const currentSessions = sessions || []
  const obras = obrasSample || []

  // Cores douradas premium e elegantes
  const GOLD_GRADIENTS = {
    light: 'from-[#c9a961] via-[#d4b87a] to-[#b89a4f]',
    medium: 'from-[#b89a4f] via-[#a68a3d] to-[#8a6f2f]',
    dark: 'from-[#a68a3d] via-[#8a6f2f] to-[#6b5624]',
    accent: 'from-[#e8d5a3] via-[#d4b87a] to-[#c9a961]',
  }

  // Calcular métricas inteligentes e insights avançados
  const smartMetrics = useMemo(() => {
    if (!obras || obras.length === 0) {
      return {
        obraMaisCara: null,
        obraMaisLancada: null,
        artistaMaisVendido: null,
        categoriaMaisPopular: null,
        valorMedio: 0,
        totalValor: 0,
        valorMediano: 0,
        obrasPremium: 0,
        obrasComLances: 0,
        taxaSucesso: 0,
        crescimentoValor: 0,
        topArtistas: [],
        topCategorias: [],
        distribuicaoValores: [],
        tendenciaMensal: [],
      }
    }

    // Converter valores para números
    const obrasComValor = obras
      .map(obra => {
        const valorStr = obra.valor || (obra as any).valor_atualizado || '0'
        if (!valorStr || valorStr === '0' || valorStr === 'N/A') {
          return { ...obra, valorNum: 0 }
        }
        
        let valorLimpo = valorStr.toString().trim()
        valorLimpo = valorLimpo.replace(/^[R$]?\s*/i, '')
        valorLimpo = valorLimpo.replace(/\s/g, '')
        
        if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
          const lastComma = valorLimpo.lastIndexOf(',')
          const lastDot = valorLimpo.lastIndexOf('.')
          if (lastComma > lastDot) {
            valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.')
          } else {
            valorLimpo = valorLimpo.replace(/,/g, '')
          }
        } else if (valorLimpo.includes(',')) {
          const parts = valorLimpo.split(',')
          if (parts[0].length > 3) {
            valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.')
          } else {
            valorLimpo = valorLimpo.replace(',', '.')
          }
        } else if (valorLimpo.includes('.')) {
          const parts = valorLimpo.split('.')
          if (parts.length > 2 || (parts[1] && parts[1].length > 2)) {
            valorLimpo = valorLimpo.replace(/\./g, '')
          }
        }
        
        const valorNum = parseFloat(valorLimpo) || 0
        return { ...obra, valorNum }
      })
      .filter(obra => obra.valorNum > 0)

    // Obra mais cara
    const obraMaisCara = obrasComValor.length > 0
      ? obrasComValor.reduce((max, obra) => 
          obra.valorNum > max.valorNum ? obra : max
        )
      : null

    // Obra mais lançada
    const obrasComLances = obras.filter(obra => (obra.numero_lances || 0) > 0)
    const obraMaisLancada = obrasComLances.length > 0
      ? obrasComLances.reduce((max, obra) => {
          const lances = obra.numero_lances || 0
          const maxLances = max?.numero_lances || 0
          return lances > maxLances ? obra : max
        })
      : null

    // Top artistas (top 5)
    const artistasCount: Record<string, number> = {}
    obras.forEach(obra => {
      const artista = obra.nome_artista?.trim()
      if (artista && artista !== '' && artista !== 'N/A' && artista !== 'Desconhecido') {
        artistasCount[artista] = (artistasCount[artista] || 0) + 1
      }
    })
    const topArtistas = Object.entries(artistasCount)
      .filter(([nome]) => nome !== 'Desconhecido' && nome !== 'N/A')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, count]) => ({ nome, count }))

    const artistaMaisVendido = topArtistas[0] || null

    // Top categorias (top 5)
    const categoriasCount: Record<string, number> = {}
    obras.forEach(obra => {
      const categoria = obra.categoria?.trim()
      if (categoria && categoria !== '' && categoria !== 'N/A') {
        categoriasCount[categoria] = (categoriasCount[categoria] || 0) + 1
      }
    })
    const topCategorias = Object.entries(categoriasCount)
      .filter(([nome]) => nome !== 'Sem categoria' && nome !== 'N/A')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, count]) => ({ nome, count }))

    const categoriaMaisPopular = topCategorias[0] || null

    // Estatísticas avançadas
    const valores = obrasComValor.map(o => o.valorNum).sort((a, b) => a - b)
    const valorMedio = valores.length > 0
      ? valores.reduce((sum, v) => sum + v, 0) / valores.length
      : 0
    const valorMediano = valores.length > 0
      ? valores[Math.floor(valores.length / 2)]
      : 0
    const totalValor = valores.reduce((sum, v) => sum + v, 0)
    
    // Obras premium (acima da mediana)
    const obrasPremium = valores.filter(v => v > valorMediano).length
    
    // Taxa de sucesso (obras com lances)
    const taxaSucesso = obras.length > 0
      ? (obrasComLances.length / obras.length) * 100
      : 0

    // Distribuição de valores (faixas)
    const distribuicaoValores = [
      { range: 'Até R$ 1.000', count: valores.filter(v => v <= 1000).length },
      { range: 'R$ 1.001 - R$ 10.000', count: valores.filter(v => v > 1000 && v <= 10000).length },
      { range: 'R$ 10.001 - R$ 100.000', count: valores.filter(v => v > 10000 && v <= 100000).length },
      { range: 'Acima de R$ 100.000', count: valores.filter(v => v > 100000).length },
    ]

    // Tendência mensal (últimos 6 meses)
    const agora = new Date()
    const tendenciaMensal = Array.from({ length: 6 }, (_, i) => {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1)
      const obrasDoMes = obras.filter(obra => {
        const dataColeta = new Date(obra.data_coleta)
        return dataColeta.getMonth() === mes.getMonth() && 
               dataColeta.getFullYear() === mes.getFullYear()
      })
      return {
        mes: mes.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        obras: obrasDoMes.length,
        valor: obrasDoMes.reduce((sum, o) => {
          const v = parseFloat((o.valor || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
          return sum + v
        }, 0)
      }
    })

    return {
      obraMaisCara,
      obraMaisLancada,
      artistaMaisVendido,
      categoriaMaisPopular,
      valorMedio,
      valorMediano,
      totalValor,
      obrasPremium,
      obrasComLances: obrasComLances.length,
      taxaSucesso,
      crescimentoValor: 0, // Pode ser calculado com histórico
      topArtistas,
      topCategorias,
      distribuicaoValores,
      tendenciaMensal,
    }
  }, [obras])

  // Calcular distribuição por categoria a partir das obras reais
  const categoriaData = useMemo(() => {
    if (!obras || obras.length === 0) {
      return []
    }
    
    const categoriasCount: Record<string, number> = {}
    obras.forEach(obra => {
      const categoria = obra.categoria?.trim()
      if (categoria && categoria !== '' && categoria !== 'N/A' && categoria !== 'Sem categoria') {
        categoriasCount[categoria] = (categoriasCount[categoria] || 0) + 1
      }
    })
    
    return Object.entries(categoriasCount)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [obras])

  // Calcular distribuição por scraper a partir das obras reais
  const scraperData = useMemo(() => {
    if (!obras || obras.length === 0) {
      return Object.entries(currentStats.obras_por_scraper).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
    }
    
    const scrapersCount: Record<string, number> = {}
    obras.forEach(obra => {
      // Tentar diferentes campos possíveis para o scraper
      const scraper = (obra as any).scraper_name || (obra as any).scraper || (obra as any).fonte || 'Desconhecido'
      if (scraper && scraper !== 'N/A') {
        scrapersCount[scraper] = (scrapersCount[scraper] || 0) + 1
      }
    })
    
    return Object.entries(scrapersCount)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [obras, currentStats.obras_por_scraper])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-[#c9a961]/30 rounded-xl p-4 shadow-2xl">
          <p className="text-[#888] text-sm mb-2 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[#c9a961] text-sm font-semibold">
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.value.toLocaleString('pt-BR') 
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const sessoesAtivas = currentSessions.filter(s => s.status === 'executando').length
  const sessoesConcluidas = currentSessions.filter(s => s.status === 'concluido').length

  return (
    <div className="space-y-8 animate-fade-in w-full pb-8">
      {/* Header Premium com Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/50 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-[#b89a4f]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-[#c9a961]/20`}>
              <Brain className="w-8 h-8 text-[#0f0f0f]" />
          </div>
          <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mb-2">
                Intelligence Dashboard
              </h1>
              <p className="text-[#888] text-sm">Análise inteligente e insights em tempo real</p>
          </div>
        </div>
        {statsError && (
            <div className="bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-sm text-[#c9a961] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Backend não conectado
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Loading State Premium */}
      {(isLoading || isLoadingObras) && (
        <div className="bg-[#151515] border border-[#2a2a2a] rounded-2xl flex items-center justify-center min-h-[60vh] shadow-xl">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-[#2a2a2a] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[#c9a961] rounded-full animate-spin"></div>
            </div>
            <p className="text-[#888] text-lg font-medium">Carregando inteligência...</p>
            <p className="text-[#666] text-sm mt-2">Processando dados avançados</p>
          </div>
        </div>
      )}

      {!isLoading && !isLoadingObras && (
        <>
          {/* KPI Cards Premium - Grid Inteligente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Obras */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <ImageIcon className="w-7 h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    +12.5%
                  </div>
                </div>
                <div className="mb-2 min-w-0">
                  <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                    {currentStats.total_obras.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                    Total de Obras
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#666]">Última atualização: agora</p>
                </div>
              </div>
            </div>

            {/* Sessões Totais */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b89a4f]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${GOLD_GRADIENTS.medium} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Clock className="w-7 h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    {sessoesConcluidas}
                  </div>
                </div>
                <div className="mb-2 min-w-0">
                  <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                    {currentStats.total_sessoes.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                    Sessões Totais
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <div className="flex items-center gap-2 text-xs text-[#666]">
                    <Activity className="w-3 h-3" />
                    <span>{sessoesAtivas} ativas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Valor Total */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4b87a]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${GOLD_GRADIENTS.accent} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <DollarSign className="w-7 h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                    <Gauge className="w-3 h-3" />
                    Total
                  </div>
                </div>
                <div className="mb-2 min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                    {formatCurrency(smartMetrics.totalValor)}
                  </p>
                  <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                    Valor Total
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a] min-w-0">
                  <p className="text-xs text-[#666] break-words overflow-hidden">
                    Média: {formatCurrency(smartMetrics.valorMedio)}
                  </p>
                </div>
              </div>
      </div>

            {/* Taxa de Sucesso */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#a68a3d]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
          <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${GOLD_GRADIENTS.dark} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Percent className="w-7 h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    {smartMetrics.taxaSucesso.toFixed(1)}%
                  </div>
                </div>
                <div className="mb-2 min-w-0">
                  <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                    {smartMetrics.obrasComLances}
                  </p>
                  <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                    Com Lances
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#666]">
                    {smartMetrics.obrasPremium} obras premium
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Inteligentes - Cards Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Obra Mais Cara - Card Premium */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#c9a961]/20`}>
                    <Crown className="w-6 h-6 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#c9a961]">Obra Mais Valiosa</h3>
                    <p className="text-xs text-[#666]">Recorde do sistema</p>
                  </div>
                </div>
                {smartMetrics.obraMaisCara ? (
                  <div className="space-y-4 min-w-0">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent mb-2 break-words overflow-hidden">
                        {formatCurrency(smartMetrics.obraMaisCara.valorNum)}
                      </p>
                      <div className="mb-3">
                        <TruncatedText 
                          text={smartMetrics.obraMaisCara.titulo || 'Sem título'} 
                          maxLength={60}
                          className="text-sm text-[#ccc] font-medium"
                        />
                      </div>
                      <div>
                        <TruncatedText 
                          text={smartMetrics.obraMaisCara.nome_artista || 'Artista desconhecido'} 
                          maxLength={50}
                          className="text-xs text-[#888]"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-xs text-[#666]">
                        <Layers className="w-3 h-3" />
                        <span>Categoria: {smartMetrics.obraMaisCara.categoria || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-[#666] mx-auto mb-3 opacity-50" />
                    <p className="text-[#888] text-sm">Nenhuma obra com valor disponível</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mais Lançada - Card Premium */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b89a4f]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${GOLD_GRADIENTS.medium} rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#b89a4f]/20`}>
                    <Target className="w-6 h-6 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#c9a961]">Mais Disputada</h3>
                    <p className="text-xs text-[#666]">Maior interesse</p>
                  </div>
                </div>
                {smartMetrics.obraMaisLancada ? (
                  <div className="space-y-4 min-w-0">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2 flex-wrap min-w-0">
                        <p className="text-2xl sm:text-3xl font-bold text-[#c9a961] break-words overflow-hidden">
                          {smartMetrics.obraMaisLancada.numero_lances || 0}
                        </p>
                        <span className="text-sm text-[#888]">lances</span>
                      </div>
                      <div className="mb-3">
                        <TruncatedText 
                          text={smartMetrics.obraMaisLancada.titulo || 'Sem título'} 
                          maxLength={60}
                          className="text-sm text-[#ccc] font-medium"
                        />
                      </div>
                      <div>
                        <TruncatedText 
                          text={smartMetrics.obraMaisLancada.nome_artista || 'Artista desconhecido'} 
                          maxLength={50}
                          className="text-xs text-[#888]"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-xs text-[#666]">
                        <Users className="w-3 h-3" />
                        <span>Alto engajamento</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-[#666] mx-auto mb-3 opacity-50" />
                    <p className="text-[#888] text-sm">Nenhuma obra com lances disponível</p>
                  </div>
                )}
              </div>
            </div>

            {/* Artista do Mês - Card Premium */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4b87a]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${GOLD_GRADIENTS.accent} rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#d4b87a]/20`}>
                    <Award className="w-6 h-6 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#c9a961]">Artista em Destaque</h3>
                    <p className="text-xs text-[#666]">Top do mês</p>
                  </div>
                </div>
                {smartMetrics.artistaMaisVendido ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-3">
                        <TruncatedText 
                          text={smartMetrics.artistaMaisVendido.nome} 
                          maxLength={50}
                          className="text-2xl font-bold text-[#c9a961]"
                        />
                      </div>
                      <p className="text-sm text-[#888] mb-4">
                        {smartMetrics.artistaMaisVendido.count} obra{smartMetrics.artistaMaisVendido.count > 1 ? 's' : ''} coletada{smartMetrics.artistaMaisVendido.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-xs text-[#666]">
                        <Sparkles className="w-3 h-3" />
                        <span>Líder em volume</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-[#666] mx-auto mb-3 opacity-50" />
                    <p className="text-[#888] text-sm">Nenhum artista disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráficos Avançados - Layout Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição de Valores - Bar Chart Premium */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-lg flex items-center justify-center`}>
                    <BarChart3 className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#c9a961]">Distribuição de Valores</h2>
                    <p className="text-xs text-[#666]">Análise por faixas</p>
                  </div>
                </div>
              </div>
              {smartMetrics.distribuicaoValores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={smartMetrics.distribuicaoValores} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="goldBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a961" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a68a3d" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.5} />
                    <XAxis 
                      dataKey="range" 
                      stroke="#888" 
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="url(#goldBarGradient)" 
                      radius={[8, 8, 0, 0]}
                      name="Obras"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto mb-3 text-[#666]" />
                    <p className="text-[#888]">Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tendência Mensal - Line Chart Premium */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.medium} rounded-lg flex items-center justify-center`}>
                    <LineChart className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#c9a961]">Tendência Mensal</h2>
                    <p className="text-xs text-[#666]">Últimos 6 meses</p>
                  </div>
                </div>
              </div>
              {smartMetrics.tendenciaMensal.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={smartMetrics.tendenciaMensal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9a961" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#c9a961" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.5} />
                    <XAxis dataKey="mes" stroke="#888" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="obras"
                      stroke="#c9a961"
                      strokeWidth={3}
                      fill="url(#lineGradient)"
                      name="Obras"
                    />
                    <Line
                      type="monotone"
                      dataKey="obras"
                      stroke="#c9a961"
                      strokeWidth={3}
                      dot={{ fill: '#c9a961', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <LineChart size={48} className="mx-auto mb-3 text-[#666]" />
                    <p className="text-[#888]">Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Rankings - Cards Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Artistas */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.accent} rounded-lg flex items-center justify-center`}>
                  <Users className="w-5 h-5 text-[#0f0f0f]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#c9a961]">Top 5 Artistas</h2>
                  <p className="text-xs text-[#666]">Por volume de obras</p>
                </div>
              </div>
              {smartMetrics.topArtistas.length > 0 ? (
                <div className="space-y-3">
                  {smartMetrics.topArtistas.map((artista, index) => (
                    <div 
                      key={artista.nome}
                      className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#c9a961]/30 transition-all duration-300 group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-[#c9a961] to-[#b89a4f] text-[#0f0f0f]' :
                        index === 1 ? 'bg-gradient-to-br from-[#b89a4f] to-[#a68a3d] text-[#0f0f0f]' :
                        index === 2 ? 'bg-gradient-to-br from-[#a68a3d] to-[#8a6f2f] text-[#0f0f0f]' :
                        'bg-[#2a2a2a] text-[#888]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <TruncatedText 
                          text={artista.nome} 
                          maxLength={40}
                          className="text-sm font-semibold text-[#ccc]"
                        />
                        <p className="text-xs text-[#666] mt-1">{artista.count} obras</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#c9a961] to-[#b89a4f] rounded-full transition-all duration-500"
                            style={{ width: `${(artista.count / smartMetrics.topArtistas[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[#666] mx-auto mb-3 opacity-50" />
                  <p className="text-[#888]">Nenhum artista disponível</p>
                </div>
              )}
            </div>

            {/* Top 5 Categorias */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.dark} rounded-lg flex items-center justify-center`}>
                  <Layers className="w-5 h-5 text-[#0f0f0f]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#c9a961]">Top 5 Categorias</h2>
                  <p className="text-xs text-[#666]">Mais populares</p>
                </div>
              </div>
              {smartMetrics.topCategorias.length > 0 ? (
                <div className="space-y-3">
                  {smartMetrics.topCategorias.map((categoria, index) => (
                    <div 
                      key={categoria.nome}
                      className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#c9a961]/30 transition-all duration-300 group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-[#c9a961] to-[#b89a4f] text-[#0f0f0f]' :
                        index === 1 ? 'bg-gradient-to-br from-[#b89a4f] to-[#a68a3d] text-[#0f0f0f]' :
                        index === 2 ? 'bg-gradient-to-br from-[#a68a3d] to-[#8a6f2f] text-[#0f0f0f]' :
                        'bg-[#2a2a2a] text-[#888]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#ccc]">{categoria.nome}</p>
                        <p className="text-xs text-[#666] mt-1">{categoria.count} obras</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#c9a961] to-[#b89a4f] rounded-full transition-all duration-500"
                            style={{ width: `${(categoria.count / smartMetrics.topCategorias[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-[#666] mx-auto mb-3 opacity-50" />
                  <p className="text-[#888]">Nenhuma categoria disponível</p>
                </div>
              )}
            </div>
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Obras por Categoria - Pie Chart Premium */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-lg flex items-center justify-center`}>
                    <PieChartIcon className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#c9a961]">Distribuição por Categoria</h2>
                    <p className="text-xs text-[#666]">Percentual de obras</p>
                  </div>
                </div>
          </div>
          {categoriaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoriaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#c9a961"
                  dataKey="value"
                >
                      {categoriaData.map((_, index) => {
                        const colors = ['#c9a961', '#d4b87a', '#b89a4f', '#a68a3d', '#e8d5a3', '#f0e4c4']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                </Pie>
                    <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
                <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                    <PieChartIcon size={48} className="mx-auto mb-3 text-[#666]" />
                    <p className="text-[#888]">Nenhum dado disponível</p>
              </div>
            </div>
          )}
        </div>

            {/* Obras por Scraper - Bar Chart Premium */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.medium} rounded-lg flex items-center justify-center`}>
                    <Zap className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#c9a961]">Performance por Scraper</h2>
                    <p className="text-xs text-[#666]">Volume coletado</p>
                  </div>
                </div>
          </div>
          {scraperData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={scraperData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                    <defs>
                      <linearGradient id="scraperGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a961" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a68a3d" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                      stroke="#888"
                      tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                    <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                      fill="url(#scraperGradient)"
                  radius={[8, 8, 0, 0]}
                  name="Obras"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
                <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                    <Zap size={48} className="mx-auto mb-3 text-[#666]" />
                    <p className="text-[#888]">Nenhum dado disponível</p>
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Últimas Sessões - Tabela Premium */}
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#2a2a2a] bg-gradient-to-r from-[#1a1a1a] to-transparent">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${GOLD_GRADIENTS.light} rounded-lg flex items-center justify-center`}>
                    <Clock className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#c9a961]">Últimas Sessões</h2>
                    <p className="text-xs text-[#666]">Atividade recente do sistema</p>
                  </div>
                </div>
                <a 
                  href="/sessoes" 
                  className="flex items-center gap-2 text-sm text-[#c9a961] hover:text-[#d4b87a] transition-colors font-medium"
                >
                  Ver Todas
                  <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Scraper</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider">Obras</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden sm:table-cell">Páginas</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden md:table-cell">Início</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#c9a961] uppercase tracking-wider hidden lg:table-cell">Fim</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
              {currentSessions.length > 0 ? (
                currentSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                        <td className="px-6 py-4">
                          <strong className="text-[#fff] text-sm font-semibold">#{session.id}</strong>
                    </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c9a961]/10 text-[#c9a961] border border-[#c9a961]/30">
                        {session.scraper_name.toUpperCase()}
                      </span>
                    </td>
                        <td className="px-6 py-4">
                      {session.status === 'concluido' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Concluído
                            </span>
                      )}
                      {session.status === 'executando' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c9a961]/20 text-[#c9a961] border border-[#c9a961]/30 animate-pulse">
                              <Activity className="w-3 h-3 mr-1" />
                              Executando
                            </span>
                      )}
                      {session.status === 'erro' && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Erro
                            </span>
                      )}
                    </td>
                        <td className="px-6 py-4">
                          <strong className="text-[#c9a961] text-sm font-semibold">{session.total_obras}</strong>
                    </td>
                        <td className="px-6 py-4 text-sm text-[#888] hidden sm:table-cell">{session.paginas_processadas}</td>
                        <td className="px-6 py-4 text-sm text-[#888] hidden md:table-cell">
                      {new Date(session.inicio).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                        <td className="px-6 py-4 text-sm text-[#888] hidden lg:table-cell">
                      {session.fim ? new Date(session.fim).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                          }) : <span className="text-[#666]">-</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                      <td colSpan={7} className="text-center py-16">
                    <div>
                          <Clock size={48} className="mx-auto mb-4 text-[#666] opacity-50" />
                          <p className="text-[#888] mb-2 font-medium">Nenhuma sessão encontrada</p>
                          <p className="text-sm text-[#666]">Execute um scraping para ver as sessões aqui</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
