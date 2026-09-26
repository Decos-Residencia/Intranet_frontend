# Intranet Corporativa · Hospital Decós

Implementação funcional das **31 telas** do design do Figma (arquivo *Intranet*), em
**HTML5 + Tailwind CSS + JavaScript** com dados mock locais. É uma SPA leve (roteamento
por hash), com **tema claro/escuro** e **troca de perfil** Usuário ↔ Editor-Gestor.

## Como rodar

Basta abrir o `index.html` no navegador (duplo clique). Os dados são embutidos em JS,
então funciona direto via `file://` — precisa apenas de internet (Tailwind e a fonte
Inter vêm por CDN).

Recomendado servir por HTTP local para melhor comportamento:

```bash
cd residencia/intranet-decos-organizado
python3 -m http.server 8000
# abra http://localhost:8000
```

Na tela de login, clique em **Acessar** (e-mail/senha já preenchidos) para entrar.

## Papéis de acesso (4 níveis)

Troque pelo selo **PERFIL** na sidebar ou pelo ícone na barra superior. Cada papel muda o
menu, as permissões e a auditoria:

| Papel | Pode |
|---|---|
| 👁 **Leitura** | Só consulta. Sem interações nem downloads. |
| 👤 **Colaborador (Normal)** | Consulta + interage (parabenizar, inscrever, marcar lida) + baixa documentos permitidos + edita perfil. |
| 🧑‍💼 **RH (Editor-Gestor)** | Tudo do Normal + **cria/edita/exclui notícias e documentos** + vê **auditoria das próprias ações**. |
| 🛡 **Admin** | Tudo do RH + **gestão de usuários & setores** + **auditoria global**. |

Rotas administrativas são protegidas por permissão — um papel sem acesso é redirecionado.

## Recursos interativos

- **Navegação** completa entre todas as telas (menu, cards, breadcrumbs, "ver detalhe").
- **Tema claro/escuro** — botão de lua/sol na barra superior (persistido em `localStorage`).
- **Painéis laterais (slide-over)**: Notificações (abre pelo sino) e Busca global (avisos/documentos/ramais).
- **Menu hambúrguer** no mobile (drawer deslizante com backdrop).
- **Filtros funcionais** no Mural (por categoria) e na Central de Documentos (por tipo); FAQ e Notificações também filtram.
- **Persistência mock**: notícias/documentos criados no painel **aparecem nas listas** e **geram log de auditoria** (em `localStorage`).
- **Documentos "somente visualização"** com download bloqueado (cadeado), respeitando também o papel do usuário.
- **Mais vermelho**: acento vinho na sidebar, selo de papel, contador do sino e selo "Relevante".
- Acordeão do FAQ, prévia em tempo real ao criar notícia, seleção de permissão/prioridade, e **toasts** de confirmação.

## Telas implementadas (18 únicas → 31 do Figma)

**Usuário / Colaborador**
Login · Dashboard · Mural de Avisos · Detalhe do Aviso · Aniversariantes · Eventos ·
Detalhe do Evento · Central de Documentos & POPs · Visualização de Documento · FAQ ·
Diretório & Ramais · Meu Perfil · Notificações
*(cada uma disponível em tema claro e escuro = 26 telas)*

**Editor-Gestor / Admin** (5 telas)
Gerenciar Notícias · Criar Notícia · Gerenciar Documentos · Adicionar Documento ·
Visualizar Documento Restrito

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
    store.js                #   estado persistido, papéis/permissões, auditoria
    routes.js               #   tabela de rotas → função da tela
    router.js               #   roteador por hash + casca (sidebar/topbar)
    actions.js              #   delegação global de cliques (data-action)
    main.js                 #   boot
  data/
    mock.js                 # base de dados fictícia (window.DB)
  pages/                    # ── uma pasta por tela
    login/  dashboard/  avisos/  aniversariantes/  eventos/
    documentos/  faq/  diretorio/  perfil/  notificacoes/
    admin/                  #   telas de RH/Admin
      _comum.js             #   peças usadas só pelas telas admin
      noticias/  documentos/  usuarios/  auditoria/
  features/                 # ── ações do usuário reaproveitadas em várias telas
    aparencia.js            #   temas Claro/Escuro/Vinho
    busca.js  trocar-papel.js  notificacoes-painel.js
    formularios-painel.js   #   chamados, pedido cadastral, usuário
    downloads.js            #   baixar documento, adicionar à agenda
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

- Ordem de carga (em `index.html`): `app/namespaces` → `data` → `app/store` →
  `shared` → `features` → `pages` → `app` (rotas, roteador, ações, boot).
- **Criar uma tela nova:** crie `src/pages/<tela>/<tela>.js` registrando
  `Pages.minhaTela = ...`, adicione o `<script>` no bloco *pages* do
  `index.html` e a linha em `src/app/routes.js`.
- Uma peça usada por **uma** tela fica no arquivo dela; usada por **várias**
  telas vai para `shared/`.
- Sem etapa de build e sem módulos ES: continua abrindo direto pelo
  `index.html` (duplo clique), como antes.

## Rotas (hash)

`#/login` · `#/dashboard` · `#/avisos` · `#/avisos/:id` · `#/aniversariantes` ·
`#/eventos` · `#/eventos/:id` · `#/documentos` · `#/documentos/:id` · `#/faq` ·
`#/diretorio` · `#/perfil` · `#/notificacoes` · `#/admin/noticias` ·
`#/admin/noticias/nova` · `#/admin/documentos` · `#/admin/documentos/novo` ·
`#/admin/documentos/:id/restrito` · `#/admin/usuarios` (Admin) · `#/admin/auditoria` (RH/Admin)

> Dados fictícios apenas para demonstração. Sem backend.
