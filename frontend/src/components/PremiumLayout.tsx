import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Image, Clock, FileText, LogOut, Menu, X, TrendingUp, Sparkles } from 'lucide-react'
import clsx from 'clsx'

interface PremiumLayoutProps {
  children: ReactNode
}

export default function PremiumLayout({ children }: PremiumLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/iarremate', label: 'iArremate', icon: Image },
    { path: '/leiloes-br', label: 'LeilõesBR', icon: Image },
    { path: '/obras', label: 'Todas Obras', icon: FileText },
    { path: '/sessoes', label: 'Sessões', icon: Clock },
  ]

  const handleLogout = () => {
    // Implementar lógica de logout aqui
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-dark overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gold-texture opacity-30 pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-dark-50 border-r border-gold/20 z-40 hidden lg:block">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gold/20">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-glow">
                <TrendingUp className="w-6 h-6 text-dark" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gold">Scrapers Art</h1>
                <p className="text-xs text-gold-light/60">Premium Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-gold text-dark shadow-lg'
                      : 'text-gold-light hover:bg-gold/10 hover:text-gold'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-dark' : 'text-gold/70 group-hover:text-gold')} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gold/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-gold-light hover:bg-gold/10 hover:text-gold transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-50 border-b border-gold/20 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-dark" />
            </div>
            <span className="text-gold font-bold">Scrapers Art</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gold hover:bg-gold/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gold/20 bg-dark-50 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200',
                    isActive
                      ? 'bg-gradient-gold text-dark'
                      : 'text-gold-light hover:bg-gold/10 hover:text-gold'
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-gold-light hover:bg-gold/10 hover:text-gold transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={clsx(
        'relative z-10 min-h-screen',
        'lg:ml-64',
        'pt-16 lg:pt-0'
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

