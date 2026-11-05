# Tasks: Intranet v4 — acesso por perfil, funcionalidades liberáveis, ramal por setor e inscrição externa

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Regra do projeto**: nada é commitado antes da conferência.

## Phase 1: Base

- [X] T001 Criar a branch `feat/acesso-perfil-funcionalidades` a partir da `main` nos dois repositórios
- [X] T002 Ambiente de integração local: PostgreSQL descartável + `postgres-test` resolvido só num namespace (scratchpad, fora dos repositórios)

## Phase 2: US1 — Acesso por perfil (P1)

- [X] T003 [US1] Reverter `c21b44e` no backend (matriz `perfil_permissoes`, `PUT /acessos/perfis/{perfil}`, sem ajustes por pessoa)
- [X] T004 [US1] Migração `0036_acesso_por_perfil` (reaproveita a `0029`)
- [X] T005 [US1] Reverter `16e1cd8` no frontend (tela Controle de acesso com matriz por perfil)
- [X] T006 [US1] Ajustar `test_migration_graph` para exigir uma head só

## Phase 3: US2/US3 — Telas por perfil e auditoria (P1)

- [X] T007 [US2] Menu: "Documentos & POPs" e "Gerenciar Documentos" separados para quem gerencia documentos
- [X] T008 [US2] Responsáveis por setor dos chamados e reenvio de e-mail com `GestorUsuarios` (catálogo)
- [X] T009 [US3] Auditar exportação de inscritos e de interessados (só contagem) e reenvio de e-mail
- [X] T010 [US3] Filtros novos na tela de auditoria (vagas, perfis e acessos, funcionalidades, e-mails)
- [X] T011 [US3] Testes `test_auditoria_exportacoes.py`

## Phase 4: US4 — Funcionalidades liberáveis (P1)

- [X] T012 [US4] Catálogo `app/core/funcionalidades.py`, modelo `FuncionalidadeConfig`, migração `0037_funcionalidades`
- [X] T013 [US4] Serviço (ligadas, exigir, filtrar destinatários, listar, definir + auditoria) e rotas `/funcionalidades`
- [X] T014 [US4] Dependência nos routers de agenda, vagas, aniversariantes, eventos, treinamentos, calendário, FAQ, painel e chamados; diretório em `GET /usuarios`
- [X] T015 [US4] `/auth/me.funcionalidades`, Meu painel e Inicial sem os módulos desligados; notificações automáticas filtradas
- [X] T016 [US4] Frontend: `App.ligada`/`rotaLigada`, guarda no router, menu, atalhos, carga de dados, lembretes, botão de abrir chamado
- [X] T017 [US4] Tela Administração → Funcionalidades
- [X] T018 [US4] Testes `test_funcionalidades.py`

## Phase 5: US5 — Ramais por setor (P2)

- [X] T019 [US5] Backend: sai `PUT /auth/me/ramal` (só o ADMIN altera); chamados com o ramal do setor quando a pessoa não tem o seu
- [X] T020 [US5] Frontend: Diretório abre por setor (ramal do setor + pessoas com o ramal de cada uma); Meu perfil só leitura
- [X] T021 [US5] Testes do Diretório (só o ADMIN altera; pessoa sem ramal mostra o do setor)
- [X] T022 [US5] (desfeito) remoção do ramal pessoal e migração para o setor: substituído pela decisão de 2026-11-01

## Phase 6: US6 — Inscrição externa em eventos (P2)

- [X] T023 [US6] Modelo/migração `0037` (`inscricao`, `inscricao_url` e checks) e schemas
- [X] T024 [US6] Serviço: validação, recusa de inscrição, auditoria `inscricao_evento`
- [X] T025 [US6] Frontend: formulário (modo + link + confirmação com inscritos), detalhe, lista, carrossel e lista do admin
- [X] T026 [US6] Testes `test_eventos_inscricao_externa.py`

## Phase 7: Polimento

- [X] T027 README do backend e do frontend, CLAUDE.md
- [X] T028 Suíte completa do backend e conferência visual com Playwright de todas as telas alteradas
- [X] T030 [US2] "Atender chamados" passa a valer no servidor e a fila aparece no menu de quem atende (após o merge da `main`: só os chamados do próprio setor; transferir/atribuir é do ADMIN)
- [X] T031 [US2] Pedido de alteração cadastral exige "Pedir alteração do próprio cadastro" (editar_perfil), igual à tela; Diretório desligado também barra `GET /usuarios/{id}`
- [X] T032 Testes rigorosos de acesso: `test_matriz_acesso.py` (153 rotas classificadas × visitante e 4 perfis; cada permissão isolada; 9 módulos × 4 perfis; módulos públicos) e `test_chamados_atender_permissao.py`
- [X] T033 Navegador: 42 endereços × 5 perfis, links do menu, botões de interação, matriz personalizada, responsável de setor (41 verificações) e fluxos completos (61 verificações)
- [ ] T029 Conferência do responsável e, só depois, commits e PRs (backend e frontend)
