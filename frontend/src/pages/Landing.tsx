import { Link } from 'react-router-dom'
import { 
  BarChart3, Zap, Shield, Globe, ArrowRight, Sparkles, Activity, Target,
  Brain, CheckCircle2, Star, Rocket, Award, Crown, UserPlus, LayoutDashboard, Play,
  ChevronDown, ChevronUp, Mail, Phone, MessageSquare, Facebook, Linkedin, Instagram, User, Send, FileText, Menu, X, 
  TrendingUp, Clock, Image as ImageIcon, DollarSign, Gauge, Percent, PieChart as PieChartIcon, Users, Layers,
  HelpCircle, Calculator, DollarSign as DollarSignIcon, Radio, RefreshCw, Download, Filter, Database, Sparkles as SparklesIcon
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'

// Componente FAQ Accordion
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Quais são os planos disponíveis e suas diferenças?',
      answer: 'Oferecemos três planos principais: Básico (R$ 99/mês) com acesso limitado a 1.000 obras/mês e suporte por email; Premium (R$ 299/mês) com acesso ilimitado, suporte prioritário, exportação avançada e acesso à API; e Enterprise (personalizado) com todos os recursos do Premium, servidor dedicado, suporte 24/7 e integrações customizadas. Cada plano é projetado para atender diferentes necessidades de uso.',
    },
    {
      question: 'Quais formas de pagamento são aceitas?',
      answer: 'Aceitamos diversas formas de pagamento para sua comodidade: cartões de crédito (Visa, Mastercard, American Express, Elo), cartões de débito, PIX (pagamento instantâneo brasileiro), boleto bancário e transferência bancária. Todos os pagamentos são processados de forma segura através de gateways de pagamento certificados e criptografados.',
    },
    {
      question: 'Posso cancelar minha assinatura a qualquer momento?',
      answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas de cancelamento. O acesso ao sistema permanecerá ativo até o final do período já pago. Após o cancelamento, você não será cobrado novamente e poderá reativar sua conta quando desejar, mantendo todos os seus dados e histórico.',
    },
    {
      question: 'Há período de teste gratuito?',
      answer: 'Sim! Oferecemos um período de teste gratuito de 7 dias para novos usuários. Durante esse período, você terá acesso completo a todas as funcionalidades do plano Premium, permitindo que você explore o sistema e avalie se atende às suas necessidades antes de se comprometer com uma assinatura. Não é necessário cartão de crédito para iniciar o teste.',
    },
    {
      question: 'Como funciona a renovação automática?',
      answer: 'Nossas assinaturas são renovadas automaticamente no final de cada período (mensal ou anual, conforme escolhido). Você receberá um email de notificação 3 dias antes da renovação. Se desejar cancelar, basta acessar as configurações da conta antes da data de renovação. O pagamento será processado automaticamente usando o método de pagamento cadastrado.',
    },
    {
      question: 'Posso mudar de plano a qualquer momento?',
      answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através das configurações da conta. Ao fazer upgrade, o novo plano será ativado imediatamente e você será cobrado proporcionalmente. Ao fazer downgrade, as mudanças entrarão em vigor no próximo ciclo de cobrança, garantindo que você aproveite o período já pago do plano atual.',
    },
    {
      question: 'Há descontos para planos anuais?',
      answer: 'Sim! Oferecemos descontos especiais para assinaturas anuais. Ao escolher o pagamento anual, você economiza até 20% comparado ao pagamento mensal. Além disso, assinantes anuais recebem benefícios exclusivos como prioridade no suporte, acesso antecipado a novas funcionalidades e relatórios personalizados mensais.',
    },
    {
      question: 'O que acontece se meu pagamento falhar?',
      answer: 'Se um pagamento falhar, você receberá notificações por email e dentro do sistema. Tentaremos processar o pagamento novamente automaticamente após 3 dias. Durante esse período, seu acesso permanecerá ativo. Se após múltiplas tentativas o pagamento não for processado, o acesso será suspenso temporariamente até a regularização. Você pode atualizar seu método de pagamento a qualquer momento nas configurações da conta.',
    },
  ]

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            className="group bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#c9a961]/30 transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#888] flex-shrink-0 transition-transform duration-300 ${
                  isOpen ? 'transform rotate-180 text-[#c9a961]' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-6 pt-0 animate-slide-up">
                <div className="pt-4 border-t border-[#2a2a2a]">
                  <p className="text-[#888] leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showROICalculator, setShowROICalculator] = useState(false)
  const [showPriceSimulator, setShowPriceSimulator] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Buscar dados reais para Métricas em Tempo Real
  const { data: realTimeStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats-realtime'],
    queryFn: apiService.getStats,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    retry: 1,
  })

  const { data: recentSessionsData } = useQuery({
    queryKey: ['sessions-realtime', { limit: 5 }],
    queryFn: () => apiService.getSessions({ per_page: 5 }),
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    retry: 1,
  })

  // Extrair array de sessões da resposta da API
  const recentSessions = useMemo(() => {
    if (!recentSessionsData) return []
    // Se for um array, retornar diretamente
    if (Array.isArray(recentSessionsData)) return recentSessionsData
    // Se for um objeto com propriedade 'sessions', retornar isso
    if (recentSessionsData && typeof recentSessionsData === 'object' && 'sessions' in recentSessionsData) {
      return Array.isArray((recentSessionsData as any).sessions) ? (recentSessionsData as any).sessions : []
    }
    // Se for um objeto com propriedade 'data', retornar isso
    if (recentSessionsData && typeof recentSessionsData === 'object' && 'data' in recentSessionsData) {
      return Array.isArray((recentSessionsData as any).data) ? (recentSessionsData as any).data : []
    }
    return []
  }, [recentSessionsData])

  const { data: recentObrasData } = useQuery({
    queryKey: ['obras-realtime', { limit: 10 }],
    queryFn: () => apiService.getObras({ page: 1, per_page: 10 }),
    refetchInterval: 8000, // Atualiza a cada 8 segundos
    retry: 1,
  })

  // Extrair array de obras da resposta da API
  const recentObras = useMemo(() => {
    if (!recentObrasData) return []
    // Se for um array, retornar diretamente
    if (Array.isArray(recentObrasData)) return recentObrasData
    // Se for um objeto com propriedade 'obras', retornar isso
    if (recentObrasData && typeof recentObrasData === 'object' && 'obras' in recentObrasData) {
      return Array.isArray((recentObrasData as any).obras) ? (recentObrasData as any).obras : []
    }
    // Se for um objeto com propriedade 'data', retornar isso
    if (recentObrasData && typeof recentObrasData === 'object' && 'data' in recentObrasData) {
      return Array.isArray((recentObrasData as any).data) ? (recentObrasData as any).data : []
    }
    return []
  }, [recentObrasData])

  // Animação de contador
  const [animatedValue, setAnimatedValue] = useState(0)
  useEffect(() => {
    const statsTyped = realTimeStats as any
    if (statsTyped?.total_obras) {
      const target = statsTyped.total_obras
      const duration = 2000
      const steps = 60
      const increment = target / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedValue(target)
          clearInterval(timer)
        } else {
          setAnimatedValue(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [realTimeStats])

  // Quiz interativo
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({})
  const [quizStep, setQuizStep] = useState(0)
  
  const quizQuestions = [
    {
      question: 'Quantas obras você monitora por mês?',
      options: ['Menos de 100', '100-500', '500-1000', 'Mais de 1000'],
    },
    {
      question: 'Qual é seu principal objetivo?',
      options: ['Análise de mercado', 'Monitoramento de concorrentes', 'Descoberta de oportunidades', 'Todos os acima'],
    },
    {
      question: 'Qual é seu orçamento mensal?',
      options: ['Até R$ 100', 'R$ 100-300', 'R$ 300-500', 'Acima de R$ 500'],
    },
  ]

  const calculateRecommendedPlan = () => {
    const answers = Object.values(quizAnswers)
    if (answers[2] === 'Até R$ 100') return 'Básico'
    if (answers[2] === 'R$ 100-300' || answers[1] === 'Análise de mercado') return 'Premium'
    return 'Enterprise'
  }

  // Função para scroll suave até seção
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileMenuOpen(false)
    }
  }

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Depoimentos com imagens
  const testimonials = [
    {
      id: 1,
      name: 'Ana Costa',
      role: 'CEO na ArtMarket Solutions',
      country: 'Brasil',
      flag: 'BR',
      image: '/images/foto1.png',
      quote: 'Altamente impressionada com a profissionalidade e dedicação do Scrapers Art. A comunicação clara gerou confiança. Empolgada para fazer parte desta jornada!',
    },
    {
      id: 2,
      name: 'Mario Roberto',
      role: 'Diretora de Arte na Gallery Premium',
      country: 'Brasil',
      flag: 'BR',
      image: '/images/foto2.png',
      quote: 'O sistema transformou completamente nossa forma de monitorar o mercado de arte. A precisão dos dados e a facilidade de uso são impressionantes. Recomendo sem hesitação!',
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      role: 'Fundador da Leilões & Arte',
      country: 'Brasil',
      flag: 'BR',
      image: '/images/foto3.png',
      quote: 'A melhor plataforma de inteligência de mercado que já utilizei. Os insights gerados nos ajudaram a tomar decisões estratégicas muito mais assertivas. Excelente investimento!',
    },
  ]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      
      setScrollY(scrollTop)
      setScrolled(scrollTop > 20)
      setShowScrollTop(scrollTop > 300)
      setScrollProgress(progress)

      // Reveal on scroll
      Object.keys(sectionRefs.current).forEach((key) => {
        const element = sectionRefs.current[key]
        if (element) {
          const rect = element.getBoundingClientRect()
          const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0
          if (isVisible) {
            setVisibleSections((prev) => new Set(prev).add(key))
          }
        }
      })
    }
    // Verificar estado inicial
    setScrolled(window.scrollY > 20)
    setShowScrollTop(window.scrollY > 300)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])


  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden overflow-y-auto relative">
      {/* Background Effects 3D */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201, 169, 97, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201, 169, 97, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
      </div>

      {/* Cursor Follower - Elemento Pequeno que Persegue o Mouse */}
      <div 
        className="fixed pointer-events-none z-50"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
          transition: 'left 0.15s ease-out, top 0.15s ease-out',
        }}
      >
        {/* Círculo Principal - Pequeno e Sutil */}
        <div 
          className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-[#c9a961] to-[#b89a4f] opacity-60 blur-sm"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        
        {/* Anel Externo - Efeito de Onda */}
        <div 
          className="absolute w-8 h-8 rounded-full border border-[#c9a961]/40"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
        
        {/* Partícula Central - Brilho */}
        <div 
          className="absolute w-1.5 h-1.5 rounded-full bg-[#c9a961]"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px rgba(201, 169, 97, 0.8), 0 0 16px rgba(201, 169, 97, 0.4)',
            animation: 'glow 2s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Navigation Premium - Transparente com Links */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled ? {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201, 169, 97, 0.2)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        } : {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] via-[#d4b87a] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg shadow-[#c9a961]/20 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-[#0a0a0a]" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">
                  Scrapers Art
                </h1>
                <p className="text-xs text-[#888]">Intelligence Platform</p>
              </div>
            </Link>

            {/* Links de Navegação - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Início"
              >
                Início
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Recursos"
              >
                Recursos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('realtime')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Métricas em Tempo Real"
              >
                Ao Vivo
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Como Funciona"
              >
                Como Funciona
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('planos')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Planos"
              >
                Planos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Perguntas Frequentes"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => scrollToSection('contato')}
                className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 relative group"
                title="Entre em Contato"
              >
                Contato
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c9a961] group-hover:w-full transition-all duration-300" />
              </button>
              <button
                onClick={() => setShowQuiz(true)}
                className="text-sm font-medium text-[#c9a961] border border-[#c9a961]/50 px-4 py-2 rounded-lg hover:bg-[#c9a961]/10 transition-all duration-300 relative group"
                title="Descubra qual plano é ideal para você"
              >
                <Brain className="w-4 h-4 inline mr-2" />
                Quiz
              </button>
            </div>

            {/* Botão Acessar Sistema + Menu Mobile */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="hidden sm:flex px-6 py-2.5 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 hover:scale-105 transition-all duration-300 items-center gap-2"
              >
                Entrar
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              {/* Botão Menu Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-[#ccc] hover:text-[#c9a961] hover:bg-[#1a1a1a]/50 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-6 border-t border-[#c9a961]/10 mt-4 pt-4">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Início
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Recursos
                </button>
                <button
                  onClick={() => scrollToSection('realtime')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Ao Vivo
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Como Funciona
                </button>
                <button
                  onClick={() => scrollToSection('planos')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Planos
                </button>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  FAQ
                </button>
                <button
                  onClick={() => scrollToSection('contato')}
                  className="text-sm font-medium text-[#ccc] hover:text-[#c9a961] transition-colors duration-300 text-left py-2"
                >
                  Contato
                </button>
                <Link
                  to="/login"
                  className="sm:hidden px-6 py-2.5 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                >
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer para compensar navbar fixo */}
      <div className="h-20" />

      {/* Hero Section Premium com 3D */}
      <section 
        id="hero" 
        ref={(el) => { if (el) sectionRefs.current['hero'] = el }}
        className={`relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 reveal-on-scroll ${visibleSections.has('hero') ? 'visible' : ''}`}
        style={{ overflow: 'visible' }}
      >
        {/* Meia Bola de Fundo com Gradiente - DESCENDO ATÉ OS BOTÕES */}
        <div 
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '750px',
            zIndex: 5,
            overflow: 'visible',
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: '100vw',
              minWidth: '100%',
              height: '750px',
              background: 'radial-gradient(ellipse 90% 75% at 50% 0%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.32) 8%, rgba(240, 228, 196, 0.45) 15%, rgba(212, 184, 122, 0.5) 25%, rgba(201, 169, 97, 0.4) 35%, rgba(184, 154, 79, 0.3) 45%, rgba(166, 138, 61, 0.22) 55%, rgba(148, 122, 43, 0.15) 65%, rgba(130, 106, 25, 0.1) 75%, rgba(112, 90, 7, 0.05) 85%, transparent 100%)',
              clipPath: 'ellipse(90% 75% at 50% 0%)',
              WebkitClipPath: 'ellipse(90% 75% at 50% 0%)',
            }}
          />
        </div>

        {/* Elementos Flutuantes - Bolas Douradas */}
        <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block" style={{ zIndex: 6 }}>
          {/* Bola 1 - Superior Esquerda */}
          <div 
            className="absolute top-20 left-10 w-24 md:w-32 h-24 md:h-32"
            style={{
              animation: 'float 8s ease-in-out infinite',
              animationDelay: '0s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="heroSphere1" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#f4e4bc" stopOpacity="1" />
                  <stop offset="50%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
                </radialGradient>
                <filter id="heroSphereShadow1">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="2" dy="4" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#heroSphere1)" filter="url(#heroSphereShadow1)" opacity="0.6" />
              <ellipse cx="70" cy="70" rx="35" ry="35" fill="rgba(255, 255, 255, 0.5)" opacity="0.7" />
            </svg>
          </div>

          {/* Bola 2 - Superior Direita */}
          <div 
            className="absolute top-32 right-8 md:right-16 w-16 md:w-24 h-16 md:h-24"
            style={{
              animation: 'float 9s ease-in-out infinite',
              animationDelay: '2s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="heroSphere2" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#heroSphere2)" opacity="0.5" />
              <ellipse cx="70" cy="70" rx="30" ry="30" fill="rgba(255, 255, 255, 0.4)" opacity="0.6" />
            </svg>
          </div>

          {/* Bola 3 - Meio Direita */}
          <div 
            className="absolute top-1/2 right-8 md:right-20 w-20 md:w-28 h-20 md:h-28 -translate-y-1/2"
            style={{
              animation: 'float 7s ease-in-out infinite',
              animationDelay: '1s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="heroSphere3" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#e8d5a3" stopOpacity="1" />
                  <stop offset="100%" stopColor="#c9a961" stopOpacity="1" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#heroSphere3)" opacity="0.4" />
              <ellipse cx="70" cy="70" rx="28" ry="28" fill="rgba(255, 255, 255, 0.3)" opacity="0.5" />
            </svg>
          </div>

          {/* Bola 4 - Inferior Esquerda */}
          <div 
            className="absolute bottom-20 left-8 md:left-16 w-16 md:w-20 h-16 md:h-20"
            style={{
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '3s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="heroSphere4" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#c9a961" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a68a3d" stopOpacity="1" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#heroSphere4)" opacity="0.45" />
              <ellipse cx="70" cy="70" rx="25" ry="25" fill="rgba(255, 255, 255, 0.35)" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative" style={{ zIndex: 10 }}>
          <div className="text-center mb-8">
            {/* Badge Premium - Melhorado */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-[#c9a961]/15 to-[#b89a4f]/15 border border-[#c9a961]/40 rounded-full mb-6 sm:mb-8 backdrop-blur-md animate-fade-in shadow-lg shadow-[#c9a961]/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#c9a961]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#c9a961] relative z-10 animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-[#c9a961] relative z-10 tracking-wide text-center">Sistema Premium de Inteligência de Mercado</span>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#c9a961] rounded-full relative z-10 animate-ping flex-shrink-0" style={{ animationDuration: '2s' }} />
            </div>
            
            {/* Título Principal com Efeito 3D Melhorado */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 leading-[1.1] animate-slide-up px-2 overflow-visible" style={{ lineHeight: '1.1', paddingBottom: '0.2em' }}>
              <span className="block bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer overflow-visible" style={{ lineHeight: '1.1', paddingBottom: '0.15em' }}>
                Inteligência de Mercado
              </span>
              <span className="block bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mt-2 sm:mt-3 overflow-visible" style={{ lineHeight: '1.1' }}>
                em Tempo Real
              </span>
            </h1>
            
            {/* Descrição Melhorada */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-[#aaa] max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed animate-slide-up delay-100 font-light px-4">
              <span className="text-white font-medium">Monitore leilões de arte</span>, analise tendências e tome{' '}
              <span className="text-[#c9a961] font-semibold">decisões estratégicas</span> com dados precisos e{' '}
              <span className="text-white font-medium">atualizações instantâneas</span>
            </p>
            
            {/* CTAs Premium - Melhorados */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center mb-6 sm:mb-8 animate-slide-up delay-200 relative z-20 px-4">
              <Link
                to="/login"
                className="group relative w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-[#c9a961]/50 hover:scale-105 sm:hover:scale-110 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden"
              >
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                  Começar Agora
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#d4b87a] to-[#c9a961] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <button 
                onClick={() => scrollToSection('demo')}
                className="group relative w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-2 border-[#c9a961]/60 text-[#c9a961] font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl hover:bg-[#c9a961]/15 hover:border-[#c9a961] hover:shadow-xl hover:shadow-[#c9a961]/30 transition-all duration-300 backdrop-blur-sm overflow-hidden"
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#c9a961]/0 via-[#c9a961]/20 to-[#c9a961]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                  Ver Demonstração
                </span>
              </button>
            </div>

            {/* Stats Cards Premium */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full animate-fade-in delay-300 px-2 sm:px-4 md:px-6 lg:px-8">
              {[
                { label: 'Obras Monitoradas', value: '10K+', icon: Target, color: 'from-[#c9a961] to-[#b89a4f]' },
                { label: 'Leilões Ativos', value: '500+', icon: Activity, color: 'from-[#d4b87a] to-[#c9a961]' },
                { label: 'Precisão', value: '100%', icon: Shield, color: 'from-[#b89a4f] to-[#a68a3d]' },
                { label: 'Atualização', value: '24/7', icon: Zap, color: 'from-[#c9a961] to-[#d4b87a]' },
                { label: 'Artistas', value: '2.5K+', icon: Users, color: 'from-[#d4b87a] to-[#b89a4f]' },
                { label: 'Categorias', value: '50+', icon: Layers, color: 'from-[#b89a4f] to-[#a68a3d]' },
              ].map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div 
                    key={idx} 
                    className="group relative overflow-hidden bg-gradient-to-br from-[#0f0f0f] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 flex flex-col items-center justify-center text-center"
                    style={{
                      transform: `translateY(${scrollY * 0.03 * (idx + 1)}px)`,
                      transition: 'transform 0.1s ease-out',
                    }}
                  >
                    {/* Efeito Neon nos Cantos */}
                    <div className={`absolute top-0 left-0 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                    <div className={`absolute top-0 right-0 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-gradient-to-bl ${stat.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                    <div className={`absolute bottom-0 left-0 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-gradient-to-tr ${stat.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                    <div className={`absolute bottom-0 right-0 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-gradient-to-tl ${stat.color} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                    
                    {/* Background Gradient Sutil */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                    
                    {/* Conteúdo */}
                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${stat.color} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#0a0a0a]" />
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2 group-hover:text-[#c9a961] transition-colors duration-300">{stat.value}</div>
                      <div className="text-[10px] sm:text-xs text-[#888] font-medium uppercase tracking-wider group-hover:text-[#aaa] transition-colors duration-300 leading-tight px-1">{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Interativa do Dashboard */}
      <section id="demo" className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Background com Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201, 169, 97, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 169, 97, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          {/* Gradientes de fundo */}
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#c9a961]/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#b89a4f]/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#c9a961]" />
              <span className="text-xs sm:text-sm font-semibold text-[#c9a961]">Demo Interativa</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 px-2">
              Explore o <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Dashboard</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#888] max-w-2xl mx-auto px-4">
              Veja como nosso sistema transforma dados em insights acionáveis
            </p>
          </div>

          {/* Container do Dashboard Preview */}
          <div className="relative">
            {/* Dashboard Mockup */}
            <div className="relative bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl overflow-hidden group hover:border-[#c9a961]/40 transition-all duration-500">
              {/* Header do Dashboard - Igual ao Real */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-[#b89a4f]/5 pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#c9a961] via-[#d4b87a] to-[#b89a4f] rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-[#c9a961]/20">
                      <Brain className="w-8 h-8 text-[#0f0f0f]" />
                    </div>
                    <div>
                      <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mb-2">
                        Intelligence Dashboard
                      </h3>
                      <p className="text-[#888] text-sm">Análise inteligente e insights em tempo real</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards Premium - Exatamente como no Dashboard Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total de Obras */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <ImageIcon className="w-7 h-7 text-[#0f0f0f]" />
                      </div>
                      <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" />
                        +12.5%
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                        10.247
                      </p>
                      <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                        Total de Obras
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sessões Totais */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b89a4f]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#d4b87a] to-[#c9a961] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-7 h-7 text-[#0f0f0f]" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        45
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                        1.234
                      </p>
                      <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                        Sessões Totais
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-xs text-[#666]">
                        <Activity className="w-3 h-3" />
                        <span>12 ativas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Valor Total */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4b87a]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-7 h-7 text-[#0f0f0f]" />
                      </div>
                      <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                        <Gauge className="w-3 h-3" />
                        Total
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-2xl sm:text-3xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                        R$ 2.4M
                      </p>
                      <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                        Valor Total
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <p className="text-xs text-[#666] break-words overflow-hidden">
                        Média: R$ 234.567
                      </p>
                    </div>
                  </div>
                </div>

                {/* Taxa de Sucesso / Com Lances */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#a68a3d]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#b89a4f] to-[#a68a3d] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Percent className="w-7 h-7 text-[#0f0f0f]" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3" />
                        85.2%
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-4xl font-bold text-[#c9a961] mb-1 leading-tight break-words overflow-hidden">
                        8.730
                      </p>
                      <p className="text-sm font-medium text-[#888] uppercase tracking-wider">
                        Com Lances
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <p className="text-xs text-[#666]">
                        1.234 obras premium
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Inteligentes - Cards Premium (Igual ao Dashboard Real) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Obra Mais Cara */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#c9a961]/20">
                        <Crown className="w-6 h-6 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#c9a961]">Obra Mais Valiosa</h4>
                        <p className="text-xs text-[#666]">Recorde do sistema</p>
                      </div>
                    </div>
                    <div className="space-y-4 min-w-0">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent mb-2 break-words overflow-hidden">
                          R$ 800.000,00
                        </p>
                        <p className="text-sm text-[#ccc] font-medium mb-1">Paisagem Noturna</p>
                        <p className="text-xs text-[#888]">João Silva</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mais Disputada */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#b89a4f]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#d4b87a] to-[#c9a961] rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#c9a961]/20">
                        <Target className="w-6 h-6 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#c9a961]">Mais Disputada</h4>
                        <p className="text-xs text-[#666]">Maior interesse</p>
                      </div>
                    </div>
                    <div className="space-y-4 min-w-0">
                      <div>
                        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                          <p className="text-3xl font-bold text-[#c9a961] break-words overflow-hidden">
                            127
                          </p>
                          <span className="text-sm text-[#888]">lances</span>
                        </div>
                        <p className="text-sm text-[#ccc] font-medium mb-1">Abstração Moderna</p>
                        <p className="text-xs text-[#888]">Maria Santos</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artista em Destaque */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d4b87a]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#d4b87a] rounded-xl flex items-center justify-center shadow-lg ring-2 ring-[#c9a961]/20">
                        <Award className="w-6 h-6 text-[#0f0f0f]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#c9a961]">Artista em Destaque</h4>
                        <p className="text-xs text-[#666]">Top do mês</p>
                      </div>
                    </div>
                    <div className="space-y-4 min-w-0">
                      <div>
                        <p className="text-2xl font-bold text-[#c9a961] mb-2 break-words overflow-hidden">
                          Carlos Oliveira
                        </p>
                        <p className="text-sm text-[#888] mb-4">
                          234 obras coletadas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos - Igual ao Dashboard Real */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfico Pie Chart - Obras por Categoria */}
                <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center">
                      <PieChartIcon className="w-5 h-5 text-[#0f0f0f]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Obras por Categoria</h4>
                      <p className="text-xs text-[#666]">Distribuição</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center h-48">
                    <div className="relative w-40 h-40">
                      {/* Mockup do Pie Chart */}
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#2a2a2a" strokeWidth="40" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#c9a961" strokeWidth="40" strokeDasharray={`${251.2 * 0.4} ${251.2 * 0.6}`} strokeDashoffset="0" transform="rotate(-90 100 100)" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#d4b87a" strokeWidth="40" strokeDasharray={`${251.2 * 0.3} ${251.2 * 0.7}`} strokeDashoffset={`-${251.2 * 0.4}`} transform="rotate(-90 100 100)" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#b89a4f" strokeWidth="40" strokeDasharray={`${251.2 * 0.2} ${251.2 * 0.8}`} strokeDashoffset={`-${251.2 * 0.7}`} transform="rotate(-90 100 100)" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#a68a3d" strokeWidth="40" strokeDasharray={`${251.2 * 0.1} ${251.2 * 0.9}`} strokeDashoffset={`-${251.2 * 0.9}`} transform="rotate(-90 100 100)" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {['Pinturas', 'Esculturas', 'Fotografias', 'Desenhos'].map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#c9a961]' : idx === 1 ? 'bg-[#d4b87a]' : idx === 2 ? 'bg-[#b89a4f]' : 'bg-[#a68a3d]'}`} />
                        <span className="text-sm text-[#888]">{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gráfico Bar Chart - Obras por Scraper */}
                <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#d4b87a] to-[#c9a961] rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-[#0f0f0f]" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Obras por Scraper</h4>
                      <p className="text-xs text-[#666]">Comparativo</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'iArremate', value: 65, color: 'from-[#c9a961] to-[#b89a4f]' },
                      { name: 'LeilõesBR', value: 35, color: 'from-[#d4b87a] to-[#c9a961]' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#ccc]">{item.name}</span>
                          <span className="text-sm font-bold text-[#c9a961]">{item.value}%</span>
                        </div>
                        <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay com CTA */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent rounded-3xl pointer-events-none flex items-end justify-center pb-8">
              <Link
                to="/login"
                className="pointer-events-auto px-8 py-4 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-[#c9a961]/40 hover:scale-105 transition-all duration-300 flex items-center gap-3 group"
              >
                <Play className="w-5 h-5" />
                <span>Experimentar Agora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Premium - Layout Dividido */}
      <section id="features" className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Lado Esquerdo - Texto */}
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div>
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-4 sm:mb-6">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#c9a961]" />
                  <span className="text-xs sm:text-sm font-semibold text-[#c9a961]">Recursos Premium</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight">
                  O Que <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Nosso Sistema</span> Proporciona
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-[#888] leading-relaxed mb-6 sm:mb-8">
                  Tecnologia de ponta para análise inteligente de mercado de arte. Nossa plataforma oferece recursos avançados que transformam dados em insights acionáveis.
                </p>
              </div>

              {/* Lista de Benefícios */}
              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: CheckCircle2, text: 'Análise preditiva com Inteligência Artificial' },
                  { icon: CheckCircle2, text: 'Dashboard interativo em tempo real' },
                  { icon: CheckCircle2, text: 'Monitoramento contínuo 24/7' },
                  { icon: CheckCircle2, text: 'Precisão de 99.9% nos dados coletados' },
                ].map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex items-center gap-3 sm:gap-4 group">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0a0a0a]" />
                      </div>
                      <p className="text-sm sm:text-base md:text-lg text-[#ccc] group-hover:text-white transition-colors">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lado Direito - Roda Gigante com Cards Girando */}
            <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center order-1 lg:order-2">
              {/* Container Principal - Centraliza tudo */}
              <div className="relative w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] h-full max-h-[400px] sm:max-h-[500px] md:max-h-[600px] mx-auto scale-75 sm:scale-90 md:scale-100">
                {/* Container da Roda Gigante - Rotaciona */}
                <div 
                  className="absolute inset-0"
                  style={{
                    animation: 'rotateCircle 30s linear infinite',
                  }}
                >
                  {/* Elementos Flutuantes em Círculo */}
                  {[
                    {
                      icon: Brain,
                      title: 'IA',
                      gradient: 'from-[#c9a961] to-[#b89a4f]',
                      angle: 0,
                    },
                    {
                      icon: BarChart3,
                      title: 'Analytics',
                      gradient: 'from-[#d4b87a] to-[#c9a961]',
                      angle: 60,
                    },
                    {
                      icon: Zap,
                      title: 'Real-Time',
                      gradient: 'from-[#b89a4f] to-[#a68a3d]',
                      angle: 120,
                    },
                    {
                      icon: Shield,
                      title: 'Seguro',
                      gradient: 'from-[#c9a961] to-[#d4b87a]',
                      angle: 180,
                    },
                    {
                      icon: Globe,
                      title: 'Multi-Platform',
                      gradient: 'from-[#d4b87a] to-[#b89a4f]',
                      angle: 240,
                    },
                    {
                      icon: Rocket,
                      title: 'Performance',
                      gradient: 'from-[#b89a4f] to-[#c9a961]',
                      angle: 300,
                    },
                  ].map((element, idx) => {
                    const Icon = element.icon
                    // Raio responsivo - será ajustado via CSS
                    const radius = 240 // Base, ajustado via scale no container
                    const angleRad = (element.angle * Math.PI) / 180
                    const x = Math.cos(angleRad) * radius
                    const y = Math.sin(angleRad) * radius
                    
                    return (
                      <div
                        key={idx}
                        className="absolute group cursor-pointer hidden sm:block"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)',
                          animation: `rotateReverse 30s linear infinite`,
                          zIndex: 10,
                        }}
                      >
                        <div className="relative">
                          {/* Glow Effect */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${element.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300 rounded-xl sm:rounded-2xl md:rounded-3xl`} />
                          
                          {/* Card */}
                          <div className={`relative bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 shadow-2xl group-hover:border-[#c9a961]/50 transition-all duration-300 group-hover:scale-110`}>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br ${element.gradient} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[#0a0a0a]" />
                            </div>
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#c9a961] group-hover:text-[#d4b87a] transition-colors">
                              {element.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Elemento Central - Grande e Destaque (Fixo no Centro) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div className="relative pointer-events-auto">
                    {/* Anéis Concêntricos Animados */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-32 h-32 border-2 border-[#c9a961]/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute w-40 h-40 border border-[#c9a961]/10 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
                      <div className="absolute w-48 h-48 border border-[#b89a4f]/10 rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                    </div>

                    {/* Card Central */}
                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#151515] border-2 border-[#c9a961] rounded-3xl p-8 shadow-2xl shadow-[#c9a961]/20 group hover:scale-105 transition-all duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#c9a961] to-[#d4b87a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-12 transition-transform">
                          <Brain className="w-10 h-10 text-[#0a0a0a]" />
                        </div>
                        <h3 className="text-2xl font-black text-[#c9a961] mb-2">Sistema</h3>
                        <p className="text-sm text-[#888]">Inteligente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas em Tempo Real - Dashboard Ao Vivo */}
      <section id="realtime" className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Background com Efeitos */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201, 169, 97, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 169, 97, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          {/* Gradientes de fundo animados */}
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#b89a4f]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        {/* Elementos Flutuantes - Um em Cada Canto */}
        <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block" style={{ zIndex: 5 }}>
          {/* Elemento Flutuante - Canto Superior Esquerdo */}
          <div 
            className="absolute top-10 left-10 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48"
            style={{
              animation: 'float 8s ease-in-out infinite',
              animationDelay: '0s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="realtimeSphere1" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#f4e4bc" stopOpacity="1" />
                  <stop offset="50%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
                </radialGradient>
                <filter id="realtimeSphereShadow1">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="2" dy="4" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#realtimeSphere1)" filter="url(#realtimeSphereShadow1)" opacity="0.6" />
              <ellipse cx="70" cy="70" rx="35" ry="35" fill="rgba(255, 255, 255, 0.5)" opacity="0.7" />
            </svg>
          </div>

          {/* Elemento Flutuante - Canto Inferior Direito */}
          <div 
            className="absolute bottom-10 right-10 w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52"
            style={{
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '2s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="realtimeSphere2" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="50%" stopColor="#c9a961" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a68a3d" stopOpacity="1" />
                </radialGradient>
                <filter id="realtimeSphereShadow2">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                  <feOffset dx="3" dy="5" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#realtimeSphere2)" filter="url(#realtimeSphereShadow2)" opacity="0.5" />
              <ellipse cx="70" cy="70" rx="40" ry="40" fill="rgba(255, 255, 255, 0.4)" opacity="0.6" />
              {/* Efeito de brilho adicional */}
              <circle cx="100" cy="100" r="60" fill="rgba(201, 169, 97, 0.2)" opacity="0.4" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-4 sm:mb-6">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-[#c9a961] animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-[#c9a961]">Ao Vivo</span>
              <div className="w-2 h-2 bg-[#c9a961] rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight px-2">
              Métricas em <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Tempo Real</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#888] max-w-2xl mx-auto px-4">
              Veja o sistema trabalhando agora mesmo. Dados atualizados a cada segundo.
            </p>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Total de Obras - Animado */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
                    <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Live
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl sm:text-4xl font-black text-[#c9a961] mb-1 leading-tight">
                    {isLoadingStats ? (
                      <span className="inline-block w-20 h-10 bg-[#2a2a2a] rounded animate-pulse" />
                    ) : (
                      <span className="tabular-nums">{animatedValue.toLocaleString('pt-BR')}</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#888] uppercase tracking-wider">
                    Obras Coletadas
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#666] flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '2s' }} />
                    Atualizando...
                  </p>
                </div>
              </div>
            </div>

            {/* Sessões Ativas */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b89a4f]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#d4b87a] to-[#c9a961] rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                    <Zap className="w-3 h-3" />
                    Ativo
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl sm:text-4xl font-black text-[#c9a961] mb-1 leading-tight">
                    {isLoadingStats ? (
                      <span className="inline-block w-16 h-10 bg-[#2a2a2a] rounded animate-pulse" />
                    ) : (
                      <span className="tabular-nums">{(realTimeStats as any)?.total_sessoes || 0}</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#888] uppercase tracking-wider">
                    Sessões Totais
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#666]">
                    {recentSessions?.filter((s: any) => s.status === 'em_andamento').length || 0} em execução
                  </p>
                </div>
              </div>
            </div>

            {/* Taxa de Sucesso */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4b87a]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
                    <Percent className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    +5.2%
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl sm:text-4xl font-black text-[#c9a961] mb-1 leading-tight">
                    {isLoadingStats ? (
                      <span className="inline-block w-16 h-10 bg-[#2a2a2a] rounded animate-pulse" />
                    ) : (
                      <span className="tabular-nums">99.8%</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#888] uppercase tracking-wider">
                    Taxa de Sucesso
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c9a961] to-[#d4b87a] rounded-full transition-all duration-1000"
                      style={{ width: '99.8%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Última Atualização */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b89a4f]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#a68a3d] to-[#947a2b] rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center gap-1 text-[#c9a961] text-xs font-semibold bg-[#c9a961]/10 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    Agora
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-2xl sm:text-3xl font-black text-[#c9a961] mb-1 leading-tight">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-[#888] uppercase tracking-wider">
                    Última Atualização
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#666] flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Sistema Online
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid com Feed de Atividades e Gráfico */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Feed de Atividades em Tempo Real */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Atividades Recentes</h3>
                    <p className="text-xs text-[#888]">Últimas atualizações do sistema</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto hide-scrollbar">
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 animate-pulse">
                        <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2" />
                        <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : recentObras && Array.isArray(recentObras) && recentObras.length > 0 ? (
                  (Array.isArray(recentObras) ? recentObras : []).slice(0, 8).map((obra: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#c9a961]/30 transition-all duration-300 group"
                      style={{
                        animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961]/20 to-[#b89a4f]/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-5 h-5 text-[#c9a961]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white mb-1 truncate group-hover:text-[#c9a961] transition-colors">
                            {obra.titulo || 'Obra sem título'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#888]">
                            <span>{obra.nome_artista || 'Artista desconhecido'}</span>
                            <span>•</span>
                            <span className="text-[#c9a961]">{obra.valor || 'Sem valor'}</span>
                          </div>
                        </div>
                        <div className="text-xs text-[#666] flex-shrink-0">
                          Agora
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#888] text-sm">Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de Crescimento */}
            <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-5 h-5 text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Crescimento</h3>
                    <p className="text-xs text-[#888]">Últimos 7 dias</p>
                  </div>
                </div>
              </div>
              <div className="relative h-[300px] flex items-end justify-between gap-2">
                {[65, 72, 68, 85, 78, 92, 88].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        className="w-full bg-gradient-to-t from-[#c9a961] to-[#d4b87a] rounded-t-lg group-hover:from-[#d4b87a] group-hover:to-[#c9a961] transition-all duration-300 relative overflow-hidden"
                        style={{
                          height: `${value}%`,
                          animation: `slideUp 0.8s ease-out ${idx * 0.1}s both`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <span className="text-xs text-[#888] font-medium">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][idx]}</span>
                    <span className="text-xs text-[#c9a961] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#888] mb-1">Média Diária</p>
                    <p className="text-2xl font-black text-[#c9a961]">+{Math.round([65, 72, 68, 85, 78, 92, 88].reduce((a, b) => a + b, 0) / 7)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#888] mb-1">Total Semanal</p>
                    <p className="text-2xl font-black text-[#c9a961]">+548 obras</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sessões Recentes */}
          {recentSessions && recentSessions.length > 0 && (
            <div className="mt-8 sm:mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Sessões Recentes</h3>
                <Link
                  to="/sessoes"
                  className="text-sm text-[#c9a961] hover:text-[#d4b87a] transition-colors flex items-center gap-2"
                >
                  Ver Todas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentSessions.slice(0, 3).map((session: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#c9a961]/30 transition-all duration-300 group"
                    style={{
                      animation: `fadeIn 0.6s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          session.status === 'concluido' ? 'bg-emerald-400' :
                          session.status === 'em_andamento' ? 'bg-[#c9a961] animate-pulse' :
                          'bg-red-400'
                        }`} />
                        <span className="text-xs font-semibold text-[#c9a961] uppercase">
                          {session.scraper_name || 'N/A'}
                        </span>
                      </div>
                      <span className="text-xs text-[#666]">
                        #{session.id}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#888]">Obras:</span>
                        <span className="text-white font-bold">{session.total_obras || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#888]">Páginas:</span>
                        <span className="text-white font-bold">{session.paginas_processadas || 0}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                        <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              session.status === 'concluido' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                              session.status === 'em_andamento' ? 'bg-gradient-to-r from-[#c9a961] to-[#d4b87a]' :
                              'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{
                              width: session.status === 'concluido' ? '100%' :
                                     session.status === 'em_andamento' ? '65%' : '0%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Processo Passo a Passo - Como Entrar na Plataforma */}
      <section id="how-it-works" className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-visible pt-16 sm:pt-24 md:pt-32">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#b89a4f]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-4 sm:mb-6">
              <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-[#c9a961]" />
              <span className="text-xs sm:text-sm font-semibold text-[#c9a961]">Comece Agora</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight px-2">
              Como <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Entrar</span> na Plataforma
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#888] max-w-2xl mx-auto px-4">
              Siga estes passos simples para começar a usar nosso sistema de inteligência de mercado
            </p>
          </div>

          {/* Cards de Processo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-4">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Criar Conta',
                description: 'Para começar, acesse nosso sistema, preencha seus dados e crie sua conta premium.',
                gradient: 'from-[#c9a961] to-[#b89a4f]',
              },
              {
                step: '02',
                icon: LayoutDashboard,
                title: 'Explorar Dashboard',
                description: 'Após criar sua conta, explore o dashboard interativo e descubra todas as funcionalidades disponíveis.',
                gradient: 'from-[#d4b87a] to-[#c9a961]',
              },
              {
                step: '03',
                icon: Play,
                title: 'Começar a Usar!',
                description: 'Agora você está pronto! Navegue pelas obras, analise dados e aproveite todas as ferramentas do sistema.',
                gradient: 'from-[#b89a4f] to-[#a68a3d]',
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="group relative"
                  style={{
                    animation: `fadeIn 0.6s ease-out ${idx * 0.2}s both`,
                  }}
                >
                  {/* Card Principal */}
                  <div className="relative bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl sm:rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl hover:shadow-[#c9a961]/20 hover:border-[#c9a961]/40 transition-all duration-500 group-hover:scale-105 flex flex-col h-full">
                    {/* Efeito de Glow no Card */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl md:rounded-3xl transition-opacity duration-500`} />
                    
                    {/* Número do Passo */}
                    <div className="absolute -top-3 sm:-top-4 left-4 sm:left-6 md:left-8">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-[#0a0a0a]`}>
                        <span className="text-sm sm:text-base md:text-lg font-black text-[#0a0a0a]">{item.step}</span>
                      </div>
                    </div>

                    {/* Ícone */}
                    <div className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-4">
                      <div className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br ${item.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <Icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[#0a0a0a]" />
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="relative z-10 text-center flex-grow flex flex-col">
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 group-hover:text-[#c9a961] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[#888] leading-relaxed text-xs sm:text-sm flex-grow">
                        {item.description}
                      </p>
                    </div>

                    {/* Linha Conectora (exceto no último) */}
                    {idx < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#c9a961]/50 to-transparent z-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Final do Processo */}
          <div className="text-center mt-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-[#c9a961]/40 hover:scale-105 transition-all duration-300"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vantagens Section Premium */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#0f0f0f] to-transparent overflow-visible">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-6">
              <Award className="w-4 h-4 text-[#c9a961]" />
              <span className="text-sm font-semibold text-[#c9a961]">Vantagens Exclusivas</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-6">
              Por Que Escolher <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Scrapers Art</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Coleta Automatizada',
                text: 'Sistema totalmente automatizado que coleta dados de múltiplos sites de leilão sem intervenção manual.',
              },
              {
                icon: Brain,
                title: 'Análise Inteligente',
                text: 'Métricas avançadas e insights automáticos para identificar tendências e oportunidades de mercado.',
              },
              {
                icon: Database,
                title: 'Histórico Completo',
                text: 'Armazenamento persistente de todas as obras coletadas com histórico completo de sessões e atualizações.',
              },
              {
                icon: Filter,
                title: 'Filtros Avançados',
                text: 'Sistema de filtros poderoso para buscar obras por artista, categoria, valor, leiloeiro e muito mais.',
              },
              {
                icon: Download,
                title: 'Exportação de Dados',
                text: 'Exporte todos os dados coletados para Excel com um clique, facilitando análises externas.',
              },
              {
                icon: SparklesIcon,
                title: 'Interface Premium',
                text: 'Dashboard elegante e intuitivo com design profissional e experiência de usuário excepcional.',
              },
            ].map((vantagem, idx) => {
              const Icon = vantagem.icon
              const gradients = [
                { from: 'from-[#c9a961]', to: 'to-[#b89a4f]' },
                { from: 'from-[#d4b87a]', to: 'to-[#c9a961]' },
                { from: 'from-[#b89a4f]', to: 'to-[#a68a3d]' },
                { from: 'from-[#c9a961]', to: 'to-[#d4b87a]' },
                { from: 'from-[#d4b87a]', to: 'to-[#b89a4f]' },
                { from: 'from-[#b89a4f]', to: 'to-[#a68a3d]' },
              ]
              const gradient = gradients[idx % gradients.length]
              return (
                <div 
                  key={idx}
                  className="group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-6 sm:p-8 hover:border-[#c9a961]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#c9a961]/20 hover:-translate-y-1"
                  style={{
                    animation: `fadeIn 0.6s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {/* Efeito de Glow nos Cantos */}
                  <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                  <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />
                  <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150`} />

                  {/* Background Gradient Sutil no Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  {/* Linha Dourada no Topo (aparece no hover) */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Conteúdo */}
                  <div className="relative z-10 flex items-start gap-4 sm:gap-6">
                    {/* Ícone com Efeitos Premium */}
                    <div className="relative flex-shrink-0">
                      {/* Anel externo animado */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl opacity-20 group-hover:opacity-40 blur-md group-hover:scale-125 transition-all duration-500`} />
                      
                      {/* Ícone principal */}
                      <div className={`relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-2 ring-transparent group-hover:ring-[#c9a961]/30`}>
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#0f0f0f] group-hover:scale-110 transition-transform duration-300" />
                        
                        {/* Partículas de brilho */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                          <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                        </div>
                      </div>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-[#c9a961] mb-3 group-hover:text-[#d4b87a] transition-colors duration-300 flex items-center gap-2">
                        {vantagem.title}
                        {/* Seta que aparece no hover */}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </h3>
                      <p className="text-sm sm:text-base text-[#ccc] leading-relaxed group-hover:text-white transition-colors duration-300">
                        {vantagem.text}
                      </p>
                    </div>
                  </div>

                  {/* Efeito de brilho que passa no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Planos Section Premium */}
      <section id="planos" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Elementos Flutuantes - Esfera e Moeda */}
        <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
          {/* Esfera Dourada - Canto Superior Esquerdo */}
          <div 
            className="absolute top-10 left-10 w-32 h-32 animate-float"
            style={{
              animation: 'float 6s ease-in-out infinite',
              animationDelay: '0s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="sphereGradient" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#f4e4bc" stopOpacity="1" />
                  <stop offset="50%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
                </radialGradient>
                <filter id="sphereShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="2" dy="4" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="url(#sphereGradient)"
                filter="url(#sphereShadow)"
              />
              {/* Highlight */}
              <ellipse
                cx="70"
                cy="70"
                rx="35"
                ry="35"
                fill="rgba(255, 255, 255, 0.4)"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Moeda Dourada - Canto Inferior Direito */}
          <div 
            className="absolute bottom-10 right-10 w-40 h-40 animate-float"
            style={{
              animation: 'float 7s ease-in-out infinite',
              animationDelay: '1.5s',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f4e4bc" stopOpacity="1" />
                  <stop offset="30%" stopColor="#d4b87a" stopOpacity="1" />
                  <stop offset="70%" stopColor="#c9a961" stopOpacity="1" />
                  <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
                </linearGradient>
                <filter id="coinShadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="2" dy="3" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Moeda (elipse para perspectiva 3D) */}
              <ellipse
                cx="100"
                cy="100"
                rx="85"
                ry="60"
                fill="url(#coinGradient)"
                filter="url(#coinShadow)"
                transform="rotate(-15 100 100)"
              />
              {/* Borda da moeda */}
              <ellipse
                cx="100"
                cy="100"
                rx="85"
                ry="60"
                fill="none"
                stroke="rgba(184, 154, 79, 0.6)"
                strokeWidth="2"
                transform="rotate(-15 100 100)"
              />
              {/* Símbolo $ */}
              <text
                x="100"
                y="115"
                fontSize="80"
                fontWeight="bold"
                fill="rgba(184, 154, 79, 0.9)"
                textAnchor="middle"
                transform="rotate(-15 100 100)"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                $
              </text>
              {/* Highlight */}
              <ellipse
                cx="75"
                cy="75"
                rx="30"
                ry="20"
                fill="rgba(255, 255, 255, 0.3)"
                opacity="0.7"
                transform="rotate(-15 100 100)"
              />
            </svg>
          </div>
        </div>

        {/* Elemento Arredondado de Fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg 
            className="absolute inset-0 w-full h-full" 
            preserveAspectRatio="none" 
            viewBox="0 0 1440 800"
            style={{ zIndex: 0 }}
          >
            <defs>
              <linearGradient id="planosGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(201, 169, 97, 0.15)" stopOpacity="1" />
                <stop offset="50%" stopColor="rgba(212, 184, 122, 0.12)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgba(184, 154, 79, 0.08)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M 0,200 Q 360,50 720,100 T 1440,150 L 1440,800 L 0,800 Z"
              fill="url(#planosGradient)"
              opacity="0.6"
            />
            <path
              d="M 0,250 Q 360,100 720,150 T 1440,200 L 1440,800 L 0,800 Z"
              fill="url(#planosGradient)"
              opacity="0.4"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-6">
              <Crown className="w-4 h-4 text-[#c9a961]" />
              <span className="text-sm font-semibold text-[#c9a961]">Planos Premium</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-6">
              Escolha Seu <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Plano</span>
            </h2>
            <p className="text-xl text-[#888] max-w-2xl mx-auto">
              Acesso completo ao sistema de inteligência de mercado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plano Básico */}
            <div 
              className="group relative overflow-visible bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
              onClick={() => setShowPriceSimulator(true)}
              title="Clique para simular preços"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#c9a961]/5 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-[#c9a961]">R$ 99</span>
                    <span className="text-[#888]">/mês</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {['Acesso ao Dashboard', 'Até 1.000 obras/mês', 'Suporte por email', 'Exportação Excel'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#888]">
                      <CheckCircle2 className="w-5 h-5 text-[#c9a961] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 border-2 border-[#c9a961]/50 text-[#c9a961] font-bold rounded-xl hover:bg-[#c9a961]/10 hover:border-[#c9a961] transition-all duration-300 mt-auto">
                  Começar Agora
                </button>
              </div>
            </div>

            {/* Plano Premium - Destaque */}
            <div className="group relative overflow-visible bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#1a1a1a] border-2 border-[#c9a961] rounded-3xl p-8 shadow-2xl shadow-[#c9a961]/20 hover:scale-105 transition-all duration-500 flex flex-col h-full">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#c9a961]/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] text-xs font-bold rounded-full">
                MAIS POPULAR
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#c9a961] mb-2">Premium</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-[#c9a961]">R$ 299</span>
                    <span className="text-[#888]">/mês</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {['Acesso Completo', 'Obras Ilimitadas', 'Suporte Prioritário', 'Exportação Avançada', 'API Access', 'Análises Personalizadas'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white">
                      <CheckCircle2 className="w-5 h-5 text-[#c9a961] flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="block w-full py-4 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 transition-all duration-300 text-center mt-auto"
                >
                  Começar Agora
                </Link>
              </div>
            </div>

            {/* Plano Enterprise */}
            <div 
              className="group relative overflow-visible bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:border-[#c9a961]/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
              onClick={() => setShowPriceSimulator(true)}
              title="Clique para simular preços"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#c9a961]/5 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-[#c9a961]">Custom</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {['Tudo do Premium', 'Dedicated Server', 'Suporte 24/7', 'Custom Integrations', 'White Label', 'SLA Garantido'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#888]">
                      <CheckCircle2 className="w-5 h-5 text-[#c9a961] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 border-2 border-[#c9a961]/50 text-[#c9a961] font-bold rounded-xl hover:bg-[#c9a961]/10 hover:border-[#c9a961] transition-all duration-300 mt-auto">
                  Contatar Vendas
                </button>
              </div>
            </div>
          </div>

          {/* FAQ sobre Planos e Pagamentos */}
          <div id="faq" className="mt-24 max-w-4xl mx-auto">
            {/* Header do FAQ */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-6">
                <Crown className="w-4 h-4 text-[#c9a961]" />
                <span className="text-sm font-semibold text-[#c9a961]">Dúvidas Frequentes</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
                Dúvidas sobre <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Planos?</span>
              </h2>
              <p className="text-xl text-[#888] max-w-2xl mx-auto">
                Tire todas as suas dúvidas sobre nossos planos, formas de pagamento e assinaturas
              </p>
            </div>

            {/* FAQ Accordion */}
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* Contact Form Section Premium - Acima do Footer */}
      <section id="contato" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Background com Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201, 169, 97, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 169, 97, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Card Único com Formulário e Depoimento */}
          <div className="bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-3xl p-8 lg:p-10 shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Lado Esquerdo - Formulário de Contato */}
              <div className="flex flex-col">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-8">
                  Se tiver alguma <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">dúvida</span>, não hesite em nos contatar
                </h2>
                
                <form className="space-y-6 flex-grow">
                  {/* Campo Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        className="w-full pl-12 pr-4 py-4 text-sm border-b-2 border-[#2a2a2a] bg-transparent text-white placeholder-[#666] focus:border-[#c9a961] focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Campo Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full pl-12 pr-4 py-4 text-sm border-b-2 border-[#2a2a2a] bg-transparent text-white placeholder-[#666] focus:border-[#c9a961] focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Campo Mensagem */}
                  <div>
                    <label className="block text-sm font-semibold text-[#c9a961] mb-3 uppercase tracking-wider">
                      Mensagem
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-[#666]" />
                      <textarea
                        placeholder="Digite sua mensagem aqui..."
                        rows={6}
                        className="w-full pl-12 pr-4 py-4 text-sm border-b-2 border-[#2a2a2a] bg-transparent text-white placeholder-[#666] focus:border-[#c9a961] focus:outline-none transition-all duration-300 resize-none"
                      />
                    </div>
                  </div>

                  {/* Checkbox Privacidade */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="privacy"
                      className="mt-1 w-5 h-5 rounded border-[#2a2a2a] bg-[#0f0f0f] text-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/50 focus:ring-offset-0 focus:ring-offset-[#0f0f0f] cursor-pointer"
                    />
                    <label htmlFor="privacy" className="text-sm text-[#888] leading-relaxed">
                      Ao enviar este formulário, confirmo que li e aceito a{' '}
                      <a href="#" className="text-[#c9a961] hover:text-[#d4b87a] underline transition-colors">
                        política de privacidade
                      </a>
                    </label>
                  </div>

                  {/* Botão Enviar */}
                  <button
                    type="submit"
                    className="w-full px-8 py-5 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-[#c9a961]/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group mt-6"
                  >
                    <span>Enviar Mensagem</span>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              </div>

              {/* Lado Direito - Depoimento com Carrossel */}
              <div className="flex flex-col justify-center border-l border-[#2a2a2a] pl-12 lg:pl-16">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={`transition-all duration-500 ${
                      index === currentTestimonial
                        ? 'opacity-100 block'
                        : 'opacity-0 hidden'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-6 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-[#0a0a0a]">{testimonial.flag}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#c9a961]">{testimonial.country}</span>
                    </div>

                    {/* Perfil com Imagem */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg ring-2 ring-[#c9a961]/30">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback para ícone se a imagem não carregar
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#c9a961] to-[#b89a4f] flex items-center justify-center"><svg class="w-8 h-8 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`
                            }
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{testimonial.name}</h3>
                        <p className="text-sm text-[#888]">{testimonial.role}</p>
                      </div>
                    </div>

                    {/* Depoimento */}
                    <div className="relative mb-8">
                      <div className="absolute -top-4 -left-4 text-6xl text-[#c9a961]/20 font-serif leading-none">"</div>
                      <p className="text-lg text-[#ccc] leading-relaxed relative z-10 italic">
                        {testimonial.quote}
                      </p>
                      <div className="absolute -bottom-4 -right-4 text-6xl text-[#c9a961]/20 font-serif leading-none rotate-180">"</div>
                    </div>
                  </div>
                ))}

                {/* Indicadores de Carrossel - Clicáveis */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#2a2a2a]">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentTestimonial
                          ? 'w-2.5 h-2.5 bg-[#c9a961]'
                          : 'w-2 h-2 bg-[#2a2a2a] hover:bg-[#c9a961]/50 cursor-pointer'
                      }`}
                      aria-label={`Ver depoimento ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Premium - Super Top */}
      <footer className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] overflow-visible">
        {/* Background com Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201, 169, 97, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 169, 97, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Seção Principal do Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Coluna 1 - Links Úteis */}
            <div>
              <h3 className="text-lg font-bold text-[#c9a961] mb-6">Links Úteis</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Sobre Nós', href: '#' },
                  { label: 'Como Funciona', href: '#' },
                  { label: 'Recursos', href: '#' },
                  { label: 'Planos', href: '#' },
                  { label: 'Termos de Uso', href: '#' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.href}
                      className="text-[#888] hover:text-[#c9a961] transition-colors duration-300 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 2 - Soluções */}
            <div>
              <h3 className="text-lg font-bold text-[#c9a961] mb-6">Soluções</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Dashboard Premium', href: '/dashboard' },
                  { label: 'Análise de Mercado', href: '#' },
                  { label: 'Exportação de Dados', href: '#' },
                  { label: 'API Access', href: '#' },
                  { label: 'Suporte Técnico', href: '#' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.href}
                      className="text-[#888] hover:text-[#c9a961] transition-colors duration-300 text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 3 - Precisa de Ajuda? */}
            <div>
              <h3 className="text-lg font-bold text-[#c9a961] mb-6">Precisa de Ajuda?</h3>
              <ul className="space-y-4 mb-6">
                <li>
                  <a
                    href="tel:+5511999999999"
                    className="text-[#888] hover:text-[#c9a961] transition-colors duration-300 text-sm flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-[#c9a961]/10 rounded-lg flex items-center justify-center group-hover:bg-[#c9a961]/20 transition-colors">
                      <Phone className="w-4 h-4 text-[#c9a961]" />
                    </div>
                    <span>+(55) 11 99999-9999</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contato@scrapersart.com"
                    className="text-[#888] hover:text-[#c9a961] transition-colors duration-300 text-sm flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-[#c9a961]/10 rounded-lg flex items-center justify-center group-hover:bg-[#c9a961]/20 transition-colors">
                      <Mail className="w-4 h-4 text-[#c9a961]" />
                    </div>
                    <span>contato@scrapersart.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://scrapersart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#888] hover:text-[#c9a961] transition-colors duration-300 text-sm flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-[#c9a961]/10 rounded-lg flex items-center justify-center group-hover:bg-[#c9a961]/20 transition-colors">
                      <Globe className="w-4 h-4 text-[#c9a961]" />
                    </div>
                    <span>www.scrapersart.com</span>
                  </a>
                </li>
              </ul>
              
              {/* Redes Sociais */}
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Facebook, href: '#', label: 'Facebook' },
                  { icon: Linkedin, href: '#', label: 'LinkedIn' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: MessageSquare, href: '#', label: 'Telegram' },
                ].map((social, idx) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={idx}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-[#888] hover:text-[#c9a961] hover:border-[#c9a961]/50 hover:bg-[#c9a961]/10 transition-all duration-300 group"
                    >
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Coluna 4 - Junte-se à Comunidade */}
            <div>
              <h3 className="text-lg font-bold text-[#c9a961] mb-6">Junte-se à Comunidade</h3>
              <p className="text-[#888] text-sm mb-6 leading-relaxed">
                Participe da nossa comunidade premium e tenha acesso a conteúdos exclusivos, atualizações e suporte prioritário.
              </p>
              <button className="w-full px-6 py-4 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>ENTRAR</span>
              </button>
            </div>
          </div>

          {/* Linha Divisória */}
          <div className="border-t border-[#2a2a2a] my-8" />

          {/* Copyright e Logo */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-[#0a0a0a]" />
              </div>
              <div>
                <p className="text-lg font-bold bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">
                  Scrapers Art
                </p>
                <p className="text-xs text-[#888]">Intelligence Platform</p>
              </div>
            </Link>
            <p className="text-sm text-[#666] text-center md:text-right">
              Copyright © 2024 Scrapers Art. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Progress Bar de Leitura */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#0a0a0a] z-[100]">
        <div 
          className="h-full bg-gradient-to-r from-[#c9a961] to-[#d4b87a] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>


      {/* Botão de Suporte - Canto Esquerdo */}
      <button
        onClick={() => scrollToSection('contato')}
        className="fixed bottom-8 left-8 z-50 w-14 h-14 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] rounded-full flex items-center justify-center shadow-2xl shadow-[#c9a961]/30 hover:shadow-[#c9a961]/50 transition-all duration-300 hover:scale-110 group animate-fade-in"
        aria-label="Suporte"
        title="Falar com Suporte"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <HelpCircle className="w-6 h-6 text-[#0a0a0a] relative z-10 group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />
      </button>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-[#0a0a0a] border-2 border-[#c9a961] hover:bg-[#151515] hover:border-[#d4b87a] rounded-full flex items-center justify-center shadow-2xl shadow-[#c9a961]/20 hover:shadow-[#c9a961]/40 transition-all duration-300 hover:scale-110 group animate-fade-in"
          aria-label="Voltar ao topo"
        >
          {/* Efeito de brilho no hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a961]/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <ChevronUp className="w-5 h-5 text-white relative z-10 group-hover:text-[#c9a961] group-hover:scale-110 transition-all duration-300" />
          {/* Anel externo animado */}
          <div className="absolute inset-0 border-2 border-[#c9a961]/30 rounded-full animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: '2s' }} />
        </button>
      )}


      {/* Quiz Interativo */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border-2 border-[#c9a961] rounded-3xl p-8 max-w-lg w-full relative animate-slide-up">
            <button
              onClick={() => setShowQuiz(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#c9a961] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {quizStep < quizQuestions.length ? (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Qual plano é ideal para você?</h3>
                <p className="text-[#888] mb-6">Pergunta {quizStep + 1} de {quizQuestions.length}</p>
                <p className="text-lg text-white mb-6">{quizQuestions[quizStep].question}</p>
                <div className="space-y-3">
                  {quizQuestions[quizStep].options.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuizAnswers({ ...quizAnswers, [quizStep]: option })
                        setQuizStep(quizStep + 1)
                      }}
                      className="w-full p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-[#c9a961] hover:bg-[#1f1f1f] transition-all duration-300 text-left text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#0a0a0a]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Plano Recomendado</h3>
                <p className="text-4xl font-black text-[#c9a961] mb-6">{calculateRecommendedPlan()}</p>
                <Link
                  to="/login"
                  onClick={() => setShowQuiz(false)}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold rounded-xl hover:scale-105 transition-all duration-300"
                >
                  Ver Planos
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculadora de ROI */}
      {showROICalculator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border-2 border-[#c9a961] rounded-3xl p-8 max-w-md w-full relative animate-slide-up">
            <button
              onClick={() => setShowROICalculator(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#c9a961] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <Calculator className="w-12 h-12 text-[#c9a961] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Calculadora de ROI</h3>
              <p className="text-[#888]">Calcule seu retorno sobre investimento</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Investimento Mensal (R$)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#c9a961] focus:outline-none"
                  placeholder="299"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Obras Monitoradas/Mês</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#c9a961] focus:outline-none"
                  placeholder="1000"
                />
              </div>
              <div className="bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-xl p-4">
                <p className="text-sm text-[#888] mb-1">ROI Estimado</p>
                <p className="text-3xl font-black text-[#c9a961]">+450%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulador de Preços */}
      {showPriceSimulator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border-2 border-[#c9a961] rounded-3xl p-8 max-w-md w-full relative animate-slide-up">
            <button
              onClick={() => setShowPriceSimulator(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#c9a961] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <DollarSignIcon className="w-12 h-12 text-[#c9a961] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Simulador de Preços</h3>
              <p className="text-[#888]">Encontre o plano ideal para você</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Obras por mês</label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  className="w-full"
                />
              </div>
              <div className="bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-xl p-4">
                <p className="text-sm text-[#888] mb-1">Plano Recomendado</p>
                <p className="text-2xl font-black text-[#c9a961] mb-2">Premium</p>
                <p className="text-lg text-white">R$ 299/mês</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
