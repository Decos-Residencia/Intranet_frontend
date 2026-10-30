# Contratos da API (novos e alterados)

Todas as rotas exigem JWT (`Authorization: Bearer`). Erros seguem o formato atual do backend. Permissão exigida entre colchetes.

## Autenticação e preferências

| Método | Rota | Permissão | Mudança |
|---|---|---|---|
| GET | `/auth/me` | autenticado | **Alterada**: inclui `permissoes: string[]` (efetivas), `preferencias: {...}` |
| PUT | `/auth/me/preferencias` | autenticado | **Nova**. Corpo: objeto parcial de `preferencias` (ver data-model). Responde as preferências completas |
| PUT | `/auth/me` | `editar_perfil` | **Alterada**: aceita `ramal` (dígitos, 3–6) |

## Controle de acesso

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/acessos/permissoes` | `gerenciar_usuarios` | Catálogo: `[{codigo, rotulo, ajustavel, perfis_padrao[]}]` |
| GET | `/acessos/usuarios?busca=&perfil=&setor_id=&ativo=&page=` | `gerenciar_usuarios` | Lista paginada: `{id, nome, email, setor, perfil, ativo, ultimo_acesso_em, ajustes: [{permissao, concedida}], permissoes_efetivas[]}` |
| PUT | `/acessos/usuarios/{id}` | `gerenciar_usuarios` | Corpo: `{perfil?, ativo?, ajustes?: [{permissao, concedida \| null}]}` (`null` = volta ao padrão do perfil). 409 se afetar o último ADMIN ativo; 422 se ajustar permissão não ajustável |

## Atalhos

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/atalhos` | autenticado | Globais ativos, ordenados |
| GET | `/atalhos/todos` | `gerenciar_usuarios` | Inclui inativos |
| POST/PUT/DELETE | `/atalhos[/{id}]` | `gerenciar_usuarios` | CRUD dos globais |
| — | atalhos pessoais | autenticado | Via `PUT /auth/me/preferencias` (`atalhos`) |

## Avisos

| Método | Rota | Permissão | Mudança |
|---|---|---|---|
| GET | `/avisos` | autenticado | Já devolve `lido`; arquivados não aparecem para quem não gerencia |
| GET | `/avisos/{id}/leitores?page=` | `gerenciar_avisos` | **Nova**: `[{usuario_id, nome, setor, lido_em}]`, total |
| PUT | `/avisos/{id}` `{status: "ARQUIVADO"}` / `{status: "PUBLICADO"}` | `gerenciar_avisos` | Já existia: é o "arquivar/restaurar" do RH |
| DELETE | `/avisos/{id}` | `excluir_definitivo` | **Alterada** (antes: ADMIN/RH) |

## Eventos

| Método | Rota | Permissão | Mudança |
|---|---|---|---|
| GET | `/eventos?tipo=EVENTO\|TREINAMENTO&de=&ate=` | autenticado | **Alterada**: filtro `tipo`; itens trazem `tipo`, `visto`, `inscrito` |
| POST | `/eventos/{id}/visualizacao` | autenticado | **Nova**: marca como visto (idempotente) |
| POST | `/eventos/{id}/inscricao` | `interagir` | **Alterada**: dispara e-mail de confirmação em segundo plano |
| GET | `/eventos/{id}/inscritos.csv` | `gerenciar_eventos` | **Nova**: exportação |
| POST | `/eventos/{id}/inscritos/enviar` | `gerenciar_eventos` | **Nova**: envia a lista por e-mail ao solicitante |
| PUT | `/eventos/{id}` `{status: "CANCELADO"}` | `gerenciar_eventos` | Já existia: o RH cancela em vez de excluir |
| DELETE | `/eventos/{id}` | `excluir_definitivo` | **Alterada** |
| POST/PUT | `/eventos` | `gerenciar_eventos` | **Alterada**: campo `tipo` |

## Documentos

| Método | Rota | Permissão | Mudança |
|---|---|---|---|
| POST | `/documentos` (multipart) | `gerenciar_documentos` | **Alterada**: `descricao` obrigatória (≥10), `versao` (rótulo) e `vigente` (bool) obrigatórios |
| POST | `/documentos/{id}/versoes` (multipart) | `gerenciar_documentos` | **Nova**: `arquivo`, `rotulo`, `vigente`, `observacao?` |
| GET | `/documentos/{id}/versoes` | autenticado + acesso ao setor | **Nova**: histórico |
| PUT | `/documentos/{id}/versoes/{vid}/vigente` | `gerenciar_documentos` | **Nova**: torna vigente |
| GET | `/documentos/{id}/versoes/{vid}/download` | `baixar` | **Nova**: URL assinada (60 s) da versão |
| GET | `/documentos?incluir_antigas=false` | autenticado | **Alterada**: por padrão só vigentes |
| PUT | `/documentos/{id}` `{ativo: false}` | `gerenciar_documentos` | Já existia: o RH desativa em vez de excluir |
| DELETE | `/documentos/{id}` | `excluir_definitivo` | **Alterada** |

## Diretório, aniversariantes, chamados

| Método | Rota | Permissão | Mudança |
|---|---|---|---|
| GET | `/usuarios?busca=` | autenticado | **Alterada**: busca também por ramal e cargo |
| PUT | `/setores/{id}` | `gerenciar_usuarios` | já aceita `ramal` |
| GET | `/aniversariantes/mes` | autenticado | sem mudança (frontend passa a pedir só o mês atual) |
| GET | `/chamados/meus` | `interagir` | sem mudança (já existe); nova tela no frontend |

## Contrato de UI (frontend)

| Rota | Tela | Permissão |
|---|---|---|
| `#/admin/acessos` | Controle de acesso | `gerenciar_usuarios` |
| `#/configuracoes` | Configurações (Aparência, Acessibilidade, Atalhos) | autenticado |
| `#/chamados` | Meus chamados | `interagir` |
| `#/dashboard` | Inicial redesenhada (variante colaborador / gestor) | autenticado |

Removidos: botão `open-role` (topo e sidebar), `cycle-theme` (substituído pelo seletor), `state.previewRole`, `state.previewAniversario`.

`App.can(cap)` passa a consultar `state.user.permissoes` (servidor). Mapeamento de nomes antigos → novos fica num único objeto para não reescrever as telas.
