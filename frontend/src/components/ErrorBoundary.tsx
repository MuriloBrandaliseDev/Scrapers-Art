import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center p-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Um erro inesperado ocorreu'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

