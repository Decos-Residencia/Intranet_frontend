# Tasks: Intranet v3

**Input**: Design documents from `specs/003-intranet-v3/` (plan, spec, research, data-model, contracts/api.md, quickstart)

**Tests**: incluídos. Regra do projeto: toda rota nova ou alterada tem teste de integração no backend, e cada história tem roteiro de navegador.

Caminhos relativos a `residencia qa/`. **Sem commit até o usuário liberar.**

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Adicionar `fpdf2==2.8.3` (e dependências fixadas: `defusedxml`, `fonttools`, `pillow`) em `Intranet_backend/requirements/prod.txt` e instalar no `.venv`
- [X] T002 [P] Serviços do frontend `Intranet_frontend/src/services/{painel,treinamentos}.service.js` incluídos em `index.html` (os de revisão, calendário e vagas entram junto com as respectivas histórias)

---

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T003 Permissões `APROVAR_PUBLICACOES` (padrão ADMIN) e `GERENCIAR_VAGAS` (padrão RH, ADMIN), com rótulos, ajustáveis, em `Intranet_backend/app/core/permissoes.py` e aliases `Aprovador`/`GestorVagas` (RH ganha `gerenciar_vagas` por padrão) em `Intranet_backend/app/core/dependencies.py`; atualizar `tests/unit/test_permissoes.py`
- [X] T004 Modelos novos `Intranet_backend/app/models/{treinamento_obrigatorio,data_institucional,vaga}.py` (TreinamentoObrigatorio, DataInstitucional, Vaga, VagaInteresse) e campos novos em `app/models/{aviso,evento,agenda}.py` (EM_REVISAO, `destaque_ate`, `revisao_*`, `obrigatorio_id`, `presente/presenca_em/presenca_por_id`, `lembrete_min/lembrete_enviado_em`); registrar em `app/models/__init__.py`
- [X] T005 Migração `Intranet_backend/alembic/versions/0026_intranet_v3.py` (tabelas, colunas, CHECKs de status atualizados, índices, RLS sem privilégios para anon/authenticated) com downgrade funcional; conferir upgrade/downgrade/upgrade no banco local
- [X] T006 [P] Mapa de capacidades do frontend (`aprovar_publicacoes` → `approve`, `gerenciar_vagas` → `manage_vagas`) em `Intranet_frontend/src/app/store.js` e catálogo da tela de Controle de acesso

**Checkpoint**: migração aplicada; suíte existente continua verde.

---

## Phase 3: User Story 1 - Meu painel (P1) 🎯 MVP

**Goal**: uma tela com tudo o que está pendente para o colaborador, incluindo treinamentos obrigatórios (com presença).

**Independent Test**: colaborador da Recepção com 2 avisos não lidos, 1 obrigatório sem presença, 1 chamado em análise, 1 tarefa hoje e 1 inscrição futura vê as contagens certas e chega a cada item em 1 clique.

- [X] T007 [P] [US1] Testes `Intranet_backend/tests/integration/test_obrigatorios_presenca.py`: CRUD de tema (só `gerenciar_eventos`), turma ligada só a TREINAMENTO, presença recusada antes do início (409), presença conclui a pendência, inscritos trazem `presente`, auditoria
- [X] T008 [P] [US1] Testes `Intranet_backend/tests/integration/test_painel.py`: blocos e contagens, "Tudo em dia", público-alvo por setor OU perfil, visitante 401, ler aviso reduz a contagem
- [X] T009 [US1] Schemas e serviço de obrigatórios e presença em `Intranet_backend/app/schemas/treinamentos.py`, `app/services/treinamentos.py` (pendências por usuário, próxima turma) e alterações em `app/services/eventos.py` (`obrigatorio_id`, `PUT /eventos/{id}/presencas`)
- [X] T010 [US1] Rotas `Intranet_backend/app/routes/treinamentos.py` e presença em `app/routes/eventos.py`; registrar em `app/main.py`
- [X] T011 [US1] Serviço e rota `GET /painel` em `Intranet_backend/app/services/painel.py`, `app/schemas/painel.py`, `app/routes/painel.py`
- [X] T012 [P] [US1] Tela `#/painel` em `Intranet_frontend/src/pages/painel/painel.js` (5 blocos, contagem, até 5 itens, "Tudo em dia", inscrição em 1 clique na próxima turma), rota em `src/app/routes.js`, item "Meu painel" no menu (`src/shared/layout/menu.js`) e opção "Meu painel" em Tela ao entrar (`src/pages/configuracoes/configuracoes.js`, `src/features/preferencias.js`, schema de preferências do backend)
- [X] T013 [P] [US1] Gestão: tela de temas obrigatórios `Intranet_frontend/src/pages/admin/treinamentos/obrigatorios.js`; no formulário de evento (`src/pages/admin/eventos/formulario.js`) o campo "Treinamento obrigatório"; na lista de inscritos (`src/pages/admin/eventos/lista.js`) a confirmação de presença (todos/individual)

**Checkpoint**: US1 funcionando e testada sozinha. ✅ 29/10/2026: 14 testes novos no backend (suíte completa com 443 passando), roteiro de navegador `check-painel` 22/22 (axe sem violações no claro e no escuro, celular sem rolagem horizontal) e roteiros anteriores verdes. Corrigidos durante a US1: relacionamento `Aviso.autor` ambíguo depois das colunas de revisão, e o botão de "Enviar por e-mail" dos inscritos, que quebrava ao terminar (`currentTarget` nulo).

---

## Phase 4: User Story 2 - Aprovação de publicações (P1)

**Goal**: quem não aprova só envia para revisão; aprovador aprova ou devolve com motivo.

**Independent Test**: RH envia → ADMIN devolve com motivo → RH corrige e reenvia → ADMIN aprova; só então o aviso aparece para colaborador e visitante.

- [X] T014 [P] [US2] Testes `Intranet_backend/tests/integration/test_revisao.py`: autor sem permissão não publica (403), enviar/aprovar/devolver (avisos e eventos), motivo obrigatório, devolução limpa agendamento, aprovado com data vira AGENDADO, EM_REVISAO invisível para colaborador/visitante, fila, notificações, auditoria, aprovador publica direto, sem aprovador ativo → 409
- [X] T015 [US2] Serviço `Intranet_backend/app/services/revisao.py` (enviar, aprovar, devolver, fila) e regras de status em `app/services/{avisos,eventos}.py` (criação/edição respeitam a permissão; EM_REVISAO fora das listagens públicas)
- [X] T016 [US2] Rotas `POST /{avisos|eventos}/{id}/revisao|aprovar|devolver` em `app/routes/{avisos,eventos}.py` e `GET /revisao` em `app/routes/revisao.py`; schemas em `app/schemas/revisao.py`
- [X] T017 [P] [US2] Formulários de aviso e evento (`Intranet_frontend/src/pages/admin/noticias/formulario.js`, `src/pages/admin/eventos/formulario.js`): sem permissão, botões "Salvar rascunho" e "Enviar para revisão"; selo "Em revisão" e o motivo da devolução visível ao autor
- [X] T018 [P] [US2] Fila `#/admin/revisao` em `Intranet_frontend/src/pages/admin/revisao/fila.js` (prévia, aprovar, devolver com motivo obrigatório), rota e item no menu Administração com contador

**Checkpoint**: US1 e US2 independentes e verdes. ✅ 29/10/2026: 8 testes novos (suíte completa: 451 passando), roteiro `check-revisao` 14/14 e todos os roteiros anteriores verdes. Decisões: sem `status`, quem aprova publica e os demais enviam para revisão; RH pode arquivar aviso e cancelar evento, mas publicar, agendar, republicar e reativar exigem aprovação. Dois testes antigos em que o RH publicava direto foram ajustados para passar pela aprovação.

---

## Phase 5: User Story 3 - Prazo de destaque (P2)

**Independent Test**: aviso com destaque vencido some da Inicial e abre pelo link marcado "fora do destaque".

- [X] T019 [P] [US3] Testes `Intranet_backend/tests/integration/test_destaque.py`: validação (posterior à publicação, 422), filtro `destaque=true`, `em_destaque`, link e histórico continuam abrindo
- [X] T020 [US3] `destaque_ate`/`em_destaque` e filtro em `Intranet_backend/app/schemas/aviso*.py`, `app/services/avisos.py`, `app/routes/avisos.py`
- [X] T021 [US3] Frontend: campo "Exibir em destaque até" no formulário (`src/pages/admin/noticias/formulario.js`); Inicial e contagem de não lidos usam só os em destaque (`src/pages/dashboard/dashboard.js`, `src/app/store.js`); selo "fora do destaque" no mural e no detalhe (`src/pages/avisos/*.js`)

---

## Phase 6: User Story 4 - Lembretes da agenda (P2)

**Independent Test**: tarefa para daqui a 2 min com lembrete "na hora" gera notificação no sino (e alerta do navegador quando permitido), uma única vez.

- [X] T022 [P] [US4] Testes `Intranet_backend/tests/integration/test_lembretes_agenda.py`: lembrete exige hora (422), materialização em `GET /notificacoes` só quando vencido, uma vez só, cancelado se feito/excluído, recalculado ao reagendar, `GET /agenda/lembretes`
- [X] T023 [US4] `lembrete_min` em `app/schemas/agenda.py`, materialização em `app/services/agenda.py` chamada por `app/routes/notificacoes.py`, rota `GET /agenda/lembretes` em `app/routes/agenda.py`
- [X] T024 [US4] Frontend `src/pages/agenda/agenda.js`: escolha do lembrete (indisponível sem horário, com explicação), ícone de sino no item; alertas do navegador agendados para hoje (pedido de permissão só por clique) em `src/features/lembretes.js` (novo) e atualização imediata do sino

---

**Checkpoint US3/US4** ✅ 29/10/2026: 10 testes novos (suíte completa: 461 passando), roteiro `check-us34-v3` 13/13 (o lembrete criado para o minuto seguinte disparou o alerta do navegador e uma única notificação no sino). O "Meu painel" também ignora avisos fora do destaque. Encontrado na regressão: com 8 ou mais atalhos globais, os atalhos pessoais sumiam da Inicial; agora os pessoais vêm primeiro.

---

## Phase 7: User Story 5 - Calendário institucional (P2)

**Independent Test**: "Auditoria ONA" (interno) e "Novembro Azul" aparecem com cor própria; camada liga/desliga; feriados calculados presentes; visitante não vê o interno.

- [X] T025 [P] [US5] Testes `Intranet_backend/tests/integration/test_calendario_institucional.py` e unitário `tests/unit/test_feriados.py` (Páscoa e móveis de 2025–2028, fixos), CRUD só `gerenciar_eventos`, visitante sem INTERNO, período máximo, feriado calculado não editável
- [X] T026 [US5] `Intranet_backend/app/services/feriados.py`, `app/services/calendario.py`, `app/schemas/calendario.py`, `app/routes/calendario.py`; preferência `camada_institucional` no schema de preferências
- [X] T027 [US5] Frontend: camada no mini calendário e no mês completo (faixa para campanhas, legenda, alternador lembrado) em `src/pages/eventos/lista.js` e CSS em `src/styles/pages/eventos.css`; detalhe do item sem inscrição; cadastro na gestão de eventos (`src/pages/admin/eventos/institucional.js`, rota `#/admin/calendario`). ✅ 10 testes no backend, roteiro `check-calendario` 16/16

---

## Phase 8: User Story 6 - Vagas internas (P3)

**Independent Test**: RH publica; colaborador manifesta interesse; RH vê/exporta; Leitura e chefia não veem interessados; após o prazo, botão indisponível.

- [X] T028 [P] [US6] Testes `Intranet_backend/tests/integration/test_vagas.py`: CRUD só `gerenciar_vagas`, interesse/retirada, prazo/encerrada → 409, `meu_interesse`, interessados só para gestor, CSV seguro, visitante 401, edição notifica interessados, desativado sai da lista ativa
- [X] T029 [US6] `Intranet_backend/app/schemas/vagas.py`, `app/services/vagas.py`, `app/routes/vagas.py`
- [X] T030 [P] [US6] Frontend do colaborador: mural `#/vagas` e detalhe `#/vagas/:id` em `src/pages/vagas/{mural,detalhe}.js` (filtros setor/turno, "Tenho interesse" com mensagem, desistir), item no menu
- [X] T031 [P] [US6] Gestão: `src/pages/admin/vagas/{lista,formulario,interessados}.js` (publicar, editar, encerrar, interessados e exportar). ✅ 8 testes, roteiro `check-vagas` 15/15. Decidido na implementação: demonstrar interesse exige a permissão de interagir (perfil Leitura só consulta); repetir "Tenho interesse" sem mensagem mantém a mensagem anterior.

---

## Phase 9: User Story 7 - Evidências para auditoria (P3)

**Independent Test**: PDF do trimestre para a Recepção Central com capa, sumário e três seções filtradas, gerado em < 30 s.

- [X] T032 [P] [US7] Testes `Intranet_backend/tests/integration/test_evidencias.py`: só `auditoria` (403), período > 12 meses/invertido (422), PDF válido (`%PDF`, cabeçalhos, no-store), filtra setor, seção vazia "Sem registros no período", auditoria da geração, caracteres fora do latin-1 não quebram
- [X] T033 [US7] `Intranet_backend/app/services/evidencias.py` (coleta: leituras de avisos com percentual, treinamentos com inscritos/presentes/pendentes dos obrigatórios, versões de documentos) e montagem do PDF com fpdf2 (capa, sumário, seções); rota em `app/routes/auditoria.py`
- [X] T034 [US7] Frontend: botão "Exportar evidências" com diálogo de período/setor em `src/pages/admin/auditoria/*.js` e download via `src/shared/lib/downloads.js`

---

## Phase 10: Polish & Cross-Cutting

- [X] T035 Dados de demonstração (script em scratchpad): tema obrigatório NR-32 para Recepção com turma, data institucional, vaga, aviso em revisão, tarefa com lembrete
- [X] T036 Suíte completa do backend + ruff nos arquivos alterados; roteiros de navegador novos (painel, revisão, destaque, lembrete, calendário, vagas, evidências) e todos os anteriores
- [X] T037 Auditoria axe nas telas novas/alteradas (3 temas × 2 larguras, logado e visitante) e correções
- [X] T038 READMEs dos dois repositórios (rotas, permissões novas, fluxo de revisão, lembretes, feriados, PDF) e registro da conferência neste arquivo

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T006) → histórias.
- US1 e US2 (P1) independentes entre si após a fundação; US3–US7 também independentes.
- Exceção leve: a seção de treinamentos do PDF (US7) usa presença/obrigatórios da US1 — faça US1 antes de US7.
- Dentro de cada história: testes → schemas/serviços → rotas → frontend.
- Polish depois de todas as histórias desejadas.

## Parallel Opportunities

- T002 ∥ T003–T005 (repositórios diferentes); T006 ∥ T004–T005.
- Em cada história, o teste [P] pode ser escrito junto do frontend [P] (arquivos distintos).
- US1: T007 ∥ T008; T012 ∥ T013. US2: T017 ∥ T018. US6: T030 ∥ T031.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 (Meu painel com obrigatórios/presença) → conferir com o usuário.
2. Depois US2 (revisão), que muda o fluxo de publicação — conferir de novo.
3. US3 e US4 (rápidas), US5, US6, US7 em sequência, cada uma testada sozinha.
4. Polish e conferência final; perguntar sobre commit/PRs (nunca commitar antes).

## Registro da conferência (29/10/2026)

- Backend: 483 testes passaram, 1 pulado (suíte completa). Ruff sem erros e formatação ok nos 110 arquivos Python alterados. Migração `0026` conferida com upgrade → downgrade → upgrade e `alembic check` sem diferenças.
- Navegador (Playwright): 21 roteiros, todos verdes — os novos da 003 (painel 22/22, revisão 14/14, destaque+lembrete 13/13, calendário 16/16, vagas 15/15, evidências 5/5) e todos os anteriores (001 e 002).
- axe (WCAG 2.2 A/AA): 156 combinações logadas (2 perfis × 3 temas × 2 larguras × 13 telas) e 30 de visitante, sem violações e sem rolagem horizontal.
- PDF de evidências conferido visualmente (capa, sumário com páginas, três seções).
- Corrigido durante a 003: relacionamento `Aviso.autor` ambíguo; botão "Enviar por e-mail" dos inscritos quebrando ao terminar; atalhos pessoais sumindo da Inicial com muitos globais; mensagem de interesse em vaga apagada ao repetir o clique; layout do PDF (multi_cell, página em branco, título do sumário); **submenu do gestor cortando os últimos itens** (Calendário institucional ficava inacessível); contraste da faixa de campanhas e de linhas com opacidade reduzida.

## Ajustes pedidos depois da conferência (29–30/10/2026)

- [X] T039 Documento "somente visualização": migração `0027_doc_somente_visualizacao`, `somente_visualizacao` no upload/edição, download recusado (403) para quem não gerencia documentos, `GET /documentos/{id}/conteudo` (PDF para a tela), `Storage.get`; testes `test_documento_visualizacao.py` (5)
- [X] T040 Leitor de PDF na tela (`src/shared/lib/leitor-pdf.js`, PDF.js 3.11.174) na visualização comum, na somente leitura (layout com faixa, "LEITURA APENAS" e legendas de segurança) e na prévia protegida dos restritos; CSP atualizada em `vercel.json`
- [X] T041 Inicial: abas "Não lidos"/"Todos", comunicado que se abre ao passar o mouse, carrossel só com a foto (informações e controles abaixo), cabeçalho com menos texto e a foto da fachada
- [X] T042 Conferência: roteiro `check-somente-leitura` 20/20; teste do "É hoje" corrigido para não falhar perto da meia-noite
- [X] T043 Eventos com duas fotos (banner esticado para o carrossel e capa normal), recortadas no navegador; migração `0028_eventos_banner`; carrossel sempre preenchido
- [X] T044 Parabéns com recado opcional, enviado também ao e-mail da conta do aniversariante; "abrir ao passar o mouse" na agenda, painel, eventos, documentos, vagas e mural
- [X] T045 Mural conferido contra os formulários: destaques sem foto/selos que o cadastro não tem, filtro "Notícia", 6 por página; detalhe do aviso sem a imagem que não existe
- [X] T046 Limite de vagas em todas as telas de evento (lista, calendário, carrossel e detalhe) e no formulário: valor inválido não vira mais "sem limite" e o resumo mostra o número que será gravado
- [X] T047 Controle de acesso por perfil (substitui a decisão "perfil + permissões individuais" da spec 001): matriz editável em `#/admin/acessos`, `perfil_permissoes` (migração `0029_permissoes_por_perfil`), fim de `usuario_permissoes`; roteiro `check-perfis-vagas` 19/19



## Administração (pedido depois dos PRs #5/#6)

- [X] T048 Painel de indicadores: `GET /indicadores` (permissão `ver_indicadores`) e `#/admin/indicadores` com leitura por setor, adesão aos obrigatórios, tempo de atendimento dos chamados, revisões vencendo e exportação CSV
- [X] T049 Importação de usuários por CSV com prévia e tudo ou nada (`POST /usuarios/importacao`), senha temporária por e-mail; painel "Importar planilha" em `#/admin/usuarios`
- [X] T050 Data de desligamento (migração `0030_desligamento_validade_doc`): login/token recusados no dia, desativação automática pela rotina do sino, proteção do último Admin e da reativação
- [X] T051 Validade de documentos: "Revisar até" e responsável, alertas de 30 dias, 7 dias e vencido (notificação e e-mail), `GET /documentos/validades` e seção "Revisões a vencer"
- [X] T052 Conferência: pytest 514 passaram; roteiro `check-admin-v4` 24/24 com axe; regressão dos demais roteiros
- [X] T053 Telas próprias de Importar usuários (`#/admin/importacao`) e Validade de documentos (`#/admin/validades`) no menu de Administração
- [X] T054 Controle de acesso volta a ser por pessoa (perfil + ajustes individuais), migração `0031_permissoes_por_pessoa`; pytest 512, `check-v5` 11/11, `check-admin-v4` 24/24
- [X] T055 Minhas revisões (`#/revisoes`, `GET /documentos/minhas-revisoes`, responsável envia a nova versão); sem as telas de avaliações; Meus chamados dentro do Meu painel; pytest 513, `check-v6` 11/11
- [X] T056 "Pedir avaliação" no formulário do documento, com as avaliações do documento e o status; `check-v7` 12/12
- [X] T057 Bloco de comunicados urgentes que abre e fecha na Inicial e foto opcional no aviso (migração `0032_avisos_imagem`); pytest 515, `check-v8` 19/19
