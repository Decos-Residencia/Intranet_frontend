# Intranet Corporativa · Hospital Decós

Implementação funcional das **31 telas** do design do Figma (arquivo *Intranet*), em
**HTML5 + Tailwind CSS + JavaScript** puro, integrada à API **FastAPI** (JWT). É uma SPA leve
(roteamento por hash) com **tema claro/escuro**. O que ainda não tem backend continua local.

```
Navegador → Frontend (este repositório) → HTTP → FastAPI → SQLAlchemy → Supabase PostgreSQL
```

O frontend **nunca** acessa o banco, não usa Supabase SDK/Auth e não guarda credenciais.

## Como rodar (desenvolvimento)

1. **Backend** (repositório `Intranet_backend`), em `http://localhost:8000`:
   `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
2. **Frontend** servido por HTTP em `http://localhost:5500` (a origem precisa estar em
   `CORS_ORIGINS` do backend). Exemplos: extensão *Live Server* do VS Code, ou
   `python3 -m http.server 5500` dentro desta pasta.

Não abra por `file://`: o navegador bloqueia chamadas à API a partir dessa origem.
Entre com um usuário **real** do backend. Não há mais login de demonstração.

### Configuração da API

`src/app/config.js` define `apiBaseUrl`: em `localhost`/`127.0.0.1` usa
`http://localhost:8000`; em outros hosts usa `PRODUCTION_API_URL` (preencha com a URL
pública do backend antes do deploy). Também é possível definir
`window.__DECOS_CONFIG__ = { apiBaseUrl: "..." }` antes de carregar `config.js`.
`apiBaseUrl` **não é segredo**; nunca coloque senhas, tokens ou chaves nesse arquivo.

## Deploy na Vercel (produção)

Site estático, sem build. Na Vercel: **Framework Preset = Other**, **Build Command** vazio e
**Output Directory** vazio (raiz do repositório). O `vercel.json` já aplica cabeçalhos de
segurança (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).

Antes de publicar:

1. Preencha `PRODUCTION_API_URL` em `src/app/config.js` com a URL pública do backend no
   Render (ex.: `https://intranet-decos-api.onrender.com`). Se ficar vazio, o login mostra
   "API não configurada para este ambiente".
2. Se a URL do backend **não** terminar em `.onrender.com`, ajuste `connect-src` no CSP do
   `vercel.json` (hoje permite `https://*.onrender.com`; o ideal é a URL exata).
3. No backend (Render), coloque o domínio da Vercel em `CORS_ORIGINS`, sem barra final.

Comportamento em produção: o timeout de API sobe para 60 s e o login "acorda" o backend
gratuito do Render ao abrir. Nada de segredo fica no frontend; `apiBaseUrl` é público.
O Tailwind ainda vem do CDN (`cdn.tailwindcss.com`), que a própria Tailwind não recomenda
para produção; trocar exigiria uma etapa de build.

## Sessão e papéis de acesso

- Login: `POST /auth/login` → JWT → `GET /auth/me`. O JWT fica **somente** em
  `localStorage` (`decos_intranet_token`). Senhas nunca são guardadas.
- Ao recarregar, a sessão só vale depois de `GET /auth/me` responder 200. Um `401` limpa a
  sessão e volta ao login; erro de rede mantém o token e oferece "Tentar novamente".
- O papel da interface vem **exclusivamente** de `user.perfil` (não existe mais troca manual):

| Perfil (API) | Papel na UI | Pode |
|---|---|---|
| `COLABORADOR` | Colaborador | Somente leitura: avisos, documentos, FAQ, diretório, setores. |
| `ADMIN` | Administrador | Leitura + criar/editar/excluir avisos, documentos, setores e FAQ (criar), cadastrar/editar/desativar usuários. |

Isso é só UX: a autorização real é do backend (um colaborador que force uma chamada
administrativa recebe `403`).

### O que vem da API × o que continua local

| Da API | Local (BACKEND FUTURO) |
|---|---|
| usuário logado, avisos, documentos, FAQ, usuários/diretório, setores, aniversariantes | eventos e inscrições, notificações (lidas), chamados, pedidos de alteração cadastral, parabéns, cenário de aniversário, auditoria, estatísticas |

Limites conhecidos do backend: avisos não guardam rascunho/agendamento/imagem; documentos
guardam só título, categoria e **URL https** (sem upload, sem permissão "somente
visualização"); FAQ só tem `GET`/`POST`; "excluir" usuário **desativa**; não há troca de
senha pelo próprio usuário.

## Recursos interativos

- **Navegação** completa entre todas as telas (menu, cards, breadcrumbs, "ver detalhe").
- **Tema claro/escuro** — botão de lua/sol na barra superior (persistido em `localStorage`).
- **Painéis laterais (slide-over)**: Notificações (abre pelo sino) e Busca global (avisos/documentos/ramais).
- **Menu hambúrguer** no mobile (drawer deslizante com backdrop).
- **Filtros funcionais** no Mural (por categoria) e na Central de Documentos (por tipo); FAQ e Notificações também filtram.
- **Dados reais**: avisos, documentos, FAQ, diretório e setores vêm da API; criar/editar/excluir (ADMIN) grava no banco e **gera log de auditoria local**.
- **Estados vazios reais**: sem dados na API a tela mostra "nenhum item encontrado" (nunca dados fictícios).
- **Mais vermelho**: acento vinho na sidebar, selo de papel, contador do sino e selo "Relevante".
- Acordeão do FAQ, prévia em tempo real ao criar notícia, seleção de permissão/prioridade, e **toasts** de confirmação.

## Telas implementadas (18 únicas → 31 do Figma)

**Usuário / Colaborador**
Login · Dashboard · Mural de Avisos · Detalhe do Aviso · Aniversariantes · Eventos ·
Detalhe do Evento · Central de Documentos & POPs · Visualização de Documento · FAQ ·
Diretório & Ramais · Meu Perfil · Notificações
*(cada uma disponível em tema claro e escuro = 26 telas)*

**Admin** (telas administrativas)
Gerenciar Notícias · Criar Notícia · Gerenciar Documentos · Adicionar Documento ·
Usuários & Setores · Auditoria (local)

## Estrutura

Organização **por responsabilidade e por tela**, inspirada no
[Feature-Sliced Design](https://feature-sliced.design/): cada camada só usa as
camadas **abaixo** dela, e cada tela vive no seu próprio arquivo.

```
index.html                  # entrada: Tailwind (CDN), fonte, CSS e scripts em ordem
assets/img/                 # imagens estáticas do site
src/
  app/                      # ── camada de aplicação (liga tudo)
    namespaces.js           #   cria App, UI, Lib, Pages, PagesAdmin, AdminUI
    config.js               #   URL da API (apiBaseUrl)
    store.js                #   sessão, papéis (de /auth/me), dados da API, estado local
    routes.js               #   tabela de rotas → função da tela
    router.js               #   roteador por hash + casca (sidebar/topbar)
    actions.js              #   delegação global de cliques (data-action)
    main.js                 #   boot
  services/                 # ── única camada que fala com a API
    api.js                  #   fetch, JWT, timeout, erros (401/403/404/409/422/5xx)
    auth/avisos/documentos/usuarios/setores/faq/avaliacoes .service.js
  data/
    config.js               # configuração de interface (atalhos, categorias, papéis); nenhum dado de negócio
  pages/                    # ── uma pasta por tela
    login/  dashboard/  avisos/  aniversariantes/  eventos/
    documentos/  faq/  diretorio/  perfil/  notificacoes/
    admin/                  #   telas de RH/Admin
      _comum.js             #   peças usadas só pelas telas admin
      noticias/  documentos/  usuarios/  auditoria/
  features/                 # ── ações do usuário reaproveitadas em várias telas
    aparencia.js            #   temas Claro/Escuro/Vinho
    busca.js  trocar-papel.js (cenário do dia)  notificacoes-painel.js
    formularios-painel.js   #   chamados e pedido (locais); usuário, setor, FAQ (API)
    downloads.js            #   abrir/baixar documento (URL real), agenda .ics
  shared/                   # ── reutilizável, não conhece nenhuma tela
    ui/                     #   ícones, badges, toast, modal, painel, confete...
    layout/                 #   logo, menu, sidebar, topbar, bola flutuante
    lib/                    #   listas com filtro/paginação, carrosséis, arquivos
  styles/
    base/                   #   variáveis, temas, tipografia, acessibilidade
    layout/                 #   estrutura, sidebar, topbar, bola flutuante
    components/             #   card, botões, badges, formulários, modal...
    pages/                  #   estilos específicos de cada tela
```

**Regras da casa**

- Ordem de carga (em `index.html`): `app/namespaces` → `config` → `data` → `app/store` →
  `services` → `shared` → `features` → `pages` → `app` (rotas, roteador, ações, boot).
- **Nenhuma tela chama `fetch()`**: use `Services.*` (que usam `src/services/api.js`).
- Todo texto vindo da API vai para o HTML com `UI.esc()` (evita XSS).
- **Criar uma tela nova:** crie `src/pages/<tela>/<tela>.js` registrando
  `Pages.minhaTela = ...`, adicione o `<script>` no bloco *pages* do
  `index.html` e a linha em `src/app/routes.js`.
- Uma peça usada por **uma** tela fica no arquivo dela; usada por **várias**
  telas vai para `shared/`.
- Sem etapa de build e sem módulos ES: basta servir os arquivos estáticos por HTTP.

## Rotas (hash)

`#/login` · `#/dashboard` · `#/avisos` · `#/avisos/:id` · `#/aniversariantes` ·
`#/eventos` · `#/eventos/:id` · `#/documentos` · `#/documentos/:id` · `#/faq` ·
`#/diretorio` · `#/perfil` · `#/notificacoes` · `#/admin/noticias` ·
`#/admin/noticias/nova` · `#/admin/documentos` · `#/admin/documentos/novo` ·
`#/admin/usuarios` · `#/admin/auditoria` (rotas `#/admin/*` exigem ADMIN)

> Eventos, notificações demonstrativas, estatísticas e auditoria ainda são dados locais de
> demonstração (sem backend).
