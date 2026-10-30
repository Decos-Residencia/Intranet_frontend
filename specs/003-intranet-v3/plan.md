# Implementation Plan: Intranet v3

**Branch**: `001-modernizacao-intranet` (mesma branch: 001/002 ainda sem commit) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-intranet-v3/spec.md`

## Summary

Sete adições inspiradas em outras intranets:
- "Meu painel" com tudo o que está pendente para a pessoa (endpoint agregado);
- fluxo de revisão de avisos e eventos (estado `EM_REVISAO` e permissão `aprovar_publicacoes`);
- prazo de destaque de avisos (calculado na consulta, sem cron);
- lembretes da Minha agenda, materializados ao consultar as notificações, com alerta do navegador;
- camada de calendário institucional, com feriados nacionais calculados;
- treinamentos obrigatórios com confirmação de presença;
- mural de vagas internas com interessados visíveis só para quem gerencia vagas;
- PDF de evidências para auditoria gerado no servidor (fpdf2).

Tudo numa única migração (`0026_intranet_v3`). As decisões estão em [research.md](research.md), o modelo em [data-model.md](data-model.md) e as rotas em [contracts/api.md](contracts/api.md).

## Technical Context

**Language/Version**: Python 3.12 (backend); JavaScript ES2020 no navegador, sem build (frontend)

**Primary Dependencies**: FastAPI 0.141, SQLAlchemy 2.0, Alembic 1.19, Pydantic 2.13; **novo: fpdf2 2.8.3** (PDF, Python puro). Frontend: Tailwind via CDN, módulos `App`/`UI`/`Pages` existentes.

**Storage**: PostgreSQL (Supabase em produção). Nenhum arquivo novo no Storage (o PDF não fica armazenado).

**Testing**: pytest de integração no PostgreSQL local (`run-tests.sh`); roteiros Playwright e axe (WCAG 2.2 A/AA) em scratchpad.

**Target Platform**: API no Render; frontend estático na Vercel; navegadores atuais, desktop e celular (375 px).

**Project Type**: aplicação web (frontend + backend em repositórios separados).

**Performance Goals**: PDF de um trimestre em < 30 s (SC-005); `GET /painel` em uma chamada; lembrete em ≤ 60 s com a intranet aberta (SC-004).

**Constraints**: sem cron nem worker (plano gratuito que dorme); sem dado pessoal para visitante; sem commit até liberação; nada de dependência de sistema (por isso fpdf2, e não WeasyPrint).

**Scale/Scope**: centenas de colaboradores; 7 histórias, ~6 telas novas/alteradas, 1 migração, ~25 rotas novas/alteradas.

## Constitution Check

Constituição do projeto não preenchida (template). Valem as regras das specs anteriores e dos READMEs, todas atendidas pelo design:
- **Permissão no servidor**: toda rota nova checa a permissão efetiva (`require_permissao`). O frontend só esconde botões.
- **LGPD**: o visitante não acessa vagas, painel, revisão, presença nem evidências. A lista de interessados fica restrita a `gerenciar_vagas`. Itens institucionais `INTERNO` ficam ocultos para o visitante.
- **Auditoria**: aprovar, devolver, confirmar presença, encerrar vaga e exportar evidências são registrados.
- **Sem cron**: destaque, agendamento e lembretes são resolvidos na consulta.
- **Acessibilidade**: as telas novas entram nos roteiros axe (3 temas × 2 larguras).

Resultado: **PASS** (antes e depois do design).

## Project Structure

### Documentation (this feature)

```text
specs/003-intranet-v3/
├── spec.md
├── plan.md            # este arquivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md           # /speckit-tasks
```

### Source Code

```text
Intranet_backend/
├── alembic/versions/0026_intranet_v3.py
├── app/core/permissoes.py                 # aprovar_publicacoes, gerenciar_vagas
├── app/models/{aviso,evento,agenda}.py    # campos novos
├── app/models/{treinamento_obrigatorio,data_institucional,vaga}.py
├── app/schemas/{painel,revisao,calendario,vagas,treinamentos,evidencias}.py
├── app/services/revisao.py                # enviar/aprovar/devolver (avisos e eventos)
├── app/services/{avisos,eventos}.py       # EM_REVISAO, destaque, presença, obrigatórios
├── app/services/agenda.py                 # lembretes (materializar)
├── app/services/feriados.py               # feriados nacionais calculados
├── app/services/{painel,calendario,vagas,evidencias}.py
├── app/routes/{painel,revisao,calendario,vagas,treinamentos}.py
├── app/routes/{avisos,eventos,agenda,notificacoes,auditoria}.py   # alterações
└── tests/integration/test_{painel,revisao,destaque,lembretes,calendario,obrigatorios,vagas,evidencias}.py

Intranet_frontend/
├── src/services/{painel,revisao,calendario,vagas,treinamentos}.service.js
├── src/pages/painel/painel.js             # #/painel
├── src/pages/vagas/{mural,detalhe}.js     # #/vagas, #/vagas/:id
├── src/pages/admin/revisao/fila.js        # #/admin/revisao
├── src/pages/admin/vagas/{lista,formulario,interessados}.js
├── src/pages/admin/treinamentos/obrigatorios.js
├── src/pages/admin/auditoria/…            # botão/diálogo "Exportar evidências"
├── src/pages/admin/noticias/formulario.js # "Enviar para revisão", destaque até
├── src/pages/admin/eventos/{formulario,lista}.js  # revisão, obrigatório, presença
├── src/pages/eventos/lista.js             # camada institucional (mini e mês)
├── src/pages/agenda/agenda.js             # lembrete + alerta do navegador
├── src/pages/configuracoes/configuracoes.js  # tela inicial "Meu painel"
└── src/shared/layout/menu.js              # Meu painel, Vagas, Revisão
```

**Structure Decision**: os mesmos dois repositórios, seguindo a organização existente (rotas → serviços → modelos no backend; páginas por rota e serviços no frontend).

## Phases (para /speckit-tasks)

1. **Fundação**: migração 0026, permissões novas, modelos e fpdf2 em `requirements/prod.txt`.
2. **US1 Meu painel** (P1): presença e obrigatórios (base do bloco de treinamentos), `GET /painel` e a tela.
3. **US2 Revisão** (P1): serviço de revisão, regras de status nas rotas, fila e formulários.
4. **US3 Destaque** (P2) e **US4 Lembretes** (P2).
5. **US5 Calendário institucional** (P2).
6. **US6 Vagas** (P3).
7. **US7 Evidências** (P3).
8. **Conferência**: suíte completa, roteiros novos e antigos, axe, READMEs e dados de demonstração.

## Complexity Tracking

| Decisão | Por quê | Alternativa mais simples rejeitada |
|---|---|---|
| Nova dependência fpdf2 | PDF de verdade, pronto para o auditor (SC-005) | "Imprimir como PDF" do navegador: varia por navegador e depende do usuário |
| Treinamento obrigatório + presença | Escolha do usuário (clarificação) e evidência de auditoria | Pendente = só inscrições futuras (evidência fraca) |
