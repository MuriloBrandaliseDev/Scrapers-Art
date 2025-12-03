import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import PremiumLayout from './components/PremiumLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Obras from './pages/Obras'
import Iarremate from './pages/Iarremate'
import LeiloesBR from './pages/LeiloesBR'
import Sessoes from './pages/Sessoes'
import Configuracoes from './pages/Configuracoes'
import TestPage from './pages/TestPage'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - Sem Layout */}
          <Route path="/" element={<Landing />} />
          
          {/* Login/Registro - Sem Layout */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard - Com Layout padrão */}
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          
          {/* Outras páginas - Com Layout padrão */}
          <Route path="/obras" element={
            <Layout>
              <Obras />
            </Layout>
          } />
          <Route path="/iarremate" element={
            <Layout>
              <Iarremate />
            </Layout>
          } />
          <Route path="/leiloes-br" element={
            <Layout>
              <LeiloesBR />
            </Layout>
          } />
          <Route path="/sessoes" element={
            <Layout>
              <Sessoes />
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <Configuracoes />
            </Layout>
          } />
          
          {/* Test Page - Com Layout padrão */}
          <Route path="/test" element={
            <Layout>
              <TestPage />
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
