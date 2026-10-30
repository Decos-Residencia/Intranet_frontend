# Tasks: Intranet v2

Caminhos relativos a `residencia qa/`. Testes de integração no backend para toda rota nova ou alterada.

## Phase 1: Ajustes rápidos (P1/P3)

- [X] T001 [US4] Seletor de tema em menu suspenso junto ao botão (sem painel lateral), troca no clique, teclado e Esc em `Intranet_frontend/src/features/aparencia.js` e `src/app/actions.js`
- [X] T002 [US10] Tirar o rótulo "Acesso Rápido" do botão flutuante, manter `aria-label` em `Intranet_frontend/src/shared/layout/quick-fab.js` e `src/styles/layout/quick-fab.css`
- [X] T003 [US3] Alça com seta no meio da borda do menu (recolher/expandir, teclado, estado salvo) em `Intranet_frontend/src/shared/layout/sidebar.js` e `src/styles/layout/sidebar.css`
- [X] T004 [US3] Link "Site do Hospital Decós" (https://decosdh.com.br/paciente/) no menu e nos acessos rápidos internos em `Intranet_frontend/src/shared/layout/menu.js` e `src/data/config.js`

## Phase 2: Acesso sem login (US1, P1)

- [X] T005 [US1] Testes `Intranet_backend/tests/integration/test_visitante.py`: leituras públicas 200 sem token e sem dados pessoais; rotas pessoais e escritas 401
- [X] T006 [US1] Leitor opcional (`Visitante`, `get_leitor`, `LeitorPublico`) em `Intranet_backend/app/core/dependencies.py` e visitante nas leituras de avisos, eventos, FAQ, documentos gerais e atalhos (serviços e rotas)
- [X] T007 [US1] Sessão de visitante no frontend (`store.js`, `router.js`, `routes.js` com `publica`), topbar/menu de visitante com "Entrar", convite ao login com retorno à tela de origem

## Phase 3: Inicial lúdica, lembretes e aniversariantes (US2, P1)

- [X] T008 [US2] Testes e implementação do lembrete do dia: `evento_inscricoes.lembrete_em`, notificação única por inscrição, rota `GET /eventos/hoje` (meus eventos de hoje)
- [X] T009 [US2] Inicial: saudação com ilustração e frase do dia, aniversariantes do dia com parabéns, "Hoje você tem", blocos em até duas colunas, versão de visitante

## Phase 4: Agenda (US5, P2)

- [X] T010 [US5] Testes `test_agenda_lembretes.py`, modelo, migração `0025_agenda_e_lembretes.py`, rotas `GET/POST/PUT/DELETE /agenda` e `PUT /agenda/ordem`
- [X] T011 [US5] Tela `#/agenda` em `Intranet_frontend/src/pages/agenda/agenda.js` (dia a dia, criar, editar, concluir, reordenar, excluir, eventos inscritos do dia) e item no menu Comunicação

## Phase 5: Calendário, restrito e chamados (US6, US7, US8, P2)

- [X] T012 [US6] Calendário de Eventos: foto, tipo, horário, local e resumo no hover/foco/toque
- [X] T013 [US7] Documento restrito com prévia protegida (desfoque, "Mostrar conteúdo", marca d'água nome+data, sem download/impressão) em `src/pages/documentos/restrito.js`
- [X] T014 [US8] Chamados: solicitante com setor, e-mail e ramal + data/hora de abertura e atualização (backend `ChamadoAdminRead` e tela)

## Phase 6: Configurações e demonstração (US9, US10, P3)

- [X] T015 [US9] Configurações: espaçamento de linhas, menu recolhido ao entrar, tela inicial preferida (preferências + efeito real)
- [X] T016 [US10] Demonstração local: eventos com foto e documento restrito de exemplo

## Phase 7: Conferência

- [X] T017 Suíte do backend, roteiros de navegador (anteriores + novos), auditoria axe nas telas novas/alteradas e READMEs

## Registro da conferência (29/10/2026)

- Backend: 434 testes passaram, 1 pulado (suíte completa no PostgreSQL local). Ruff sem erros nos arquivos alterados.
- Navegador (Playwright): roteiros da 001 (US1, US2, US3/4, US5, US9, US10, US12, P2a, teclado) e da 002
  (visitante, tema, alça, agenda, lembrete, calendário, restrito, chamados, configurações) — todos passando.
- axe (WCAG 2.2 A/AA): 84 combinações logadas (2 perfis × 3 temas × 2 larguras × 7 telas) e 36 de visitante,
  sem violações nem rolagem horizontal.
- Corrigido na conferência: token recusado de forma intermitente quando o relógio voltava ~1 s (folga de 5 s só no
  `iat`); interruptores de Configurações que não respondiam ao clique (só ao teclado); contador do submenu ativo
  sem contraste no tema Vinho; botão "mostrar senha" com área de toque pequena e selo do login sem contraste no
  tema escuro; cancelar inscrição pelo carrossel da Inicial.

