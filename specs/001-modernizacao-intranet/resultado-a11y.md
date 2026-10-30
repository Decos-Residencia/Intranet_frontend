# Resultado de acessibilidade (após US1–US4 e US2)

**Data**: 2026-10-28 · **Ferramenta**: axe-core 4.11 via Playwright (WCAG 2.0/2.1/2.2 A e AA)
**Combinações**: perfis ADMIN e COLABORADOR × temas Claro, Escuro e Vinho × 1440 px e 375 px
× telas Inicial, Mural de Avisos, Eventos, Configurações e Controle de acesso (60 combinações).

| | Antes (baseline-a11y.md, só Inicial) | Depois (5 telas) |
|---|---|---|
| Contraste de cor | 7 a 12 por tema | **0** |
| Alvo de toque < 24 px | 3 | **0** |
| Botão/link sem nome | 1 (celular) | **0** |
| Campo sem rótulo | — | **0** |
| Rolagem horizontal | 0 (Inicial); 3 (Controle de acesso) | **0** |

## Verificações extras

- **Texto 200% a 320 px** (Inicial e Configurações): sem rolagem horizontal e sem violações.
- **Alto contraste + tema Escuro**: 0 falhas na regra AAA `color-contrast-enhanced` (7:1) nas Configurações.
- **Teclado**: 1º Tab = "Pular para o conteúdo", que leva o foco ao `<main>` sem mudar a rota;
  painel lateral é diálogo (`role="dialog"`, foco ao abrir, Esc fecha, foco volta a quem abriu);
  seletor de tema segue o padrão radiogroup (setas trocam a opção).

## Ainda a medir (T079/T080 no fim da feature)

- Nota Lighthouse de acessibilidade (meta ≥ 95, SC-006) — o axe acima já cobre as regras automáticas.
- Telas que ainda não foram redesenhadas (Documentos, FAQ, Diretório, Admin internas).

## Após as P2 (US5, US6, US7, US8) — 2026-10-29

Telas: Diretório, Aniversariantes, Meus chamados, Central de documentos, Visualização de documento,
Formulário de documento (gestor), Lista de documentos (gestor) e Perfil — 96 combinações.

| Regra | Resultado |
|---|---|
| Contraste | **0** (corrigida a "folha" do visualizador no tema escuro e o ícone PDF) |
| Campos sem rótulo | **0** (rótulos associados no Perfil e no formulário de documento) |
| Rolagem horizontal | **0** |

## Auditoria final (T079/T080) — 2026-10-29

**23 telas** (todas as do colaborador e as administrativas) × ADMIN e COLABORADOR × Claro, Escuro e
Vinho × 1440 px e 375 px = **276 combinações**, mais 60 de reconferência das telas administrativas.

| Regra (axe-core, WCAG 2.0/2.1/2.2 A e AA) | Resultado |
|---|---|
| Contraste de cor | **0** |
| Nome acessível (botão, link, campo, seletor) | **0** |
| Alvo de toque | **0** |
| Rolagem horizontal | **0** |

- **Teclado** (T081/FR-019): Diretório, Documentos, Meus chamados, Eventos, Aniversariantes e Perfil
  — foco sempre visível, Tab chega ao conteúdo, sem armadilha de foco (18/18).
- **Alto contraste do sistema** (FR-017): sem escolha na conta, `prefers-contrast: more` liga o alto contraste.
- **Lighthouse** (SC-006): não instalado neste ambiente; as regras automáticas que ele usa vêm do
  mesmo axe-core acima (zero violações). Recomenda-se uma rodada de Lighthouse no ambiente da equipe.
