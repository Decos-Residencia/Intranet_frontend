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
`http://localhost:8000`; em outros hosts usa `/api`, encaminhado pela Vercel ao Render.
Também é possível definir
`window.__DECOS_CONFIG__ = { apiBaseUrl: "..." }` antes de carregar `config.js`.
`apiBaseUrl` **não é segredo**; nunca coloque senhas, tokens ou chaves nesse arquivo.

## Deploy na Vercel (produção)

Site estático, sem build. Na Vercel: **Framework Preset = Other**, **Build Command** vazio e
**Output Directory** vazio (raiz do repositório). O `vercel.json` já aplica cabeçalhos de
segurança (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).

Antes de publicar, confira a URL do backend na regra `/api/:path*` de `vercel.json`.
O navegador acessa a API pelo domínio do frontend, e a Vercel encaminha a chamada ao
Render. Se usar `window.__DECOS_CONFIG__.apiBaseUrl` para acessar o Render diretamente,
inclua o domínio do frontend em `CORS_ORIGINS` no backend e ajuste `connect-src` no CSP.

Comportamento em produção: o timeout de API sobe para 60 s e o login "acorda" o backend
gratuito do Render ao abrir. Nada de segredo fica no frontend; `apiBaseUrl` é público.
O Tailwind ainda vem do CDN (`cdn.tailwindcss.com`), que a própria Tailwind não recomenda
para produção; trocar exigiria uma etapa de build.

## Sessão e papéis de acesso

- Login: `POST /auth/login` → JWT → `GET /auth/me`. O JWT fica **somente** em
  `localStorage` (`decos_intranet_token`). Senhas nunca são guardadas.
- Ao recarregar, a sessão só vale depois de `GET /auth/me` responder 200. Um `401` limpa a
  sessão e volta ao login; erro de rede mantém o token e oferece "Tentar novamente".
- O perfil vem de `user.perfil` e **só muda pela tela Controle de acesso** (`#/admin/acessos`, ADMIN).
  Não existe troca nem simulação de perfil pelo topo ou pelo menu.
- O que cada pessoa pode fazer vem de `user.permissoes` (perfil + permissões concedidas ou
  retiradas individualmente pelo ADMIN). `App.can()` em `src/app/store.js` traduz os nomes curtos
  usados pelas telas (`manage_events`…) para as permissões do servidor (`gerenciar_eventos`…).

| Perfil (API) | Padrão |
|---|---|
| `LEITURA` | Consulta e baixa documentos; não interage. |
| `COLABORADOR` | Interage (chamados, inscrições, parabéns) e edita o próprio perfil. |
| `RH` | Colaborador + gerencia avisos, documentos, FAQ e eventos. |
| `ADMIN` | Tudo, inclusive usuários, acessos, chamados, avaliações e auditoria. |

Isso é só UX: a autorização real é do backend (quem forçar uma chamada sem a permissão
recebe `403`).

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
- **Aparência**: seletor de tema (Automático, Claro, Escuro, Vinho) com prévia, salvo na conta
  (`PUT /auth/me/preferencias`) e aplicado antes da primeira pintura pelo script do `<head>`.
  Visual "vidro fosco" (`styles/components/glass.css`) que vira sólido com "Reduzir transparência",
  alto contraste ou navegador sem `backdrop-filter`.
- **Acessibilidade** (`#/configuracoes`, todos os perfis): texto de 100% a 200%, botões maiores,
  alto contraste, reduzir movimento e transparência, sublinhar links, foco reforçado e fonte
  Atkinson Hyperlegible; "Pular para o conteúdo", `<main>`, painel lateral como diálogo
  (foco, Esc), títulos de aba por tela. Meta: zero violações axe WCAG 2.2 AA.
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
`#/diretorio` · `#/perfil` · `#/notificacoes` · `#/agenda` · `#/agenda/AAAA-MM-DD` ·
`#/documentos/:id/restrito` · `#/admin/chamados` · `#/painel` · `#/vagas` · `#/vagas/:id` ·
`#/admin/revisao` · `#/admin/treinamentos` · `#/admin/calendario` · `#/admin/vagas` · `#/admin/noticias` ·
`#/admin/noticias/nova` · `#/admin/documentos` · `#/admin/documentos/novo` ·
`#/admin/usuarios` · `#/admin/auditoria` · `#/configuracoes` (todos) · `#/revisoes`
(Minhas revisões: documentos sob minha responsabilidade e avaliações pedidas a mim) · `#/admin/acessos` (Controle de acesso e acessos rápidos
globais, ADMIN). Cada rota `#/admin/*` exige a permissão correspondente (ver `src/app/routes.js`).

### Modernização (feature 001, `specs/001-modernizacao-intranet/`)

- **Inicial por perfil**: colaborador vê avisos não lidos primeiro (selo "Lido"/"Não lido"),
  eventos e treinamentos com inscrição no próprio cartão e selo "Novo", acessos rápidos e
  aniversariantes do mês; gestor vê também até 4 números e "Precisa da sua atenção".
- **Documentos**: descrição obrigatória, versão vigente x antiga no upload, histórico com
  "Tornar vigente"; a central mostra só vigentes por padrão.
- **Diretório**: busca única (nome, cargo, setor, ramal), copiar ramal, visão por setor; o
  colaborador edita o próprio ramal no Perfil.
- **Carrossel de eventos na Inicial** com a foto de capa (ou fundo da marca), setas, pontos, teclado,
  pausa com mouse/foco e sem troca automática com movimento reduzido. O gestor envia a foto no
  formulário do evento. O CSP do `vercel.json` libera imagens de `https://*.supabase.co` e `blob:`.
- **Eventos**: filtro por tipo e mini calendário que mostra os eventos do dia ao passar o mouse,
  focar ou tocar. Gestão: exportar inscritos em CSV ou enviar por e-mail.
- **Avisos**: "Quem leu" na gestão; quem não tem `excluir_definitivo` (RH) arquiva em vez de excluir.
- **Acessos rápidos**: globais (ADMIN) e pessoais (cada usuário, até 12); externos abrem em nova aba.

### Intranet v2 (feature 002, `specs/002-intranet-v2/`)

- **Sem login para ler**: Inicial, avisos, eventos, documentos gerais e FAQ abrem para qualquer pessoa
  (rotas com `publica: true`). O sistema **sempre abre na Inicial**: a tela de login só aparece pelo botão
  "Entrar" (topo, menu ou Inicial) ou ao tentar uma interação (inscrever-se, abrir chamado, baixar). Endereço
  `#/login` aberto direto, link de área restrita (ex.: `#/diretorio`) e sessão expirada levam à Inicial como
  visitante; depois de entrar, a pessoa vai para a área que tentou abrir.
- **Menu**: alça com seta no meio da borda para recolher/expandir; link "Site do Hospital Decós"
  (`https://decosdh.com.br/paciente/`) no rodapé do menu e nos acessos rápidos. O botão flutuante ficou só com o ícone.
- **Tema instantâneo**: o botão de tema abre um menu pequeno junto dele (Automático, Claro, Escuro, Vinho);
  a troca vale no clique, sem painel lateral. Esc fecha e devolve o foco.
- **Inicial mais leve**: saudação ilustrada por período do dia e frase do dia, "Hoje você tem" (eventos de hoje
  em que a pessoa se inscreveu, com notificação "É hoje"), aniversariantes do dia com "Dar parabéns", carrossel
  de eventos com inscrição e cancelamento no próprio slide.
- **Minha agenda** (`#/agenda`, em Comunicação): tarefas do dia com horário, concluir, editar, reordenar e
  excluir; navegação entre dias e os eventos inscritos do dia ao lado.
- **Calendário de eventos**: passar o mouse (ou focar/tocar) num dia mostra cartões com foto, tipo, horário,
  local e resumo.
- **Documento restrito (prévia protegida)**: o conteúdo abre desfocado até "Mostrar conteúdo" e volta a se
  esconder ao sair da aba; marca d'água com nome, data e hora de quem vê; sem download, sem cópia e sem
  impressão (Ctrl+P bloqueado e a folha some na impressão). O detalhe comum de um documento restrito usa essa tela.
- **Chamados (gestor)**: lista com foto, nome, setor e ramal de quem abriu e "há quanto tempo"; o painel mostra
  cargo, e-mail (link com o protocolo no assunto), ramal e a linha do tempo (aberto, última atualização e por quem,
  concluído). Relato anônimo continua sem nenhum dado de quem enviou.
- **Configurações**: espaçamento entre linhas (normal/amplo), tela ao entrar (Início, Avisos, Eventos, Minha
  agenda, Documentos, Diretório) e menu recolhido — tudo salvo na conta e aplicado em qualquer aparelho.

### Intranet v3 (feature 003, `specs/003-intranet-v3/`)

- **Meu painel** (`#/painel`, no menu e como "Tela ao entrar"): avisos para ler, treinamentos obrigatórios
  pendentes (com "Inscrever-se" na próxima turma), agenda de hoje, chamados abertos e próximos eventos.
- **Revisão de publicações**: quem não aprova vê "Enviar para revisão" e "Rascunho" nos formulários de aviso e
  evento, com faixa "Aguardando aprovação" ou "Devolvido para ajustes" (motivo). Quem aprova tem
  **Administração → Revisão de publicações** (`#/admin/revisao`, com contador no menu): aprovar ou devolver com motivo.
- **Prazo de destaque**: "Exibir em destaque até" no formulário; vencido, o aviso sai da Inicial e do painel e
  fica no mural com o selo "Fora do destaque".
- **Lembretes na Minha agenda**: na hora, 10 ou 30 min antes (só com horário). O sino avisa; com
  "Ativar alertas do navegador" (permissão pedida só no clique), o sistema também mostra o alerta (`features/lembretes.js`).
- **Calendário institucional**: camada própria no calendário de Eventos (cor verde-petróleo, legenda e
  interruptor lembrado) — feriados nacionais automáticos, campanhas longas como faixa do mês e datas curtas
  marcando os dias. Gestão em `#/admin/calendario`.
- **Treinamentos obrigatórios** (`#/admin/treinamentos`): temas por setor/perfil; no formulário do evento a turma
  é ligada ao tema; na lista de inscritos, a partir do início, "Presente"/"Marcar todos presentes".
- **Vagas internas** (`#/vagas`, `#/vagas/:id`): filtros por setor e turno, "Tenho interesse" com mensagem e
  "Desistir". Gestão (RH) em `#/admin/vagas`, com interessados e exportação CSV.
- **Evidências para auditoria**: botão "Exportar evidências (PDF)" em `#/admin/auditoria` (período e setor);
  o arquivo é baixado na hora (`App.API.request(..., { blob: true })`).
- **Documento "somente visualização"** (escolha no upload/edição: "Download disponível" ou "Somente visualização"):
  faixa "Somente leitura", selo "LEITURA APENAS", legendas de segurança; sem baixar, abrir original, imprimir nem
  copiar (Ctrl+P/S/C bloqueados; impressão sai em branco). O **PDF real** é desenhado na tela com PDF.js 3.11.174
  (cdnjs, carregado sob demanda em `shared/lib/leitor-pdf.js`), com "Pág. X de N" e zoom — também nos documentos
  comuns e dentro da prévia protegida dos restritos. Outros formatos mostram o resumo. CSP: `script-src` inclui
  `https://cdnjs.cloudflare.com` e `worker-src 'self' blob:`.
- **Inicial**: cabeçalho enxuto com a foto da fachada (`assets/img/fachada-decos.jpg`); avisos com abas
  "Não lidos (N)" / "Todos" e comunicado que se abre ao passar o mouse (ou focar); carrossel só com a foto,
  com título, data, local, ações e controles numa faixa abaixo dela.

### Administração: indicadores, importação, desligamento e validade

- **Indicadores** (`#/admin/indicadores`, permissão `ver_indicadores`, padrão só Admin):
  - período de 30 dias, 90 dias, 12 meses ou datas livres;
  - cinco blocos de resumo: leitura de avisos, obrigatórios em dia, tempo de atendimento, chamados em aberto e revisão de documentos;
  - tabelas com barra e valor escrito ao lado (leitura por setor, avisos menos lidos, adesão por tema e por setor, chamados por categoria);
  - **Exportar CSV**;
  - barras em cor única validada no claro (`#B4233A`) e no escuro (`#E0566C`); a tabela é a própria visão acessível.
- **Importar usuários** (tela `#/admin/importacao`, também pelo botão em `#/admin/usuarios`, com os desligamentos agendados):
  - botão "Baixar modelo";
  - "Conferir planilha" mostra cada linha como Criar, Atualizar, Sem mudança ou Erro, com o motivo;
  - "Importar N pessoas" só aparece sem erro;
  - quem é criado recebe senha temporária por e-mail.
- **Data de desligamento** no formulário de usuário e selo "Desliga em dd/mm/aaaa" na lista; nesse dia o acesso é desativado sozinho.
- **Validade de documentos** (tela `#/admin/validades`, filtro de 30 dias a 12 meses): no formulário entram "Revisar até" e "Responsável pela revisão". A lista do admin ganha selo de prazo e a seção **Revisões a vencer** (vencidas e próximos 60 dias). O responsável recebe alerta faltando 30 e 7 dias e no vencimento.
- **Minhas revisões** (`#/revisoes`, no menu para quem é responsável por algum documento ou tem avaliação pendente):
  documentos com o prazo, "Enviar nova versão" (com a próxima revisão) e as avaliações pedidas à pessoa. Os alertas
  de validade e de avaliação apontam para cá. Saíram as telas "Minhas avaliações" e "Gerenciar avaliações".
- **Pedir avaliação** no formulário de edição do documento (quem tem `gerenciar_avaliacoes`): escolhe a pessoa e o que
  verificar; a seção lista as avaliações do documento com o status (e o motivo, se rejeitada).
- **Comunicados urgentes na Inicial**: um bloco que abre e fecha (`<details>`, teclado incluído) com todos os urgentes
  em destaque dentro, não lidos primeiro, cada um com resumo, foto (se tiver) e "Ler comunicado"; abre sozinho quando há
  urgente não lido.
- **Comunicados urgentes (animação)**: o bloco abre ao passar o mouse e fecha ao sair (com atraso curto); clique ou
  teclado fixam aberto/fechado; abre e fecha com altura animada e os comunicados entram em sequência (sem animação
  com "menos movimento"). Fechado, os links de dentro ficam fora do Tab (`inert`).
- **Aniversariante do Dia**: cada cartão mostra quantas pessoas já deram parabéns; o aniversariante vê o mural
  "Seus recados de hoje" (quem mandou, setor, hora e texto), que só ele lê e que some no dia seguinte.
- **Foto opcional no aviso**: campo no formulário (prévia, trocar e remover); aparece no detalhe, como miniatura no mural
  e no bloco de urgentes.
- **Meus chamados** agora é uma seção do **Meu painel** (lista completa com filtros e "Abrir chamado"); `#/chamados` abre o painel.
- Os rótulos dos formulários do painel lateral agora são ligados aos campos (`for`/`id`), para leitor de tela.
