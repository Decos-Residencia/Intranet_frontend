# TASK 01 · QA completo, auditoria UI/UX e responsividade

Auditoria executada em 23/10/2026 contra `Intranet_frontend@903b499` e `Intranet_backend@734fc32`,
com a API FastAPI real e um PostgreSQL dedicado (sem mocks).

Resultado: **aprovado com ressalvas**. 24 defeitos documentados (8 altos, 11 médios, 5 baixos),
nenhum em regra de negócio. O laudo completo, com passos de reprodução, evidências e plano de
correção, está em [`relatorio/index.html`](relatorio/index.html).

## Conteúdo

| Pasta | O que tem |
|---|---|
| `relatorio/` | Laudo em HTML e capturas de evidência (`img/`) |
| `dados/` | Resultados brutos: varredura de páginas, E2E, axe-core consolidado, navegadores, saída do pytest |
| `lighthouse/` | Relatórios do Lighthouse 12.8 (login e Início, mobile e desktop) |
| `scripts/` | Scripts para repetir a auditoria |

## Cobertura

- 684 cargas de página: 30 rotas × 4 perfis × 6 larguras (320 a 1920 px) × temas claro/escuro
- 34 casos E2E com Playwright (27 aprovados)
- axe-core 4.11 (WCAG 2.0/2.1/2.2 A e AA + boas práticas) em 276 análises
- Chromium e Firefox; WebKit não executado (dependências de sistema ausentes no WSL)
- Suíte do backend: 329/330 (a falha é o caminho errado em `tests/integration/test_perfis_rh_leitura.py:74`)

## Como repetir

Pré-requisitos: backend rodando em `http://localhost:8000` com um banco **de teste** e este
frontend servido em `http://localhost:5500` (`python3 -m http.server 5500`).

```bash
cd docs/qa/task-01/scripts
npm install                                  # playwright + @axe-core/playwright
npx playwright install chromium firefox

# massa de dados (cria setores, avisos, eventos, FAQ e usuários dos 4 perfis via API)
python seed_ui.py && python seed_users.py
# os usuários criados pelo admin precisam trocar a senha no 1º acesso; para a auditoria,
# libere-os no banco de teste: UPDATE usuarios SET must_change_password=false WHERE email LIKE '%.qa@example.com';

node audit.mjs functional   # casos E2E        → out/results_functional.json
node audit.mjs pages        # varredura        → out/results_pages.json + out/shots/
python analyze.py           # consolidação     → out/summary.json
node evidence.mjs           # capturas do laudo
node xbrowser.mjs           # smoke em Firefox/WebKit/Chromium
```

Para usar um Chromium já instalado, defina `CHR=/caminho/do/chrome`.

As credenciais nos scripts (`admin.qa@example.com`, `SenhaQA123!`) são de uma massa local
descartável. Nunca rode os scripts contra produção: eles criam e arquivam avisos.

Esta pasta fica fora do deploy da Vercel (`.vercelignore`).
