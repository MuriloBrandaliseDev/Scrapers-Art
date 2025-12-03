import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, 
  Sparkles, Zap, Shield, Crown, ArrowLeft, CreditCard
} from 'lucide-react'

const PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    preco: 99,
    periodo: 'mês',
    descricao: 'Ideal para iniciantes',
    features: [
      'Até 1.000 obras/mês',
      'Dashboard básico',
      'Suporte por email',
      'Atualizações semanais',
    ],
    popular: false,
    icon: Zap,
    gradient: 'from-[#c9a961] to-[#b89a4f]',
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 299,
    periodo: 'mês',
    descricao: 'Mais popular',
    features: [
      'Até 10.000 obras/mês',
      'Dashboard avançado',
      'Suporte prioritário',
      'Atualizações em tempo real',
      'Exportação de dados',
      'Análises avançadas',
    ],
    popular: true,
    icon: Crown,
    gradient: 'from-[#d4b87a] to-[#c9a961]',
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 499,
    periodo: 'mês',
    descricao: 'Para grandes empresas',
    features: [
      'Obras ilimitadas',
      'Dashboard personalizado',
      'Suporte 24/7',
      'API dedicada',
      'Relatórios customizados',
      'Integração personalizada',
    ],
    popular: false,
    icon: Shield,
    gradient: 'from-[#b89a4f] to-[#a68a3d]',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null)
  const [step, setStep] = useState<'auth' | 'plano'>('auth')
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      // Login - salvar nome do usuário e redirecionar
      // Por enquanto, usar o email como nome ou um nome padrão
      const nomeUsuario = formData.email.split('@')[0] || 'Usuário'
      localStorage.setItem('user_name', nomeUsuario)
      localStorage.setItem('user_email', formData.email)
      navigate('/dashboard')
    } else {
      // Registro - salvar nome e ir para seleção de plano
      localStorage.setItem('user_name', formData.nome || 'Usuário')
      localStorage.setItem('user_email', formData.email)
      setStep('plano')
    }
  }

  const handlePlanoSelect = (planoId: string) => {
    setSelectedPlano(planoId)
  }

  const handleFinalizarRegistro = () => {
    if (selectedPlano) {
      // Aqui você faria a chamada à API para criar a conta
      // Salvar plano selecionado
      localStorage.setItem('user_plan', selectedPlano)
      // Por enquanto, apenas redireciona
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
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
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#c9a961]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#b89a4f]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Elementos Flutuantes */}
      <div className="absolute inset-0 pointer-events-none overflow-visible hidden md:block" style={{ zIndex: 5 }}>
        <div 
          className="absolute top-20 left-20 w-32 h-32"
          style={{ animation: 'float 8s ease-in-out infinite' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <radialGradient id="loginSphere1" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#f4e4bc" stopOpacity="1" />
                <stop offset="100%" stopColor="#b89a4f" stopOpacity="1" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#loginSphere1)" opacity="0.4" />
          </svg>
        </div>
        <div 
          className="absolute bottom-20 right-20 w-40 h-40"
          style={{ animation: 'float 10s ease-in-out infinite', animationDelay: '2s' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <radialGradient id="loginSphere2" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#d4b87a" stopOpacity="1" />
                <stop offset="100%" stopColor="#a68a3d" stopOpacity="1" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#loginSphere2)" opacity="0.3" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header com Logo */}
          <div className="text-center mb-8 sm:mb-12">
            <Link to="/" className="inline-flex items-center gap-3 group mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#c9a961] via-[#d4b87a] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg shadow-[#c9a961]/20 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-[#0a0a0a]" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">
                  ArtMoney
                </h1>
                <p className="text-xs text-[#888]">Intelligence Platform</p>
              </div>
            </Link>
          </div>

          {step === 'auth' ? (
            /* Formulário de Login/Registro */
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-2xl p-8 sm:p-10 shadow-2xl">
                {/* Tabs Login/Registro */}
                <div className="flex gap-2 mb-8 bg-[#0f0f0f] p-1 rounded-xl border border-[#2a2a2a]">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      isLogin
                        ? 'bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] shadow-lg'
                        : 'text-[#888] hover:text-[#c9a961]'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      !isLogin
                        ? 'bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] shadow-lg'
                        : 'text-[#888] hover:text-[#c9a961]'
                    }`}
                  >
                    Registrar
                  </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a961] mb-2">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                        <input
                          type="text"
                          required={!isLogin}
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-[#666] focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all duration-300"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#c9a961] mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-[#666] focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all duration-300"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c9a961] mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-[#666] focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all duration-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#c9a961] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-[#c9a961] mb-2">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!isLogin}
                          value={formData.confirmarSenha}
                          onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white placeholder-[#666] focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all duration-300"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-[#888] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0f0f0f] text-[#c9a961] focus:ring-[#c9a961]" />
                        <span>Lembrar-me</span>
                      </label>
                      <a href="#" className="text-[#c9a961] hover:text-[#d4b87a] transition-colors">
                        Esqueceu a senha?
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-[#c9a961]/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    {isLogin ? 'Entrar' : 'Continuar'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-[#888]">
                    {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[#c9a961] hover:text-[#d4b87a] font-semibold transition-colors"
                    >
                      {isLogin ? 'Registre-se' : 'Faça login'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Seleção de Plano */
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-[#c9a961]" />
                  <span className="text-sm font-semibold text-[#c9a961]">Escolha seu Plano</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                  Selecione o <span className="bg-gradient-to-r from-[#c9a961] to-[#d4b87a] bg-clip-text text-transparent">Plano Ideal</span>
                </h2>
                <p className="text-[#888] text-lg mb-6">Escolha o plano que melhor se adapta às suas necessidades</p>
                <button
                  onClick={() => setStep('auth')}
                  className="inline-flex items-center gap-2 text-[#888] hover:text-[#c9a961] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-stretch">
                {PLANOS.map((plano) => {
                  const Icon = plano.icon
                  const isSelected = selectedPlano === plano.id
                  return (
                    <div
                      key={plano.id}
                      onClick={() => handlePlanoSelect(plano.id)}
                      className={`group relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border-2 rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl flex flex-col h-full ${
                        isSelected
                          ? 'border-[#c9a961] shadow-2xl shadow-[#c9a961]/30 scale-105'
                          : 'border-[#2a2a2a] hover:border-[#c9a961]/50'
                      } ${plano.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                    >
                      {/* Badge Popular */}
                      {plano.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] text-xs font-bold px-4 py-1 rounded-bl-xl rounded-tr-2xl">
                          Mais Popular
                        </div>
                      )}

                      {/* Check de Seleção */}
                      {isSelected && (
                        <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          <CheckCircle2 className="w-5 h-5 text-[#0a0a0a]" />
                        </div>
                      )}

                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${plano.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                      {/* Conteúdo */}
                      <div className="relative z-10 flex flex-col flex-grow">
                        <div className={`w-16 h-16 bg-gradient-to-br ${plano.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-8 h-8 text-[#0a0a0a]" />
                        </div>

                        <h3 className="text-2xl font-black text-white mb-2">{plano.nome}</h3>
                        <p className="text-sm text-[#888] mb-6">{plano.descricao}</p>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-[#c9a961]">R$ {plano.preco}</span>
                            <span className="text-[#888]">/{plano.periodo}</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-grow">
                          {plano.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#c9a961] flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[#ccc]">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlanoSelect(plano.id)
                          }}
                          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 mt-auto ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] hover:shadow-lg hover:shadow-[#c9a961]/30'
                              : 'bg-[#0f0f0f] border-2 border-[#2a2a2a] text-[#c9a961] hover:border-[#c9a961]'
                          }`}
                        >
                          {isSelected ? 'Selecionado' : 'Selecionar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão Finalizar */}
              <div className="mt-12 text-center">
                <button
                  onClick={handleFinalizarRegistro}
                  disabled={!selectedPlano}
                  className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 mx-auto ${
                    selectedPlano
                      ? 'bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] hover:shadow-2xl hover:shadow-[#c9a961]/40 hover:scale-105'
                      : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Finalizar Registro
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

