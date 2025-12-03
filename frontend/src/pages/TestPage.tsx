// Página de teste simples para verificar se React está funcionando
export default function TestPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px', color: '#2563EB', marginBottom: '20px' }}>
        ✅ React está Funcionando!
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        Se você está vendo isso, o React está renderizando corretamente.
      </p>
      <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p style={{ color: '#333' }}>
          <strong>Próximo passo:</strong> Verifique se o backend está rodando em http://localhost:8000
        </p>
      </div>
    </div>
  )
}

