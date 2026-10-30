# Implementation Plan: Intranet v2

**Branch**: `001-modernizacao-intranet` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary

Abrir a leitura institucional sem login (dependência opcional de usuário no backend + sessão de visitante no frontend), deixar a Inicial mais lúdica e menos dispersa, agenda pessoal (tabela nova), lembrete do dia do evento (marca na inscrição), seletor de tema em menu suspenso, alça do menu, documento restrito com prévia protegida e chamados com dados completos do solicitante.

## Technical Context

Mesmo stack da 001 (FastAPI + SQLAlchemy + Alembic; HTML/Tailwind/JS sem build). Novas migrações: `0025_agenda_e_lembretes` (`agenda_itens`; `evento_inscricoes.lembrete_em`).

## Research (resumo)

Referências consultadas em 2026-10-29: [Happeo — intranet examples 2026](https://www.happeo.com/blog/intranet-examples-2026) (a Inicial concentra a maioria das visitas: priorizar padrões que resolvem uso real), [MangoApps — 16 intranet design examples](https://www.mangoapps.com/articles/16-intranet-design-examples-to-inspire-your-work-hub) (widgets de colegas, contatos importantes, lista de tarefas, links rápidos e calendário), [ThoughtFarmer — top 25 ideas](https://www.thoughtfarmer.com/blog/top-25-intranet-ideas-for-the-best-company-intranet) e [award-winning intranets](https://www.thoughtfarmer.com/get/award-winning-intranets/) (reconhecimento, selos por participação, mascotes). Decisão: adotar agora lista de tarefas (agenda), lembretes, destaque de aniversário/reconhecimento e ilustração/frase do dia; deixar selos/pontos para depois.

## Constitution Check

Sem constituição preenchida; mantidas as regras dos READMEs. Atenção especial: abrir leitura sem login NÃO pode expor dados pessoais (FR-004) — o backend decide, por rota, o que é público.

## Project Structure

```text
Intranet_backend/app/core/dependencies.py   # OptionalUser (visitante = None)
Intranet_backend/app/models/agenda.py       # AgendaItem
Intranet_backend/app/routes/agenda.py       # CRUD da agenda
Intranet_backend/app/services/{avisos,eventos,documentos,faqs,atalhos}.py  # visitante
Intranet_backend/app/services/eventos.py    # lembretes do dia
Intranet_frontend/src/app/{store,router}.js # sessão de visitante, convite ao login
Intranet_frontend/src/pages/agenda/agenda.js
Intranet_frontend/src/features/aparencia.js # menu de tema
Intranet_frontend/src/shared/layout/{sidebar,topbar,menu,quick-fab}.js
Intranet_frontend/src/pages/documentos/restrito.js
```
