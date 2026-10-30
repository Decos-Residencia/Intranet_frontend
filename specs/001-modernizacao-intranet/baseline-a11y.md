# Linha de base de acessibilidade (antes do redesign)

**Data**: 2026-10-28 · **Ferramenta**: axe-core 4.11 via Playwright (regras WCAG 2.0/2.1/2.2 A e AA)
**Ambiente**: API local + banco de demonstração; Chromium; movimento reduzido.
**Combinações**: perfis ADMIN e COLABORADOR × temas Claro, Escuro e Vinho × larguras 1440 px e 375 px.

## Inicial (`#/dashboard`)

| Perfil | Tema | 1440 px | 375 px |
|---|---|---|---|
| ADMIN | Claro | 12 contraste · 3 alvo de toque | 12 contraste · 3 alvo · 1 botão sem nome |
| ADMIN | Escuro | 11 contraste · 3 alvo | 10 contraste · 3 alvo · 1 botão sem nome |
| ADMIN | Vinho | 8 contraste · 3 alvo | 8 contraste · 3 alvo · 1 botão sem nome |
| COLABORADOR | Claro | 11 contraste · 3 alvo | 11 contraste · 3 alvo · 1 botão sem nome |
| COLABORADOR | Escuro | 11 contraste · 3 alvo | 10 contraste · 3 alvo · 1 botão sem nome |
| COLABORADOR | Vinho | 7 contraste · 3 alvo | 7 contraste · 3 alvo · 1 botão sem nome |

Sem rolagem horizontal na Inicial. A página não tem marco `<main>` (verificado à parte).

## Controle de acesso (`#/admin/acessos`, nova)

Tem rolagem horizontal a 375 px nos três temas; corrigir na fase de acessibilidade (US4).

## Meta (SC-003 / SC-006)

Zero violações de contraste, alvo de toque e nome acessível na Inicial, no menu, nas Configurações
e no Controle de acesso, nos três temas e nas duas larguras.
