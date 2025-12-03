import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { Bell, X, Image as ImageIcon, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

interface Notification {
  id: string
  type: 'new_works' | 'session_completed' | 'session_error' | 'system_update'
  title: string
  message: string
  timestamp: Date
  read: boolean
  link?: string
}

const STORAGE_KEY = 'scrapers_art_last_state'
const NOTIFICATIONS_KEY = 'scrapers_art_notifications'

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Buscar stats e sessões para detectar mudanças
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 15000, // Verificar a cada 15 segundos
    retry: 1,
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions', { limit: 5 }],
    queryFn: () => apiService.getSessions({ per_page: 5 }),
    refetchInterval: 15000,
    retry: 1,
  })

  // Carregar notificações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
        setNotifications(parsed)
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
      } catch (e) {
        console.error('Erro ao carregar notificações:', e)
      }
    }
  }, [])

  // Detectar novas obras
  useEffect(() => {
    if (!stats) return

    const lastState = localStorage.getItem(STORAGE_KEY)
    
    // Se não há estado anterior, apenas salvar o estado atual (primeira carga)
    if (!lastState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        total_obras: stats.total_obras || 0,
        total_sessoes: stats.total_sessoes || 0,
        last_session_id: 0,
        timestamp: new Date().toISOString(),
      }))
      return
    }

    try {
      const last = JSON.parse(lastState)
      const currentTotal = stats.total_obras || 0
      const lastTotal = last.total_obras || 0

      // Só notificar se houver aumento real e não for a primeira carga
      if (currentTotal > lastTotal && last.timestamp) {
        const newCount = currentTotal - lastTotal
        const newNotification: Notification = {
          id: `new_works_${Date.now()}`,
          type: 'new_works',
          title: 'Novas Obras Coletadas',
          message: `${newCount} nova${newCount > 1 ? 's' : ''} obra${newCount > 1 ? 's' : ''} ${newCount > 1 ? 'foram' : 'foi'} coletada${newCount > 1 ? 's' : ''}`,
          timestamp: new Date(),
          read: false,
          link: '/obras',
        }

        addNotification(newNotification)
      }
    } catch (e) {
      console.error('Erro ao processar estado:', e)
    }

    // Salvar estado atual
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      total_obras: stats.total_obras || 0,
      total_sessoes: stats.total_sessoes || 0,
      last_session_id: JSON.parse(lastState || '{}').last_session_id || 0,
      timestamp: new Date().toISOString(),
    }))
  }, [stats])

  // Detectar sessões concluídas
  useEffect(() => {
    if (!sessions || sessions.length === 0) return

    const lastState = localStorage.getItem(STORAGE_KEY)
    if (!lastState) return

    try {
      const last = JSON.parse(lastState)
      const lastSessionId = last.last_session_id || 0

      // Verificar se há novas sessões concluídas
      const newSessions = sessions.filter(s => 
        s.id > lastSessionId && s.status === 'concluido'
      )

      newSessions.forEach(session => {
        const newNotification: Notification = {
          id: `session_${session.id}_${Date.now()}`,
          type: 'session_completed',
          title: 'Sessão Concluída',
          message: `Scraping ${session.scraper_name.toUpperCase()} concluído com ${session.total_obras} obras coletadas`,
          timestamp: new Date(session.fim || session.inicio),
          read: false,
          link: '/sessoes',
        }

        addNotification(newNotification)
      })

      // Verificar sessões com erro
      const errorSessions = sessions.filter(s => 
        s.id > lastSessionId && s.status === 'erro'
      )

      errorSessions.forEach(session => {
        const newNotification: Notification = {
          id: `session_error_${session.id}_${Date.now()}`,
          type: 'session_error',
          title: 'Erro na Sessão',
          message: `Sessão ${session.scraper_name.toUpperCase()} falhou: ${session.erro || 'Erro desconhecido'}`,
          timestamp: new Date(session.inicio),
          read: false,
          link: '/sessoes',
        }

        addNotification(newNotification)
      })

      // Atualizar último ID de sessão
      if (sessions.length > 0) {
        const maxId = Math.max(...sessions.map(s => s.id))
        const currentState = JSON.parse(lastState)
        currentState.last_session_id = maxId
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState))
      }
    } catch (e) {
      console.error('Erro ao processar sessões:', e)
    }
  }, [sessions])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Evitar duplicatas
      if (prev.some(n => n.id === notification.id)) {
        return prev
      }

      const updated = [notification, ...prev].slice(0, 50) // Limitar a 50 notificações
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
      setUnreadCount(updated.filter(n => !n.read).length)
      return updated
    })
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
      return updated
    })
    const deleted = notifications.find(n => n.id === id)
    if (deleted && !deleted.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_works':
        return <ImageIcon className="w-4 h-4" />
      case 'session_completed':
        return <CheckCircle className="w-4 h-4" />
      case 'session_error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_works':
        return 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
      case 'session_completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'session_error':
        return 'bg-red-500/10 text-red-400 border-red-500/30'
      default:
        return 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#d4af37] transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#d4af37] text-[#0f0f0f] text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#d4af37]">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#888] hover:text-[#d4af37] transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-[#666] mx-auto mb-3" />
                <p className="text-[#888] text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a2a]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      'p-4 hover:bg-[#1f1f1f] transition-colors group',
                      !notification.read && 'bg-[#1a1a1a]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[#fff] mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-[#888] mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#666]">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#2a2a2a] transition-opacity"
                          >
                            <X className="w-3 h-3 text-[#666]" />
                          </button>
                        </div>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            onClick={() => {
                              markAsRead(notification.id)
                              setIsOpen(false)
                            }}
                            className="mt-2 inline-block text-xs text-[#d4af37] hover:text-[#f4e4bc] transition-colors"
                          >
                            Ver detalhes →
                          </Link>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#d4af37] rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

