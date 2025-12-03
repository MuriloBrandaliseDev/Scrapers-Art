# 🚀 Guia de Deploy no Netlify

## 📋 Pré-requisitos

1. Conta no GitHub
2. Conta no Netlify
3. Projeto já commitado no GitHub

## 🔧 Passo a Passo

### 1. Preparar o Repositório no GitHub

```bash
# Certifique-se de que está na raiz do projeto
cd C:\Users\muril\OneDrive\Documentos\Projetos MuriloDEV\DesafioWebscrapping

# Verificar status do git
git status

# Se ainda não inicializou o git:
git init
git add .
git commit -m "Initial commit - Scrapers Art Frontend"

# Criar repositório no GitHub e conectar:
# 1. Vá em https://github.com/new
# 2. Crie um novo repositório (ex: "scrapers-art")
# 3. NÃO inicialize com README
# 4. Copie a URL do repositório

# Conectar ao repositório remoto:
git remote add origin https://github.com/SEU_USUARIO/scrapers-art.git
git branch -M main
git push -u origin main
```

### 2. Configurar no Netlify

1. **Acesse o Netlify:**
   - Vá em https://app.netlify.com
   - Faça login ou crie uma conta

2. **Conectar ao GitHub:**
   - Clique em "Add new site" → "Import an existing project"
   - Escolha "Deploy with GitHub"
   - Autorize o Netlify a acessar seus repositórios
   - Selecione o repositório "scrapers-art"

3. **Configurar Build Settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
   - **Node version:** `18` (ou deixe em branco para usar a padrão)

4. **Variáveis de Ambiente (se necessário):**
   - Se sua API estiver em outro servidor, adicione:
     - `VITE_API_URL` = URL da sua API (ex: `https://sua-api.com`)
   - Por enquanto, deixe vazio se a API estiver em `/api/v1`

5. **Deploy:**
   - Clique em "Deploy site"
   - Aguarde o build completar (pode levar 2-5 minutos)

### 3. Configurar Proxy para API (Opcional)

Se sua API estiver em um servidor separado, você pode configurar um proxy no Netlify:

1. No painel do Netlify, vá em **Site settings** → **Build & deploy** → **Environment**
2. Adicione variável: `VITE_API_URL` = `https://sua-api.com`
3. Atualize `frontend/src/lib/api.ts` para usar a variável:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  // ...
})
```

### 4. Configurar Domínio Personalizado (Opcional)

1. No Netlify, vá em **Site settings** → **Domain management**
2. Clique em "Add custom domain"
3. Digite seu domínio
4. Siga as instruções para configurar DNS

## 📝 Notas Importantes

- ✅ O arquivo `netlify.toml` já está configurado
- ✅ O arquivo `_redirects` garante que o SPA funcione corretamente
- ⚠️ **Backend:** O Netlify só hospeda o frontend. Você precisará hospedar o backend separadamente (Heroku, Railway, Render, etc.)
- ⚠️ **API:** Se o backend estiver em outro servidor, configure a variável `VITE_API_URL`

## 🔄 Atualizações Futuras

Toda vez que você fizer push para o GitHub, o Netlify fará deploy automaticamente!

```bash
git add .
git commit -m "Sua mensagem"
git push
```

## 🐛 Troubleshooting

### Build falha?
- Verifique os logs no Netlify
- Certifique-se de que `npm run build` funciona localmente
- Verifique se todas as dependências estão no `package.json`

### Página em branco?
- Verifique o console do navegador
- Certifique-se de que o arquivo `_redirects` está em `frontend/public/`
- Verifique se a API está acessível

### Erro de CORS?
- Configure CORS no backend para aceitar o domínio do Netlify
- Ou use um proxy no Netlify

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs do build no Netlify
2. Console do navegador (F12)
3. Network tab para ver requisições da API

