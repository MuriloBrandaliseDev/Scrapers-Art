# 🚀 Guia de Instalação - Frontend React

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Instalação

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

## ⚙️ Configuração

### API Backend

Certifique-se de que a API FastAPI está rodando em `http://localhost:8000`

O Vite está configurado para fazer proxy das requisições `/api` para o backend.

### Variáveis de Ambiente (opcional)

Crie um arquivo `.env` na pasta `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## 📦 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/     # Componentes React
│   │   └── Layout.tsx  # Layout principal
│   ├── pages/          # Páginas
│   │   ├── Dashboard.tsx
│   │   ├── Obras.tsx
│   │   └── Sessoes.tsx
│   ├── lib/            # Utilitários
│   │   └── api.ts      # Cliente API
│   ├── App.tsx         # App principal
│   ├── main.tsx        # Entry point
│   └── index.css       # Estilos globais
├── public/             # Arquivos estáticos
├── index.html          # HTML base
└── package.json        # Dependências
```

## 🎨 Tecnologias

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Query** - Data Fetching
- **React Router** - Routing
- **Recharts** - Charts
- **Lucide React** - Icons

## 🐛 Troubleshooting

### Erro de conexão com API

Verifique se o backend está rodando na porta 8000.

### Erro de módulos não encontrados

Execute:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já em uso

Altere no arquivo `vite.config.ts`:
```ts
server: {
  port: 3001, // ou outra porta
}
```

