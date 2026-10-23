# TASK 01 · QA completo, auditoria UI/UX e responsividade

Auditoria executada em 23/10/2026 contra `Intranet_frontend@903b499` e `Intranet_backend@734fc32`,
com a API FastAPI real e um PostgreSQL dedicado (sem mocks). Revisão 2 do laudo.

Resultado: **aprovado com ressalvas**. 30 defeitos documentados (9 altos, 15 médios, 6 baixos),
nenhum em regra de negócio. O laudo completo, com passos de reprodução, evidências, causa no
código e plano de correção, está em `relatorio/index.html`. O GitHub mostra o código-fonte do
HTML; para ver o laudo, abra o arquivo no navegador a partir de um clone.

## Conteúdo

| Pasta | O que tem |
|---|---|
| `relatorio/` | Laudo em HTML e capturas de evidência (`img/`) |
| `dados/` | Resultados brutos: varredura de páginas, E2E, rodada exploratória, axe-core consolidado, navegadores, resumo do pytest |
| `lighthouse/` | Relatórios do Lighthouse 12.8 (login e Início, mobile e desktop) |
| `scripts/` | Scripts para repetir a auditoria (versões fixas em `package-lock.json`) |

## Cobertura

- 684 cargas de página: 30 rotas × 4 perfis × 6 larguras (320 a 1920 px) × temas claro/escuro
- 262 análises axe-core 4.11 (WCAG 2.0/2.1/2.2 A e AA + boas práticas)
- 29 casos E2E + 5 verificações complementares (27 aprovados) e 24 verificações exploratórias
- Chromium e Firefox; WebKit não executado (dependências de sistema ausentes no WSL)
- Backend: 331 testes coletados, 329 de 330 executados aprovados; a falha é o caminho errado em
  `tests/integration/test_perfis_rh_leitura.py:74`

## Como repetir

**Nunca rode contra produção.** Os scripts criam avisos, eventos, FAQ, setor, chamado e usuários,
inscrevem pessoas em eventos e desativam/reativam um usuário. Use um banco descartável.

1. Backend em `http://localhost:8000` com banco de teste, `APP_ENV=development` e o admin do seed
   com as credenciais abaixo (ou ajuste as variáveis):

   ```env
   SEED_ENABLED=true
   SEED_ADMIN_EMAIL=admin.qa@example.com
   SEED_ADMIN_PASSWORD=SenhaQA123!
   CORS_ORIGINS=["http://localhost:5500"]
   ```

2. Frontend servido em `http://localhost:5500` (na raiz do repositório: `python3 -m http.server 5500`).

3. Dependências e massa de dados (os scripts Python usam `httpx`):

   ```bash
   cd docs/qa/task-01/scripts
   npm ci                                   # Playwright 1.56.1 + @axe-core/playwright 4.11.0
   npx playwright install chromium firefox
   python3 seed_ui.py && python3 seed_users.py   # idempotentes: podem rodar de novo
   ```

4. Usuários criados pelo admin começam com troca de senha obrigatória. Libere todos **menos o
   `jp.qa`**, que o caso F23 usa para testar o primeiro acesso:

   ```sql
   UPDATE usuarios SET must_change_password = false
   WHERE email LIKE '%.qa@example.com' AND email <> 'jp.qa@example.com';
   ```

5. Execução (as saídas vão para `scripts/out/`, ignorada pelo git):

   ```bash
   npm run e2e            # casos F01–F24      → out/results_functional.json
   npm run varredura      # 684 cargas (~25 min) → out/results_pages.json + out/shots/
   npm run resumo         # consolida a varredura → out/summary.json
   npm run exploratorio   # E01–E15 (~4 min)    → out/explore/
   npm run evidencias     # capturas focadas     → out/evidencias/
   npm run navegadores    # smoke em Firefox, WebKit e Chromium
   ```

Variáveis opcionais: `QA_ADMIN_EMAIL`, `QA_SENHA`, `QA_API` (scripts Python) e `CHR` (caminho de
um Chromium já instalado). Os casos podem ser repetidos: o F24 tenta só uma senha fraca, então o
`jp.qa` continua com troca obrigatória. O E12b provoca o bloqueio de login (5 falhas em 15 min)
com um e-mail inexistente (`bloqueio.qa@example.com`), sem travar os usuários da massa.

Esta pasta fica fora do deploy da Vercel (`/docs/` no `.vercelignore` da raiz).
