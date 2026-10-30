# Implementation Plan: Modernização da Intranet Hospital Decós

**Branch**: `001-modernizacao-intranet` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-modernizacao-intranet/spec.md`

## Summary

Modernizar a intranet em fatias independentes: (1) controle de acesso por perfil + permissões individuais, com a permissão efetiva vinda do servidor e a remoção da troca de perfil do topo; (2) nova base visual "glass" com temas Claro/Escuro/Vinho/Automático e preferências de acessibilidade salvas na conta; (3) Inicial redesenhada por perfil com inscrição direta e lido/não lido; (4) melhorias de documentos (versões), aniversariantes, ramais, Meus chamados; (5) complementares (atalhos externos, leitores, arquivamento do RH, treinamento, calendário com hover, e-mail). A abordagem mantém o stack atual e reaproveita leituras, auditoria e URLs assinadas já existentes (ver [research.md](research.md)).

## Technical Context

**Language/Version**: Backend Python 3.12 · Frontend HTML5 + JavaScript (ES2020, sem build) + CSS

**Primary Dependencies**: FastAPI, SQLAlchemy 2, Alembic, PyJWT, bcrypt (backend); Tailwind CSS 3.4 via CDN, Google Fonts (Public Sans, + Atkinson Hyperlegible) (frontend)

**Storage**: PostgreSQL (Supabase como banco gerenciado) + Supabase Storage privado para arquivos de documentos

**Testing**: pytest (unit + integration, já existentes em `Intranet_backend/tests`); Playwright + Lighthouse/axe nos scripts de QA (`Intranet_frontend/docs/qa/task-01/scripts`)

**Target Platform**: Navegadores modernos (Chrome, Edge, Firefox, Safari — últimas 2 versões), desktop e celular; backend no Render, frontend na Vercel

**Project Type**: Web application (frontend SPA estática + API)

**Performance Goals**: Inicial interativa em < 2,5 s (LCP) em 4G; troca de tema/preferência instantânea (< 100 ms, sem recarregar)

**Constraints**: WCAG 2.2 AA (AAA de contraste com alto contraste ligado); CSP atual do `vercel.json` (fontes só do Google Fonts, scripts do CDN do Tailwind); sem segredos no frontend; backend continua sendo a única autoridade de permissão

**Scale/Scope**: Hospital de porte médio (centenas a poucos milhares de usuários); ~6 telas novas/redesenhadas, ~25 rotas de API novas ou alteradas, 4 migrações

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

A constituição do projeto (`.specify/memory/constitution.md`) ainda não foi preenchida. Na falta dela, aplicam-se as regras já documentadas nos READMEs dos dois repositórios:

| Regra do projeto | Status |
|---|---|
| Frontend nunca acessa o banco nem guarda segredos | ✅ Preferências e permissões passam pela API |
| Autorização sempre no backend (frontend é só UX) | ✅ Permissão efetiva calculada no servidor (FR-003a) |
| Toda ação administrativa auditada | ✅ Novas ações de auditoria listadas no data-model |
| Testes de integração por rota no backend | ✅ Cada contrato novo ganha teste em `tests/integration` |
| Sem etapa de build no frontend | ✅ Mantido (CSS com tokens, sem novas dependências JS) |

**Resultado**: PASS (pré e pós-design). Recomenda-se rodar `/speckit-constitution` depois para formalizar essas regras.

## Project Structure

### Documentation (this feature)

```text
specs/001-modernizacao-intranet/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # decisões + benchmark de intranets
├── data-model.md
├── quickstart.md        # roteiro de validação "está completo?"
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code

```text
Intranet_backend/
├── alembic/versions/
│   ├── 0020_permissoes_preferencias.py   # usuario_permissoes, usuarios.preferencias, ultimo_acesso_em
│   ├── 0021_eventos_tipo_visualizacao.py # eventos.tipo, evento_visualizacoes, inscricoes.email_enviado_em
│   ├── 0022_documento_versoes.py         # documento_versoes + migração dos arquivos atuais
│   └── 0023_atalhos.py                   # atalhos globais (o ADMIN cadastra; sem seed de URL)
                                          # arquivamento: reaproveita ARQUIVADO / ativo=false / CANCELADO
├── app/core/permissoes.py               # enum Permissao, PERFIL_PERMISSOES, efetivas(), require_permissao()
├── app/core/dependencies.py             # ContentManager/AdminUser → require_permissao
├── app/models/{usuario_permissao,atalho,documento_versao,evento_visualizacao}.py
├── app/routes/{acessos,atalhos}.py      # novas
├── app/routes/{auth,avisos,eventos,documentos,usuarios}.py  # alteradas
├── app/services/{acessos,atalhos,email}.py                  # novas
└── tests/integration/test_{acessos,preferencias,atalhos,documento_versoes,arquivamento,eventos_tipo}.py

Intranet_frontend/
├── src/styles/base/tokens-e-temas.css   # tokens glass, 3 temas + alto contraste, escala
├── src/styles/base/acessibilidade.css   # foco reforçado, sublinhado, movimento, fonte de leitura
├── src/styles/components/glass.css      # nova: superfícies translúcidas + fallback
├── src/features/aparencia.js            # seletor de tema + aplicação das preferências
├── src/features/preferencias.js         # nova: carregar/salvar preferências
├── src/app/store.js                     # can() pelas permissões do servidor; remove previewRole
├── src/shared/layout/{topbar,sidebar,menu}.js  # remove troca de perfil; novos itens de menu
├── src/pages/admin/acessos/acessos.js   # nova
├── src/pages/configuracoes/configuracoes.js  # nova
├── src/pages/chamados/meus.js           # nova
├── src/pages/dashboard/dashboard.js     # redesign por perfil
├── src/pages/aniversariantes/mes.js     # só mês atual
├── src/pages/diretorio/diretorio.js     # ramais
├── src/pages/documentos/*, admin/documentos/*  # versões
├── src/pages/eventos/lista.js           # tipo + hover no calendário
└── src/services/{acessos,atalhos,preferencias}.service.js  # novas
```

**Structure Decision**: Web application com dois repositórios existentes. A especificação vive no `Intranet_frontend`; as mudanças de backend são feitas no `Intranet_backend` em branch de mesmo nome (`001-modernizacao-intranet`).

## Ordem de entrega (fatias)

1. **Fundação de acesso (US1)** — backend de permissões + `/auth/me` com `permissoes` → frontend `can()` pelo servidor → tela Controle de acesso → remover troca de perfil. *Bloqueia US10 (arquivamento) e qualquer tela nova com permissão.*
2. **Base visual (US3 + US4)** — tokens glass, temas, preferências na conta, Configurações. *Bloqueia US2.*
3. **Pesquisa (US11)** — validar benchmark com capturas; ajustar decisões. *Em paralelo com 1 e 2.*
4. **Inicial (US2)**.
5. **P2 em paralelo**: US5 (documentos), US6 (aniversariantes), US7 (ramais), US8 (meus chamados).
6. **P3**: US9 (atalhos), US10 (leitores, arquivamento, treinamento, calendário, e-mail).

US6 e US8 são só frontend e podem ser feitas a qualquer momento como ganhos rápidos.

## Complexity Tracking

| Item | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| Tabela de ajustes de permissão | Usuário escolheu perfil + permissões individuais (opção B) | Só perfil (opção A) não atende o pedido |
| Tabela de versões de documento | Ver versão antiga e nova (FR-022/023) | Campo de texto `versao` não guarda arquivos antigos |
| Envio de e-mail (SMTP) | FR-034 | Sem alternativa; fica opcional por configuração |
