# Implementation Plan: Intranet v4 — acesso por perfil, funcionalidades liberáveis, ramal por setor e inscrição externa

**Branch**: `feat/acesso-perfil-funcionalidades` (backend e frontend, a partir da `main` de 2026-11-01) | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

## Summary

Volta o controle de acesso só por perfil (reaproveita a matriz da 0029, que existiu entre 29 e 30/10), cria as funcionalidades liberáveis por perfil/visitante, fecha as lacunas de auditoria (G2–G4), mostra a central de documentos a quem gerencia documentos, organiza os ramais por setor (só o ADMIN altera) e adiciona o modo de inscrição dos eventos (intranet, link externo, nenhuma).

## Technical Context

**Backend**: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL (Supabase em produção). **Frontend**: SPA em JavaScript puro (hash router, `App`/`UI`/`Services`), Tailwind via CDN. **Testes**: pytest (unitários + integração com PostgreSQL `postgres-test`/`decos_test`). **Restrições**: WCAG 2.2 AA, LGPD (auditoria sem copiar dados pessoais), RLS habilitado em toda tabela nova, nada commitado sem conferência.

## Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Acesso | Tabela `perfil_permissoes` (sem linha para ADMIN), `usuario_permissoes` removida (migração `0035`, que reaproveita a `0029`) | Mesma estrutura já testada; o código revertido do commit `c21b44e` (backend) e `16e1cd8` (frontend) volta quase sem mudança |
| Funcionalidades | Tabela `funcionalidades(codigo, ligada_para JSON)`, sem linha = ligado para todos; dependência de router `funcionalidade_ligada(F)` responde 403 `FUNCIONALIDADE_DESATIVADA` | Uma checagem por router cobre consulta e gestão; nenhuma mudança de comportamento na entrada da versão |
| Notificações | Filtro central em `notificacoes.notificar` pelo `tipo` (agenda, aniversario, chamado, evento, vaga) | Um ponto só cobre todos os envios automáticos |
| Diretório | `GET /usuarios` exige o módulo, exceto para quem gere usuários | As telas de administração usam a mesma lista |
| Ramal | Ramal individual mantido; sai só `PUT /auth/me/ramal` (só o ADMIN altera); Diretório abre por setor; chamados usam o ramal do setor quando a pessoa não tem o seu | Decisão do responsável em 2026-11-01: nada é apagado |
| Eventos | `eventos.inscricao` (`INTRANET`/`EXTERNA`/`NENHUMA`) + `inscricao_url` com checks no banco (`0038`); turma de obrigatório só `INTRANET` | Regra garantida também fora da API |
| Auditoria | `exportar_inscritos`, `exportar_interessados`, `reenviar_email`, `funcionalidade`, `inscricao_evento`, `permissao` (perfil); só contagens, nunca os dados | LGPD |
| Frontend | `App.ligada(modulo)`, `App.rotaLigada(rota)` e o mapa rota → módulo em `store.js`; o router, o menu e os atalhos filtram por ele; relê `/auth/me` a cada navegação (no máximo a cada 30 s) | Um lugar só decide o que aparece |

## Project Structure

```text
Intranet_backend/
├── alembic/versions/0036_acesso_por_perfil.py, 0037_funcionalidades.py,
│   0038_eventos_inscricao_externa.py
├── app/core/funcionalidades.py (catálogo), permissoes.py, dependencies.py
├── app/models/perfil_permissao.py, funcionalidade.py, evento.py, usuario.py
├── app/routes/funcionalidades.py, acessos.py (+ dependência nos routers dos módulos)
├── app/services/funcionalidades.py, acessos.py, eventos.py, vagas.py, email_outbox.py, …
└── tests/integration/test_funcionalidades.py, test_eventos_inscricao_externa.py,
    test_auditoria_exportacoes.py (+ ajustes de ramal)

Intranet_frontend/
├── src/app/store.js, router.js, routes.js, actions.js
├── src/services/funcionalidades.service.js, acessos.service.js
├── src/pages/admin/acessos/acessos.js (matriz), funcionalidades.js (nova)
├── src/shared/layout/menu.js, src/shared/ui/acesso-rapido.js
└── src/pages/{dashboard,painel,diretorio,perfil,eventos,admin/eventos,admin/auditoria,admin/usuarios}/…
```

## Verificação

- `pytest` completo com PostgreSQL de teste.
- Roteiro Playwright contra API e front locais: menus de visitante e dos 4 perfis, agenda desligada/religada pela tela, matriz do RH valendo na hora, link externo visível ao visitante.
