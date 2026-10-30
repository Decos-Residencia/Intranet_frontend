# Tasks: Modernização da Intranet Hospital Decós

**Input**: Design documents from `specs/001-modernizacao-intranet/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Incluídos só para o backend, porque a regra do projeto exige teste de integração por rota (ver Constitution Check no plan.md). O frontend é validado pelo roteiro do `quickstart.md` e pela auditoria Lighthouse/axe.

**Organization**: Tarefas agrupadas por história (US1…US11 do spec.md), na ordem de entrega do plan.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história do spec.md

## Path Conventions

Caminhos relativos à pasta `residencia qa/`:
- Backend: `Intranet_backend/app/…`, testes em `Intranet_backend/tests/…`
- Frontend: `Intranet_frontend/src/…`

---

## Phase 1: Setup

- [X] T001 Criar a branch `001-modernizacao-intranet` em `Intranet_frontend` e em `Intranet_backend` a partir da branch principal atualizada, e versionar `Intranet_frontend/specs/`, `Intranet_frontend/.specify/` e `Intranet_frontend/CLAUDE.md`
- [X] T002 [P] Rodar `pytest -q` em `Intranet_backend` e salvar o resultado em `Intranet_frontend/specs/001-modernizacao-intranet/baseline-pytest.txt` como linha de base
- [X] T003 [P] Rodar a auditoria Lighthouse/axe atual (`Intranet_frontend/docs/qa/task-01/scripts/audit.mjs`) na Inicial e salvar as notas de acessibilidade em `Intranet_frontend/specs/001-modernizacao-intranet/baseline-a11y.md`

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Purpose**: permissões vindas do servidor e preferências na conta. Sem isso, as telas novas não sabem o que mostrar.

- [X] T004 Criar `Intranet_backend/app/core/permissoes.py` com o enum `Permissao` (12 valores do data-model.md), `PERFIL_PERMISSOES` (mapa perfil → permissões que reproduz o comportamento atual de `gere_conteudo`/`pode_interagir`/ADMIN), o conjunto `NAO_AJUSTAVEIS = {gerenciar_usuarios, auditoria}` e a função `permissoes_efetivas(usuario, ajustes) -> set[Permissao]`
- [X] T005 Criar o modelo `Intranet_backend/app/models/usuario_permissao.py` (tabela `usuario_permissoes`, único `(usuario_id, permissao)`) e registrá-lo em `Intranet_backend/app/models/__init__.py`
- [X] T006 Adicionar `preferencias` (JSON, default `{}`) e `ultimo_acesso_em` (timestamptz nulo) em `Intranet_backend/app/models/usuario.py`, e a relação `ajustes_permissao`
- [X] T007 Criar a migração `Intranet_backend/alembic/versions/0020_permissoes_preferencias.py` (down_revision `0019_emails_recebidos`) com `usuario_permissoes`, as duas colunas novas, a política RLS igual às demais tabelas e o downgrade
- [X] T008 Em `Intranet_backend/app/core/dependencies.py`, criar `require_permissao(*perms)` que devolve dependência FastAPI (403 "Sem permissão para esta ação."), mantendo `AdminUser`, `ContentManager` e `WriterUser` como atalhos implementados por ela
- [X] T009 Alterar `GET /auth/me` em `Intranet_backend/app/routes/auth.py` e o schema em `Intranet_backend/app/schemas/auth.py`/`usuario.py` para devolver `permissoes: list[str]` e `preferencias`; gravar `ultimo_acesso_em` no login em `Intranet_backend/app/services/auth.py`
- [X] T010 Criar `PUT /auth/me/preferencias` em `Intranet_backend/app/routes/auth.py` com schema Pydantic `PreferenciasUpdate` em `Intranet_backend/app/schemas/preferencias.py` (validação do data-model.md: tema, texto 100–200 em passos de 25, escala, booleanos, atalhos ≤12 com url http/https) e merge parcial
- [X] T011 [P] Testes `Intranet_backend/tests/unit/test_permissoes.py`: efetivas por perfil igual ao comportamento atual; concessão e retirada; não ajustáveis ignorados
- [X] T012 [P] Testes `Intranet_backend/tests/integration/test_preferencias.py`: `/auth/me` traz `permissoes` e `preferencias`; PUT parcial; 422 para url `javascript:` e texto 110
- [X] T013 Em `Intranet_frontend/src/app/store.js`, fazer `can(cap)` usar `state.user.permissoes` com um mapa único `CAP_PERMISSAO` (interact→interagir, download→baixar, edit_profile→editar_perfil, manage_news→gerenciar_avisos, manage_docs→gerenciar_documentos, manage_faq→gerenciar_faq, manage_events→gerenciar_eventos, manage_tickets→gerenciar_chamados, manage_reviews→gerenciar_avaliacoes, manage_users→gerenciar_usuarios, audit_all→auditoria); manter `DB.roles` só para rótulo/ícone em `Intranet_frontend/src/data/config.js`
- [X] T014 Criar `Intranet_frontend/src/services/preferencias.service.js` (`salvar(parcial)`) e `Intranet_frontend/src/features/preferencias.js` (aplicar preferências no `<html>` como atributos `data-*` e variáveis CSS; cópia em `localStorage` com try/catch; sincroniza após `/auth/me`), e incluir os scripts em `Intranet_frontend/index.html`
- [X] T015 Aplicar as preferências salvas no script inline do `<head>` de `Intranet_frontend/index.html` antes do CSS, para não "piscar" (FR-018)

**Checkpoint**: `pytest` verde; menus continuam iguais para os 4 perfis, agora com permissões vindas do servidor.

---

## Phase 3: User Story 1 - Controle de acesso (P1) 🎯 MVP

**Goal**: ADMIN gerencia perfil, ativação e permissões extras de cada usuário; a troca de perfil some.

**Independent Test**: quickstart.md, linhas US1.

### Tests

- [X] T016 [P] [US1] Testes `Intranet_backend/tests/integration/test_acessos.py`: listagem com filtros; mudar perfil; conceder/retirar/voltar ao padrão; 409 no último ADMIN (perfil e desativação); 422 para permissão não ajustável; 403 para não ADMIN; auditoria registrada com antes/depois; colaborador com `gerenciar_eventos` consegue criar evento e RH com `gerenciar_documentos` retirada recebe 403

### Implementation

- [X] T017 [US1] Criar `Intranet_backend/app/schemas/acessos.py` (PermissaoCatalogo, UsuarioAcessoRead, UsuarioAcessoUpdate)
- [X] T018 [US1] Criar `Intranet_backend/app/services/acessos.py` (listar com busca/filtros/paginação, atualizar com proteção do último ADMIN e auditoria `ACESSO_PERFIL_ALTERADO`, `ACESSO_PERMISSAO_ALTERADA`, `ACESSO_USUARIO_ATIVADO/DESATIVADO`)
- [X] T019 [US1] Criar `Intranet_backend/app/routes/acessos.py` (`GET /acessos/permissoes`, `GET /acessos/usuarios`, `PUT /acessos/usuarios/{id}`) e registrar em `Intranet_backend/app/main.py`
- [X] T020 [US1] Trocar `ContentManager`/`AdminUser` por `require_permissao(...)` específico em `Intranet_backend/app/routes/{avisos,documentos,eventos,faqs,chamados,avaliacoes_documentos,usuarios,setores,solicitacoes_cadastrais,auditoria}.py`, conforme a tabela do data-model.md
- [X] T021 [P] [US1] Criar `Intranet_frontend/src/services/acessos.service.js` e incluir em `Intranet_frontend/index.html`
- [X] T022 [US1] Criar a tela `Intranet_frontend/src/pages/admin/acessos/acessos.js` (`PagesAdmin.adminAcessos`): tabela com busca, filtros por perfil/setor/situação; painel lateral do usuário com seletor de perfil, chave ativo/inativo e lista de permissões mostrando origem ("do perfil" / "concedida" / "retirada") e "Voltar ao padrão"; confirmação antes de salvar; mensagens de erro 409/422
- [X] T023 [US1] Adicionar a rota `#/admin/acessos` (need `manage_users`) em `Intranet_frontend/src/app/routes.js` e o item "Controle de acesso" em `Intranet_frontend/src/shared/layout/menu.js`
- [X] T024 [US1] Remover o botão `open-role` de `Intranet_frontend/src/shared/layout/topbar.js` e de `Intranet_frontend/src/shared/layout/sidebar.js` (o perfil vira só um selo informativo), a ação em `Intranet_frontend/src/app/actions.js`, `openRolePanel`, `previewRole`, `setPreviewRole`, `previewAniversario` e `setPreviewAniversario` de `Intranet_frontend/src/app/store.js` e onde forem usados
- [X] T025 [US1] Atualizar os scripts de QA que dependiam da troca de perfil em `Intranet_frontend/docs/qa/task-01/scripts/*.mjs` para entrar com um usuário de cada perfil
- [X] T026 [US1] Atualizar a seção "Sessão e papéis de acesso" do `Intranet_frontend/README.md` e a tabela de perfis do `Intranet_backend/README.md`

**Checkpoint**: US1 completa e demonstrável sozinha.

---

## Phase 4: User Story 11 - Pesquisa comparativa (P1, insumo)

**Goal**: validar o benchmark do research.md antes de fechar o visual.

**Independent Test**: documento com ≥5 referências e decisões, revisado pela equipe.

- [ ] T027 [P] [US11] Coletar capturas atuais (sites/demos públicas) das referências do research.md §1 e salvar em `Intranet_frontend/specs/001-modernizacao-intranet/benchmark/`
- [ ] T028 [US11] Revisar a tabela e as decisões em `Intranet_frontend/specs/001-modernizacao-intranet/research.md` §1 com a equipe e registrar a data da revisão

---

## Phase 5: User Story 3 - Temas Claro, Escuro, Vinho e Automático (P1)

**Goal**: nova base visual "glass" e seletor de tema salvo na conta.

**Independent Test**: quickstart.md, linha US3.

- [X] T029 [US3] Reescrever os tokens de `Intranet_frontend/src/styles/base/tokens-e-temas.css`: cores de fundo, superfície glass (opacidade 0,72–0,85), borda, sombra, texto, primária, foco, para `light`, `dark`, `red` e `[data-contraste="alto"]`, com pares de contraste ≥4,5:1 (texto) e ≥3:1 (componentes); documentar cada par em comentário
- [X] T030 [P] [US3] Criar `Intranet_frontend/src/styles/components/glass.css` (`.glass`, `.glass-strong`, `.glass-bar`) com `backdrop-filter` e fallback `@supports not` e `[data-transparencia="reduzida"]` para fundo sólido; incluir em `Intranet_frontend/index.html`
- [X] T031 [US3] Atualizar `Intranet_frontend/src/styles/components/{card,botoes,modal,painel}.css` e `Intranet_frontend/src/styles/layout/{topbar,sidebar}.css` para usar os novos tokens e superfícies glass; botões primários sólidos com contraste forte
- [X] T032 [US3] Em `Intranet_frontend/src/features/aparencia.js`, substituir o ciclo por um seletor (popover com 4 opções e prévia de cor; teclado e `aria-checked`); "Automático" segue `prefers-color-scheme`; salvar via `Services.preferencias.salvar({tema})`
- [X] T033 [US3] Trocar o botão `cycle-theme` pelo botão do seletor em `Intranet_frontend/src/shared/layout/topbar.js` e `Intranet_frontend/src/pages/login/login.js`, e remover o tratamento antigo em `Intranet_frontend/src/app/actions.js`; adicionar `auto` em `THEMES` de `Intranet_frontend/src/app/store.js`

---

## Phase 6: User Story 4 - Configurações de acessibilidade (P1)

**Goal**: preferências de acessibilidade para todos, salvas na conta.

**Independent Test**: quickstart.md, linhas US4.

- [X] T034 [US4] Em `Intranet_frontend/src/styles/base/acessibilidade.css`: escala de texto por `html[data-texto]` (100–200%), `--ui-scale` por `data-escala`, `data-movimento="reduzido"` (e `prefers-reduced-motion`) sem animações, `data-links="sublinhado"`, `data-foco="reforcado"` (contorno 3 px + halo), `data-fonte="leitura"` (Atkinson Hyperlegible), e `[data-contraste="alto"]` com contraste 7:1
- [X] T035 [US4] Adicionar Atkinson Hyperlegible ao link do Google Fonts em `Intranet_frontend/index.html`
- [X] T036 [US4] Criar `Intranet_frontend/src/pages/configuracoes/configuracoes.js` (`Pages.configuracoes`) com abas Aparência (seletor de tema), Acessibilidade (todas as opções do FR-015/016 com prévia ao vivo) e Restaurar padrão; incluir o script em `Intranet_frontend/index.html`
- [X] T037 [US4] Adicionar a rota `#/configuracoes` em `Intranet_frontend/src/app/routes.js`, o item "Configurações" no menu do usuário em `Intranet_frontend/src/shared/layout/topbar.js` e em `Intranet_frontend/src/shared/layout/menu.js` (todos os perfis)
- [X] T038 [US4] Garantir link "Pular para o conteúdo", `main` com `id`, ordem de foco e `aria-label` nos botões só com ícone em `Intranet_frontend/src/shared/layout/{topbar,sidebar}.js` e `Intranet_frontend/src/app/router.js`
- [X] T039 [US4] Corrigir unidades fixas em px que impedem o zoom nos CSS de layout (`Intranet_frontend/src/styles/layout/*.css`) e garantir sem rolagem horizontal a 320 px com texto 200%

---

## Phase 7: User Story 2 - Nova Inicial (P1)

**Goal**: Inicial moderna por perfil, com inscrição direta e lido/não lido.

**Independent Test**: quickstart.md, linhas US2.

**Depende de**: Phase 5 e 6 (base visual) e T040–T042 abaixo.

### Tests

- [X] T040 [P] [US2] Testes `Intranet_backend/tests/integration/test_eventos_visualizacao.py`: `POST /eventos/{id}/visualizacao` idempotente; listagem traz `visto` e `inscrito`

### Implementation

- [X] T041 [US2] Criar o modelo `Intranet_backend/app/models/evento_visualizacao.py` e a migração `Intranet_backend/alembic/versions/0021_eventos_tipo_visualizacao.py` (também `eventos.tipo` default `EVENTO` e `evento_inscricoes.email_enviado_em`, usados na US10)
- [X] T042 [US2] Em `Intranet_backend/app/services/eventos.py`, `Intranet_backend/app/routes/eventos.py` e `Intranet_backend/app/schemas/evento.py`: rota de visualização e campos `visto`, `inscrito`, `tipo` nas listagens
- [X] T043 [US2] Criar `Intranet_frontend/src/styles/pages/dashboard.css` novo (grade, hero com saudação, cartões glass, estados lido/não lido, botões de inscrição) substituindo o atual
- [X] T044 [US2] Reescrever `Intranet_frontend/src/pages/dashboard/dashboard.js` na variante **colaborador**: saudação + data; "Avisos não lidos" (máx. 5, selo "não lido", link "ver todos"); "Próximos eventos" com botão Inscrever-se/Inscrito/Esgotado/Encerrado chamando `Services.eventos` sem sair da tela; "Aniversariantes do mês"; "Acessos rápidos"
- [X] T045 [US2] No mesmo arquivo, variante **gestor/ADMIN**: até 4 cartões-resumo (Avisos, Eventos, Documentos, Usuários conforme permissão) e uma área "Precisa da sua atenção" juntando chamados abertos, solicitações cadastrais e avaliações pendentes; remover os demais blocos numéricos
- [X] T046 [P] [US2] Mostrar selo lido/não lido na lista `Intranet_frontend/src/pages/avisos/mural.js` usando o campo `lido` da API
- [X] T047 [P] [US2] Mostrar selo "novo" e chamar a rota de visualização ao abrir em `Intranet_frontend/src/pages/eventos/lista.js` e `Intranet_frontend/src/pages/eventos/detalhe.js`; adicionar `visualizar(id)` em `Intranet_frontend/src/services/eventos.service.js`

**Checkpoint**: todas as P1 entregues. Rodar quickstart US1–US4 e auditoria (SC-003, SC-006).

---

## Phase 8: User Story 5 - Documentos com descrição e versões (P2)

**Goal**: descrição obrigatória, versão vigente/antiga no upload, histórico de versões.

**Independent Test**: quickstart.md, linhas US5.

### Tests

- [X] T048 [P] [US5] Testes `Intranet_backend/tests/integration/test_documento_versoes.py`: upload sem descrição → 422; nova versão vigente rebaixa a anterior; só uma vigente; listagem padrão só vigentes; download de versão antiga respeita setor; migração preserva documentos existentes

### Implementation

- [X] T049 [US5] Criar `Intranet_backend/app/models/documento_versao.py` e a migração `Intranet_backend/alembic/versions/0022_documento_versoes.py` (cria a tabela, índice único parcial por vigente, copia os dados atuais de `documentos` como versão vigente)
- [X] T050 [US5] Atualizar `Intranet_backend/app/services/documentos.py`, `Intranet_backend/app/routes/documentos.py` e `Intranet_backend/app/schemas/documento.py`: descrição obrigatória (≥10), `vigente` no upload, rotas de versões (listar, enviar, tornar vigente, download) e `incluir_antigas`, com auditoria `DOCUMENTO_VERSAO_ENVIADA`
- [X] T051 [P] [US5] Adicionar `versoes`, `enviarVersao`, `tornarVigente`, `baixarVersao` em `Intranet_frontend/src/services/documentos.service.js`
- [X] T052 [US5] Em `Intranet_frontend/src/pages/admin/documentos/formulario.js`: descrição obrigatória com contador; escolha "Versão nova (vigente)" / "Versão antiga"; rótulo obrigatório; na edição, seção "Versões" com enviar nova versão e tornar vigente
- [X] T053 [US5] Em `Intranet_frontend/src/pages/documentos/visualizar.js` e `Intranet_frontend/src/pages/documentos/central.js`: descrição visível; versão vigente em destaque; lista "Versões anteriores" com aviso de obsoleta; filtro "incluir versões antigas"

---

## Phase 9: User Story 6 - Aniversariantes só do mês atual (P2)

**Independent Test**: quickstart.md, linha US6.

- [X] T054 [P] [US6] Em `Intranet_frontend/src/pages/aniversariantes/mes.js`: remover os chips de meses, mostrar só o mês atual ordenado por dia, título com o nome do mês; manter filtro de setor e busca

---

## Phase 10: User Story 7 - Ramais (P2)

**Independent Test**: quickstart.md, linha US7.

- [X] T055 [P] [US7] Teste em `Intranet_backend/tests/integration/test_directory.py`: busca por ramal e cargo; ramal inválido (letras, 2 ou 7 dígitos) → 422
- [X] T056 [US7] Em `Intranet_backend/app/services/usuarios.py` e schemas de usuário/setor: busca por ramal e cargo; validação do ramal (só dígitos, 3–6)
- [X] T057 [US7] Em `Intranet_frontend/src/pages/diretorio/diretorio.js`: busca única (nome, setor, cargo, ramal), ramal em destaque, botão "Copiar ramal" com toast, alternância "Pessoas / Por setor" com o ramal do setor
- [X] T058 [P] [US7] Em `Intranet_frontend/src/pages/perfil/perfil.js`: edição do próprio ramal com validação

---

## Phase 11: User Story 8 - Meus chamados (P2)

**Independent Test**: quickstart.md, linha US8.

- [X] T059 [P] [US8] Criar `Intranet_frontend/src/pages/chamados/meus.js` (`Pages.meusChamados`) usando `Services.chamados.meus`: lista com tipo, assunto, data, status e resposta; estado vazio; aviso de que anônimos não aparecem; botão "Abrir chamado" (ação `open-chamado`); incluir em `Intranet_frontend/index.html`
- [X] T060 [US8] Adicionar rota `#/chamados` (need `interact`) em `Intranet_frontend/src/app/routes.js` e item "Meus chamados" em `Intranet_frontend/src/shared/layout/menu.js`

**Checkpoint**: P2 completas.

---

## Phase 12: User Story 9 - Acessos rápidos externos (P3)

**Independent Test**: quickstart.md, linha US9.

- [X] T061 [P] [US9] Testes `Intranet_backend/tests/integration/test_atalhos.py`: CRUD global só com `gerenciar_usuarios`; url inválida → 422; GET para qualquer autenticado
- [X] T062 [US9] Criar `Intranet_backend/app/models/atalho.py`, migração `Intranet_backend/alembic/versions/0023_atalhos.py` (com seed "Site Hospital Decós"), `Intranet_backend/app/services/atalhos.py`, `Intranet_backend/app/routes/atalhos.py` e registrar em `Intranet_backend/app/main.py`
- [X] T063 [P] [US9] Criar `Intranet_frontend/src/services/atalhos.service.js`
- [X] T064 [US9] Em `Intranet_frontend/src/shared/ui/acesso-rapido.js` e `Intranet_frontend/src/shared/layout/quick-fab.js`: juntar atalhos internos, globais e pessoais; externos abrem em nova aba com `rel="noopener noreferrer"` e ícone de link externo
- [X] T065 [US9] Botão "Adicionar atalho" na Inicial e aba "Atalhos" em `Intranet_frontend/src/pages/configuracoes/configuracoes.js` (adicionar, reordenar, remover pessoais via preferências)
- [X] T066 [US9] Gestão de atalhos globais para ADMIN em `Intranet_frontend/src/pages/admin/acessos/acessos.js` (aba "Atalhos globais")

---

## Phase 13: User Story 10 - Leitores, arquivamento, treinamento, calendário e e-mail (P3)

**Independent Test**: quickstart.md, linhas US10.

### Tests

- [X] T067 [P] [US10] Testes `Intranet_backend/tests/integration/test_arquivamento.py`: RH arquiva/restaura avisos, documentos e eventos; RH recebe 403 no DELETE; ADMIN exclui; arquivados somem para colaborador; auditoria com conteúdo anterior
- [X] T068 [P] [US10] Testes em `Intranet_backend/tests/integration/test_avisos_v2.py` (leitores paginados, só gestor) e `Intranet_backend/tests/integration/test_eventos.py` (filtro `tipo`, CSV de inscritos, e-mail disparado com SMTP falso e inscrição concluída mesmo com SMTP falhando)

### Implementation

- [X] T069 [US10] ~~Migração `0024_arquivamento.py`~~ — **não necessária**: o arquivamento reaproveita o que já existia (aviso com status `ARQUIVADO`, documento desativado `ativo=false`, evento `CANCELADO`), todos já auditados
- [X] T070 [US10] Rotas `arquivar`/`restaurar` e `DELETE` com `excluir_definitivo` em `Intranet_backend/app/routes/{avisos,documentos,eventos}.py` e serviços correspondentes, com auditoria `CONTEUDO_ARQUIVADO`/`CONTEUDO_RESTAURADO`
- [X] T071 [US10] `GET /avisos/{id}/leitores` em `Intranet_backend/app/routes/avisos.py` e `Intranet_backend/app/services/avisos.py`
- [X] T072 [US10] Criar `Intranet_backend/app/services/email.py` (SMTP via variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` em `Intranet_backend/app/core/config.py` e `.env.example`; sem config = só log) e disparo em `BackgroundTasks` na inscrição; rotas `inscritos.csv` e `inscritos/enviar`
- [X] T073 [P] [US10] Frontend: botão "Quem leu" com painel de leitores em `Intranet_frontend/src/pages/admin/noticias/lista.js`
- [X] T074 [P] [US10] Frontend: "Arquivar"/"Restaurar" para RH e "Excluir definitivamente" só com `excluir_definitivo` em `Intranet_frontend/src/pages/admin/{noticias,documentos,eventos}/lista.js`, com filtro "Arquivados"
- [X] T075 [P] [US10] Frontend: campo Tipo (Evento/Treinamento) em `Intranet_frontend/src/pages/admin/eventos/formulario.js`; filtro por tipo e selo em `Intranet_frontend/src/pages/eventos/lista.js`
- [X] T076 [US10] Frontend: em `Intranet_frontend/src/pages/eventos/lista.js`, `mouseenter`/`focus`/toque no dia do mini calendário mostra os eventos do dia na área abaixo (`aria-live="polite"`); ao sair, volta ao padrão
- [X] T077 [P] [US10] Frontend: botões "Exportar CSV" e "Enviar por e-mail" no painel de inscritos de `Intranet_frontend/src/pages/admin/eventos/lista.js`

---

## Phase 13b: User Story 12 - Foto do evento em carrossel (P2, pedido posterior)

**Goal**: foto de capa por evento e carrossel de próximos eventos na Inicial.

**Independent Test**: spec.md, US12.

- [X] T084 [P] [US12] Testes `Intranet_backend/tests/integration/test_eventos_imagem.py`: enviar, trocar e remover a foto (só gestor); formato, conteúdo falso e tamanho recusados; link temporário só para quem vê o evento; listagem informa `tem_imagem`
- [X] T085 [US12] Modelo e migração `Intranet_backend/alembic/versions/0024_eventos_imagem.py` (`eventos.imagem_key`, `eventos.imagem_mime`) e validação de imagem em `Intranet_backend/app/services/imagens.py`
- [X] T086 [US12] Rotas `PUT/DELETE /eventos/{id}/imagem` e `GET /eventos/{id}/imagem` (link assinado) em `Intranet_backend/app/routes/eventos.py` e serviço; `tem_imagem` em `EventoRead`
- [X] T087 [P] [US12] Serviço JS e campo "Foto de capa" com prévia em `Intranet_frontend/src/pages/admin/eventos/formulario.js`
- [X] T088 [US12] Carrossel acessível de próximos eventos em `Intranet_frontend/src/pages/dashboard/dashboard.js` e `Intranet_frontend/src/shared/lib/carrossel.js`; foto no detalhe em `Intranet_frontend/src/pages/eventos/detalhe.js`

---

## Phase 14: Polish & verificação de "completo"

- [X] T078 Rodar `pytest -q` em `Intranet_backend` e comparar com a linha de base (T002): nenhum teste antigo quebrado
- [X] T079 Rodar Lighthouse/axe na Inicial, Configurações e Controle de acesso (desktop e mobile) e registrar em `Intranet_frontend/specs/001-modernizacao-intranet/resultado-a11y.md` (meta SC-006 ≥ 95)
- [X] T080 Verificar contraste dos três temas e do alto contraste com uma ferramenta de contraste e registrar os pares em `resultado-a11y.md` (SC-003)
- [X] T081 Executar o roteiro completo de `Intranet_frontend/specs/001-modernizacao-intranet/quickstart.md` com os 4 perfis e marcar cada linha
- [X] T082 [P] Atualizar `Intranet_frontend/README.md` (telas novas, temas, acessibilidade) e `Intranet_backend/README.md` (rotas novas, variáveis SMTP)
- [X] T083 Rodar `/speckit-analyze` para checar consistência spec ↔ plano ↔ tarefas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → bloqueia todas as histórias.
- **US1 (3)** depende só da Foundational.
- **US11 (4)** pode correr em paralelo desde o início.
- **US3 (5)** → **US4 (6)** (compartilham tokens e preferências) → **US2 (7)**.
- **US5, US6, US7, US8 (8–11)** dependem só da Foundational; US6 e US8 são só frontend e podem ser feitas a qualquer momento.
- **US9 (12)** depende de US2 (Inicial) e US4 (Configurações).
- **US10 (13)** depende de US1 (permissão `excluir_definitivo`) e de T041 (colunas de eventos).
- **Polish (14)** no fim.

### Migrações (ordem fixa)

`0020_permissoes_preferencias` → `0021_eventos_tipo_visualizacao` → `0022_documento_versoes` → `0023_atalhos` (a 0024 de arquivamento não foi necessária). Se as histórias forem feitas fora de ordem, renumerar mantendo a cadeia linear.

### Within Each User Story

Testes do backend → modelo/migração → serviço → rota → serviço JS → tela → menu/rota da SPA.

## Parallel Example: Foundational + US1

```text
# Depois de T004–T010:
T011 test_permissoes.py        | T012 test_preferencias.py      | T013 store.js can()
# US1:
T016 test_acessos.py           | T021 acessos.service.js
```

## Parallel Example: P2

```text
T054 aniversariantes (US6) | T059 meus chamados (US8) | T048 testes versões (US5) | T055 testes ramais (US7)
```

## Implementation Strategy

### MVP (US1)

Setup + Foundational + US1 → validar quickstart US1 → entregar. Já resolve o pedido de controlar acessos e tira a troca de perfil.

### Entrega incremental

1. MVP (US1)
2. Base visual: US3 + US4 → demonstrar temas e acessibilidade
3. US2 → nova Inicial (fecha todas as P1)
4. Ganhos rápidos: US6 + US8; depois US5 e US7
5. US9 e US10

### Time em paralelo

- Pessoa A: backend (Foundational, US1, US5, US10)
- Pessoa B: frontend visual (US3, US4, US2)
- Pessoa C: ganhos rápidos e pesquisa (US6, US8, US11, US7)

## Notes

- [P] = arquivos diferentes, sem dependência pendente.
- Cada fase termina num checkpoint que pode ser demonstrado sozinho.
- Fazer commit ao fim de cada tarefa ou grupo lógico, nos dois repositórios.
