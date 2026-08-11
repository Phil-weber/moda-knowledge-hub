# Moda Knowledge Hub

Crie um sistema web chamado "PLM Knowledge Hub" usando React (frontend) 

e Node.js (backend). Este é um hub interno de gestão de conhecimento para 

uma empresa de moda. O sistema deve ser construído como uma aplicação 

independente, mas com arquitetura que permita integração futura via API 

com outros sistemas PLM.

---

STACK TÉCNICA

Frontend:

- React com TypeScript

- React Router v6 para navegação

- Tailwind CSS para estilização

- Shadcn/ui como biblioteca de componentes base

- React Query (TanStack Query) para gerenciamento de estado servidor

- Axios para chamadas HTTP

Backend:

- Node.js com Express

- Supabase como banco de dados (PostgreSQL) e storage de arquivos

- JWT para autenticação

- Multer para upload de arquivos

- CORS configurado para o frontend

Estrutura de pastas:

/client → React app

/server → Node.js API

/shared → tipos TypeScript compartilhados

---

IDENTIDADE VISUAL (OBRIGATÓRIO — não alterar)

Paleta: estritamente preto (#111111), branco (#FFFFFF) e tons de cinza

(#FAFAFA, #F5F5F5, #E0E0E0, #AAAAAA, #666666)

Cores de tipo de arquivo (APENAS para ícones e badges — não usar em layout):

- PDF: fundo #FFF0F0, ícone #E57373, badge texto #C62828

- Vídeo: fundo #F0F4FF, ícone #6B9CF7, badge texto #1A4BB5

- PPT: fundo #FFF8F0, ícone #F4A460, badge texto #B35A00

- DOC: fundo #F0F6FF, ícone #5BA0D0, badge texto #0D47A1

Tipografia: sans-serif, pesos 400 e 500 apenas. Nunca 600 ou 700.

Ícones: Lucide React (outline apenas)

Border radius padrão: 8px componentes, 10–12px cards

Bordas: 0.5px solid — layout, 1px solid — hover/active states

Sombras: nenhuma (zero box-shadow em toda a aplicação)

Gradientes: nenhum em superfícies de layout

Viewport mínimo: 1280px (desktop only)

Idioma: português pt-BR em toda a UI e código

---

BANCO DE DADOS (Supabase)

Tabelas:

users

- id (uuid, PK)

- login (varchar, unique) — formato: "nome.sobrenome" ou "supplier.nome"

- password_hash (varchar)

- role (enum: 'internal', 'supplier')

- full_name (varchar)

- created_at (timestamp)

modules

- id (uuid, PK)

- name (varchar)

- slug (varchar, unique)

- icon (varchar) — nome do ícone Lucide

- order_index (integer)

- created_at (timestamp)

files

- id (uuid, PK)

- module_id (uuid, FK → modules)

- title (varchar)

- type (enum: 'pdf', 'video', 'ppt', 'doc')

- size_bytes (bigint)

- storage_path (varchar) — path no Supabase Storage

- uploaded_by (uuid, FK → users)

- created_at (timestamp)

onboarding_trails

- id (uuid, PK)

- module_id (uuid, FK → modules, unique)

- created_by (uuid, FK → users)

- updated_at (timestamp)

onboarding_steps

- id (uuid, PK)

- trail_id (uuid, FK → onboarding_trails)

- file_id (uuid, FK → files)

- order_index (integer)

onboarding_progress

- id (uuid, PK)

- user_id (uuid, FK → users)

- step_id (uuid, FK → onboarding_steps)

- completed_at (timestamp)

---

AUTENTICAÇÃO

- Login via username + password (JWT, expira em 8h)

- Dois tipos de usuário:

  · internal → acesso completo a todos os módulos

  · supplier → acesso apenas aos módulos liberados (fase futura)

- Rota protegida: redireciona para /login se não autenticado

- Persistência: JWT no localStorage

- Contexto global de autenticação via React Context

---

TELAS E COMPONENTES

=== 1. TELA DE LOGIN (/login) ===

Layout: full viewport, fundo com padrão SVG de pétalas/tecido em tons

creme (#F0ECE6), sem foto real.

Card centralizado (width 320px, background #FFFFFF, border-radius 10px,

border 0.5px solid rgba(0,0,0,0.08), padding 36px 32px):

  Logo section (centralizado, margin-bottom 20px):

    - Texto "GRUPO DE MODA" — 9px, uppercase, letter-spacing 0.18em, #888

    - Wordmark: "+" (22px, weight 300) + "soma" (26px, font-serif, weight 300,

      letter-spacing 0.12em)

    - Subtexto "PLM KNOWLEDGE HUB" — 8px, uppercase, letter-spacing 0.22em, #AAA

  Título: "Bem-vindo ao PLM Hub" — 16px/500, centralizado

  Subtítulo: "Insira suas credenciais para acessar" — 12px, #AAA, centralizado

  Campo Login: height 42px, border 0.5px #D8D8D8, border-radius 7px,

    placeholder "Login", font-siz

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a6b2ece-e22c-41ba-a1d0-62fab73d6d99).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
