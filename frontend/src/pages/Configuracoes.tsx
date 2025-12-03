import { useState } from 'react'
import { 
  Settings, CreditCard, User, Bell, Shield, 
  Crown, Calendar, ArrowRight, AlertCircle
} from 'lucide-react'

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<'assinatura' | 'perfil' | 'seguranca' | 'notificacoes'>('assinatura')

  // Dados mockados - substituir por dados reais da API
  const planoAtual = {
    nome: 'Premium',
    preco: 299,
    periodo: 'mês',
    dataRenovacao: '15/02/2025',
    status: 'ativo',
  }

  const tabs = [
    { id: 'assinatura' as const, label: 'Assinatura', icon: Crown },
    { id: 'perfil' as const, label: 'Perfil', icon: User },
    { id: 'seguranca' as const, label: 'Segurança', icon: Shield },
    { id: 'notificacoes' as const, label: 'Notificações', icon: Bell },
  ]

  return (
    <div className="space-y-8 animate-fade-in w-full pb-8">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#151515] via-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/50 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a961]/5 via-transparent to-[#b89a4f]/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-[#c9a961]/20">
              <Settings className="w-8 h-8 text-[#0f0f0f]" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#c9a961] via-[#d4b87a] to-[#c9a961] bg-clip-text text-transparent mb-2">
                Configurações
              </h1>
              <p className="text-[#888] text-sm">Gerencie sua conta, assinatura e preferências</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-2 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-[#c9a961] to-[#b89a4f] text-[#0a0a0a] shadow-lg'
                    : 'text-[#888] hover:text-[#c9a961] hover:bg-[#1f1f1f]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="bg-gradient-to-br from-[#151515] to-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 shadow-xl">
        {activeTab === 'assinatura' && (
          <div className="space-y-8">
            {/* Plano Atual */}
            <div>
              <h2 className="text-2xl font-bold text-[#c9a961] mb-6 flex items-center gap-3">
                <Crown className="w-6 h-6" />
                Plano Atual
              </h2>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">{planoAtual.nome}</h3>
                    <p className="text-[#888] text-sm">Plano ativo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#c9a961]">R$ {planoAtual.preco}</p>
                    <p className="text-sm text-[#888]">/{planoAtual.periodo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#888] mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>Próxima renovação: {planoAtual.dataRenovacao}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">Status: Ativo</span>
                </div>
              </div>
            </div>

            {/* Gerenciar Assinatura */}
            <div>
              <h2 className="text-2xl font-bold text-[#c9a961] mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                Gerenciar Assinatura
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-6 bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl hover:border-[#c9a961]/50 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-[#0a0a0a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#c9a961] transition-colors">Alterar Plano</h3>
                      <p className="text-sm text-[#888]">Upgrade ou downgrade</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
                </button>

                <button className="flex items-center justify-between p-6 bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl hover:border-[#c9a961]/50 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#0a0a0a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#c9a961] transition-colors">Método de Pagamento</h3>
                      <p className="text-sm text-[#888]">Atualizar cartão</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
                </button>

                <button className="flex items-center justify-between p-6 bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl hover:border-red-500/50 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">Cancelar Assinatura</h3>
                      <p className="text-sm text-[#888]">Cancelar plano atual</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button className="flex items-center justify-between p-6 bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-xl hover:border-[#c9a961]/50 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#0a0a0a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#c9a961] transition-colors">Histórico de Pagamentos</h3>
                      <p className="text-sm text-[#888]">Ver faturas</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-[#c9a961] group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#c9a961] mb-6 flex items-center gap-3">
              <User className="w-6 h-6" />
              Informações do Perfil
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2">Nome Completo</label>
                <input
                  type="text"
                  defaultValue="Usuário"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="usuario@email.com"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 transition-all duration-300">
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#c9a961] mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6" />
              Segurança
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2">Senha Atual</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2">Nova Senha</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-[#c9a961] to-[#b89a4f] hover:from-[#d4b87a] hover:to-[#c9a961] text-[#0a0a0a] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a961]/30 transition-all duration-300">
                Alterar Senha
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#c9a961] mb-6 flex items-center gap-3">
              <Bell className="w-6 h-6" />
              Preferências de Notificação
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Novas obras coletadas', description: 'Receber notificações quando novas obras forem adicionadas' },
                { label: 'Sessões concluídas', description: 'Notificar quando uma sessão de scraping for finalizada' },
                { label: 'Erros no sistema', description: 'Alertas sobre problemas ou erros no sistema' },
                { label: 'Atualizações de planos', description: 'Informações sobre novos recursos e planos' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl">
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-[#888]">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#c9a961]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a961]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

