# 🚀 Deploy no Netlify - Instruções Rápidas

## 1️⃣ Preparar o GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "Initial commit"

# Criar repositório no GitHub e depois:
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

## 2️⃣ Configurar no Netlify

1. Acesse: https://app.netlify.com
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha **"Deploy with GitHub"**
4. Autorize e selecione seu repositório
5. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Clique em **"Deploy site"**

## 3️⃣ Pronto! 🎉

O site estará disponível em: `https://seu-site.netlify.app`

## ⚠️ Importante

- O Netlify só hospeda o **frontend**
- O **backend** precisa estar em outro servidor (Heroku, Railway, Render, etc.)
- Se a API estiver em outro servidor, adicione variável de ambiente `VITE_API_URL` no Netlify

## 📝 Arquivos Criados

- ✅ `frontend/netlify.toml` - Configuração do Netlify
- ✅ `frontend/public/_redirects` - Redirecionamento para SPA

