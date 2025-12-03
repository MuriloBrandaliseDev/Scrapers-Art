import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard as DashboardIcon, Image, Clock, FileText, Menu, X, User, Settings, LogOut } from 'lucide-react'
import clsx from 'clsx'
import Notifications from './Notifications'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [userName, setUserName] = useState<string>('Usuário')

  // Carregar nome do usuário do localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('user_name')
    if (storedName) {
      setUserName(storedName)
    }
  }, [])

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/iarremate', label: 'iArremate', icon: Image },
    { path: '/leiloes-br', label: 'LeilõesBR', icon: Image },
    { path: '/obras', label: 'Todas Obras', icon: FileText },
    { path: '/sessoes', label: 'Sessões', icon: Clock },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
  ]

  const handleLogout = () => {
    // Limpar dados do usuário
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_plan')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] pointer-events-none" />
      
      {/* Sidebar Colapsável */}
      <aside 
        className={clsx(
          'fixed left-0 top-0 h-full bg-[#151515] border-r border-[#2a2a2a] z-40 flex flex-col transition-all duration-300 ease-in-out overflow-hidden box-border',
          sidebarHovered ? 'w-64' : 'w-20'
        )}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <DashboardIcon className="w-5 h-5 text-[#0f0f0f]" />
            </div>
            <div className={clsx(
              'overflow-hidden transition-all duration-300',
              sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <h1 className="text-lg font-bold text-[#c9a961] whitespace-nowrap">ArtMoney</h1>
              <p className="text-xs text-[#888] whitespace-nowrap">Sistema</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={clsx(
          'flex-1 p-4 space-y-2',
          sidebarHovered ? 'overflow-y-auto' : 'overflow-hidden overflow-y-hidden hide-scrollbar'
        )}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-[#c9a961]/20 to-[#c9a961]/10 border border-[#c9a961]/30 text-[#c9a961] shadow-lg shadow-[#c9a961]/10'
                    : 'text-[#888] hover:bg-[#1f1f1f] hover:text-[#c9a961]'
                )}
                title={item.label}
              >
                <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-[#c9a961]' : 'text-[#666] group-hover:text-[#c9a961]')} />
                <span className={clsx(
                  'overflow-hidden transition-all duration-300 whitespace-nowrap',
                  sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                )}>
                  {item.label}
                </span>
                {/* Tooltip quando colapsado */}
                {!sidebarHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#c9a961] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Botão Sair */}
        <div className="p-4 border-t border-[#2a2a2a] flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm text-[#888] hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-400 transition-all duration-200 group relative"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-400 transition-colors" />
            <span className={clsx(
              'overflow-hidden transition-all duration-300 whitespace-nowrap',
              sidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              Sair
            </span>
            {/* Tooltip quando colapsado */}
            {!sidebarHovered && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-red-400 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg">
                Sair
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Navbar Superior */}
      <header 
        className={clsx(
          'fixed top-0 h-16 bg-[#151515] border-b border-[#2a2a2a] z-30 flex items-center justify-between transition-all duration-300 ease-in-out box-border',
          sidebarHovered ? 'left-64' : 'left-20'
        )}
        style={{
          right: 0,
          boxSizing: 'border-box',
        }}
      >
        <div className="flex items-center gap-4 px-4 lg:px-6 flex-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#c9a961] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-[#c9a961]">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 lg:px-6">
          {/* Notificações */}
          <Notifications />

          {/* Perfil */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#c9a961] transition-colors group relative">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4 h-4 text-[#0f0f0f]" />
            </div>
            <span className="hidden lg:block text-sm font-medium group-hover:text-[#c9a961] transition-colors">
              {userName}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-sm">
          <div className="fixed left-0 top-0 h-full w-64 bg-[#151515] border-r border-[#2a2a2a] p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#b89a4f] rounded-lg flex items-center justify-center">
                  <DashboardIcon className="w-5 h-5 text-[#0f0f0f]" />
                </div>
                <span className="text-[#c9a961] font-bold">ArtMoney</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#d4af37] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-[#c9a961]/20 to-[#c9a961]/10 border border-[#c9a961]/30 text-[#c9a961]'
                      : 'text-[#888] hover:bg-[#1f1f1f] hover:text-[#c9a961]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#888] hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-400 transition-all duration-200 mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
             </div>
           </div>
         )}

      {/* Main Content */}
      <main 
        className={clsx(
          'relative z-10 min-h-screen transition-all duration-300 ease-in-out pt-16',
          sidebarHovered ? 'pl-64' : 'pl-20' // Ajusta dinamicamente: 64 = 16rem = 256px (expandida), 20 = 5rem = 80px (colapsada)
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
