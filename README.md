# Churrasqueira Amores - Site Oficial

Este é o site oficial da Churrasqueira Amores, desenvolvido com React, Vite, TailwindCSS e Supabase.

## 🚀 Como subir na Vercel

Siga os passos abaixo para implantar o site na Vercel:

### 1. Preparação
Certifique-se de que todas as alterações foram salvas e enviadas para o seu repositório GitHub.

### 2. Importar Projeto no Dashboard da Vercel
1. Vá para o [Dashboard da Vercel](https://vercel.com/dashboard).
2. Clique em **"Add New..."** e selecione **"Project"**.
3. Importe o repositório deste projeto.

### 3. Configurar Variáveis de Ambiente
No passo de configuração do projeto na Vercel, abra a seção **"Environment Variables"** e adicione:

*   `VITE_SUPABASE_URL`: `https://obqcfybxtjyzvofvltfj.supabase.co`
*   `VITE_SUPABASE_ANON_KEY`: `sb_publishable_ppcTFNvhTvAvT6qx205VEA_1kLh0Sf7`

### 4. Build e Deployment
*   **Framework Preset:** Vite
*   **Root Directory:** `./`
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`

Clique em **"Deploy"** e aguarde a finalização!

## 🛠️ Tecnologias Utilizadas
- **React 19**
- **Vite 7**
- **TailwindCSS 4**
- **Framer Motion** (Animações)
- **Supabase** (Banco de Dados e Auth)

## 📁 Estrutura do Projeto
- `src/App.tsx`: Componente principal e lógica da landing page.
- `src/Admin.tsx`: Painel administrativo completo.
- `src/supabase.ts`: Configuração do cliente Supabase.
- `vercel.json`: Configurações de redirecionamento para SPAs na Vercel.
