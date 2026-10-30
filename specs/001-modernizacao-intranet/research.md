# Research: Modernização da Intranet Hospital Decós

**Feature**: 001-modernizacao-intranet · **Data**: 2026-10-28

## 1. Benchmark de intranets (insumo da US11 / FR-035)

Referências analisadas a partir de material público dos produtos (sites, documentação e demonstrações). **A equipe deve validar com capturas de tela atuais antes de fechar o design** (tarefa de pesquisa no tasks.md).

| Referência | Tipo | Inicial | Navegação | Avisos | Eventos | Documentos | Diretório | Acessibilidade / personalização |
|---|---|---|---|---|---|---|---|---|
| Microsoft Viva Connections / SharePoint | Plataforma corporativa | Painel de cartões por perfil ("dashboard") + feed | Barra global + menu do site | Notícias com contagem de visualizações | Web part de eventos com calendário | Biblioteca com histórico de versões e "check-in/out" | Pessoas + organograma | Temas do site, respeita configurações do SO |
| Staffbase | Comunicação interna | Feed personalizado por público | Menu lateral enxuto | "Leitura obrigatória" com confirmação e relatório de quem leu | Eventos com RSVP no próprio cartão | Pages/arquivos | Diretório com busca | App acessível, foco em mobile |
| Simpplr | Intranet moderna | Inicial personalizável, "must reads" no topo | Busca global como centro | Must read + analytics por post | Eventos com RSVP | Gestão de validade de conteúdo ("content governance") | Perfis ricos, "ask an expert" | Personalização da Inicial por usuário |
| LumApps | Intranet Google/Microsoft | Widgets por público-alvo | Barra superior + sub-sites | Notificação de leitura obrigatória | Calendário integrado | Integra Drive/SharePoint, versões | Diretório com campos customizados | Atalhos ("app launcher") configuráveis |
| Unily / Haiilo / Workvivo | Plataformas de engajamento | Hero visual + atalhos + feed | Mega-menu ou menu lateral | Reações, alcance por aviso | Eventos com inscrição e lembrete | Documentos com dono e revisão | Diretório | Modo escuro, tamanho de fonte |
| Intranets hospitalares (padrão observado em hospitais de grande porte) | Saúde | Acesso rápido a sistemas (prontuário, escala, ponto) em destaque | Poucos itens, por tarefa | Comunicados com ciência obrigatória | Treinamentos/educação continuada separados de eventos | POPs/protocolos com versão vigente e controle de validade | Ramais por setor muito usados | Alto contraste e texto grande (uso em plantão, telas compartilhadas) |

### Decisões a partir do benchmark

| Recurso | Decisão | Motivo |
|---|---|---|
| Inicial por perfil (colaborador x gestor) | **Adotar agora** (US2) | Padrão em Viva/Simpplr; resolve a poluição do admin |
| "Não lido" e contagem/lista de leitores | **Adotar agora** (US2, US10) | Staffbase/Simpplr; já temos leituras registradas |
| Inscrição no próprio cartão (RSVP) | **Adotar agora** (US2) | Todos os produtos fazem; reduz cliques |
| Acesso rápido a sistemas externos, configurável | **Adotar agora** (US9) | Padrão hospitalar e LumApps |
| Versão vigente x obsoleta de POP | **Adotar agora** (US5) | Exigência de qualidade hospitalar (acreditação) |
| Treinamento separado de evento | **Adotar agora** (US10) | Educação continuada é tratada à parte em hospitais |
| Ramais por setor + copiar | **Adotar agora** (US7) | Uso intenso no hospital |
| Tamanho de fonte, alto contraste, modo escuro | **Adotar agora** (US3, US4) | Telas compartilhadas e plantão noturno |
| "Ciência obrigatória" (confirmar leitura) | **Depois** | Exige fluxo novo; leitura simples atende agora |
| Validade/revisão periódica de documento | **Depois** | Útil para POPs, mas fora do pedido atual |
| Busca global como centro da Inicial | **Depois** | Já existe busca; reavaliar no redesign das demais telas |
| Feed social com reações e comentários | **Descartar** | Moderação custosa; não pedido |
| Chat | **Descartar** | Removido do escopo pelo usuário |

## 2. Linguagem visual "estilo Apple" com acessibilidade

- **Decision**: superfícies "glass" via `backdrop-filter: blur() saturate()` sobre fundo com cor de tema, com opacidade do preenchimento entre 0,72 e 0,85 (não menos), borda de 1 px semitransparente e sombra suave; tokens CSS por tema em `tokens-e-temas.css`. Fallback `@supports not (backdrop-filter: ...)` → fundo sólido. `prefers-reduced-transparency` e a preferência "Reduzir transparência" → sólido.
- **Rationale**: opacidade alta preserva o contraste exigido (SC-003) porque o texto nunca fica sobre fundo variável sem uma camada quase opaca; segue as Human Interface Guidelines (materials + vibrancy) sem depender de imagem de fundo.
- **Alternatives**: glass com opacidade baixa (0,3–0,5) — descartado: contraste imprevisível; imagens de fundo desfocadas — descartado: peso e contraste.

## 3. Temas e preferências salvos na conta

- **Decision**: nova coluna `preferencias` (JSON) em `usuarios`, lida em `GET /auth/me` e gravada por `PUT /auth/me/preferencias`. O frontend aplica antes da renderização a partir de cópia em `localStorage` (evita "piscar") e depois sincroniza com o servidor.
- **Rationale**: atende FR-013/FR-018 (vale em qualquer dispositivo) sem tabela extra; o conjunto de chaves é pequeno e validado por schema.
- **Alternatives**: tabela chave/valor — mais complexa sem ganho; só `localStorage` — não atende "outro dispositivo".

## 4. Escala de texto e interface

- **Decision**: `font-size` do `<html>` em percentual (100–200%) e variável `--ui-scale` para espaçamentos/alvos de toque; garantir unidades `rem` nos componentes alterados. Fonte de leitura facilitada: Atkinson Hyperlegible (Google Fonts, já permitido pelo CSP de fontes).
- **Rationale**: o Tailwind usa `rem`, então o zoom pelo `<html>` escala tudo de forma consistente.
- **Alternatives**: `zoom` CSS — comportamento inconsistente entre navegadores.

## 5. Permissões: perfil + ajustes individuais

- **Decision**: catálogo fixo de permissões no backend (enum `Permissao`), mapa `PERFIL → permissões` no código, tabela `usuario_permissoes(usuario_id, permissao, concedida bool)`. Permissão efetiva = perfil ∪ concedidas − retiradas. `GET /auth/me` devolve `permissoes: [...]` e o frontend passa a usar essa lista em `App.can()` (deixa de usar a matriz local `DB.roles`). Dependência nova `require_permissao("gerenciar_eventos")` substitui `ContentManager` nas rotas. `gerenciar_usuarios` e `auditoria` não aceitam ajuste (só perfil ADMIN).
- **Rationale**: atende FR-003/FR-003a com uma fonte de verdade no servidor; migração preserva o comportamento atual (sem ajustes = permissões do perfil).
- **Alternatives**: perfis personalizados (opção C) — rejeitado pelo usuário; permissões só no frontend — inseguro.

## 6. Versionamento de documentos

- **Decision**: tabela `documento_versoes` (documento_id, rotulo, vigente, storage_key, arquivo_nome, mime, tamanho, enviado_por, enviado_em). O `documentos` mantém metadados e aponta a versão vigente. Migração cria uma versão por documento existente a partir das colunas atuais. Índice parcial único garante no máximo uma vigente por documento.
- **Rationale**: atende FR-022/SC-009 e preserva o fluxo de URL assinada já existente.
- **Alternatives**: versionamento do Storage — não expõe rótulo nem autor.

## 7. Arquivamento (RH) e histórico

- **Decision (revista na implementação)**: reaproveitar os estados que já existiam — aviso `ARQUIVADO`, documento `ativo=false`, evento `CANCELADO` — em vez de colunas novas; `DELETE` exige a permissão `excluir_definitivo` (padrão ADMIN). Histórico usa a auditoria existente (`auditoria.registrar`) com cópia sanitizada do conteúdo excluído.
- **Rationale**: mesmo efeito para o usuário (o RH some com o conteúdo sem destruí-lo; restaurar = republicar/ativar/reativar), sem migração e sem duplicar regras já testadas.
- **Rationale**: reaproveita auditoria já testada; não cria segundo log.

## 8. E-mail de inscrição

- **Decision (revista na implementação)**: API HTTP do Resend (o projeto já usa Resend para e-mails recebidos), configurada por `RESEND_API_KEY` e `EMAIL_FROM`; envio em `BackgroundTasks` com até 3 tentativas; sem configuração, o envio vira só registro no log.
- **Rationale**: não bloqueia a inscrição (edge case) e não exige fila externa agora.
- **Alternatives**: fila (Celery/RQ) — infraestrutura extra no Render free; Supabase Auth e-mail — só serve para auth.

## 9. Lido/não lido em eventos

- **Decision**: tabela `evento_visualizacoes` (evento_id, usuario_id, visto_em) análoga a `aviso_leituras`; listagens devolvem `visto: bool`.

## 10. Riscos técnicos identificados

- A cadeia de migrações é linear (`0001` → `17f18492bcbe` → `0003` … `0018_perfis_rh_leitura`); a última é `0019_emails_recebidos`; as novas partem dela (`0020`…`0023`)
- O Tailwind via CDN gera classes em tempo de execução; os novos estilos de vidro e escala ficam em CSS próprio com tokens, não em classes utilitárias novas.
- A troca de perfil de pré-visualização (`previewRole`, `previewAniversario`) é usada em testes de QA; a remoção precisa atualizar os scripts de `docs/qa/task-01/scripts`.
