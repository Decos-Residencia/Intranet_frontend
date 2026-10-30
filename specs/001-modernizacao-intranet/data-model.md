# Data Model: Modernização da Intranet Hospital Decós

Mudanças no banco (backend `Intranet_backend`, PostgreSQL via SQLAlchemy/Alembic). Migrações a partir de `0019_emails_recebidos`.

## Permissao (enum no código, sem tabela)

| Valor | Rótulo na UI | Perfis que têm por padrão | Ajustável por usuário |
|---|---|---|---|
| `interagir` | Interagir (chamados, inscrições, parabéns) | COLABORADOR, RH, ADMIN | sim |
| `baixar` | Baixar documentos | todos | sim |
| `editar_perfil` | Editar o próprio perfil | COLABORADOR, RH, ADMIN | sim |
| `gerenciar_avisos` | Gerenciar avisos | RH, ADMIN | sim |
| `gerenciar_documentos` | Gerenciar documentos | RH, ADMIN | sim |
| `gerenciar_faq` | Gerenciar FAQ | RH, ADMIN | sim |
| `gerenciar_eventos` | Gerenciar eventos e treinamentos | RH, ADMIN | sim |
| `gerenciar_chamados` | Atender chamados | ADMIN | sim |
| `gerenciar_avaliacoes` | Gerenciar avaliações | ADMIN | sim |
| `excluir_definitivo` | Excluir conteúdo definitivamente | ADMIN | sim |
| `gerenciar_usuarios` | Usuários, setores e acessos | ADMIN | **não** |
| `auditoria` | Ver auditoria | ADMIN | **não** |

Corresponde às caps atuais do frontend (`interact`, `download`, `edit_profile`, `manage_news`, …), que passam a vir do servidor.

## UsuarioPermissao (nova tabela `usuario_permissoes`)

| Campo | Tipo | Regra |
|---|---|---|
| id | int PK | |
| usuario_id | FK usuarios, cascade | |
| permissao | str(40) | valor de `Permissao` ajustável |
| concedida | bool | true = concede; false = retira |
| alterado_por_id | FK usuarios, set null | |
| alterado_em | timestamptz | |

Único: (usuario_id, permissao). Efetiva = permissões(perfil) ∪ {concedida=true} − {concedida=false}.
Regra: o último ADMIN ativo não pode mudar de perfil nem ser desativado.

## Usuario (alterações)

| Campo | Mudança |
|---|---|
| preferencias | **novo** JSON, default `{}` |
| ultimo_acesso_em | **novo** timestamptz nulo (atualizado no login), exibido no Controle de acesso |

Schema de `preferencias` (todas opcionais; ausente = padrão / SO):

```json
{
  "tema": "auto | light | dark | red",
  "texto": 100,            // 100 | 125 | 150 | 175 | 200
  "escala": "normal | confortavel | ampla",
  "alto_contraste": false,
  "reduzir_movimento": false,
  "reduzir_transparencia": false,
  "sublinhar_links": false,
  "foco_reforcado": false,
  "fonte_leitura": false,
  "atalhos": [ { "nome": "…", "url": "https://…", "icone": "link", "ordem": 0 } ]
}
```

Validação: `atalhos` até 12 itens, `nome` 1–40 caracteres, `url` só http/https e até 500 caracteres. Ramal: só dígitos, 3–6 caracteres.

## AtalhoGlobal (nova tabela `atalhos`)

| Campo | Tipo |
|---|---|
| id | int PK |
| nome | str(40) |
| url | str(500), http/https; ou rota interna `#/…` |
| icone | str(30) |
| ordem | int |
| ativo | bool |

Gerido por quem tem `gerenciar_usuarios`. Sem seed: o ADMIN cadastra o site oficial (a URL não foi inventada).

## Documento (alterações) e DocumentoVersao (nova tabela `documento_versoes`)

`documentos`: `descricao` passa a obrigatória na API (mín. 10 caracteres; registros antigos sem descrição continuam válidos até a próxima edição). Decisão na implementação: as colunas de arquivo (`arquivo_nome`, `storage_key`, `mime_type`, `tamanho_bytes`, `versao`) **continuam** em `documentos` espelhando a versão exibida, e `documentos.vigente` (bool) diz se ela está em vigor; o histórico completo fica em `documento_versoes`.

| Campo (documento_versoes) | Tipo | Regra |
|---|---|---|
| id | int PK | |
| documento_id | FK documentos, cascade | |
| rotulo | str(30) | ex.: "2.0" |
| vigente | bool | índice único parcial `(documento_id) WHERE vigente` |
| arquivo_nome, storage_key (único), mime_type, tamanho_bytes | | como hoje |
| observacao | text nulo | o que mudou |
| enviado_por_id | FK usuarios | |
| enviado_em | timestamptz | |

Transições: enviar versão `vigente=true` → anterior vira `vigente=false` na mesma transação. Enviar `vigente=false` → entra só no histórico. Marcar uma antiga como vigente → as outras viram antigas.

## Evento (alterações) e EventoVisualizacao (nova)

`eventos`: `tipo` str(12) `EVENTO | TREINAMENTO` (default EVENTO).
`evento_visualizacoes`: (evento_id, usuario_id) único, `visto_em`.
`evento_inscricoes`: `email_enviado_em` timestamptz nulo.

## Aviso, documento e evento: arquivamento (sem mudança de tabela)

Decisão na implementação: o RH "arquiva" com o que já existia — aviso com status `ARQUIVADO`, documento com `ativo=false`, evento `CANCELADO` — tudo já auditado. A exclusão definitiva (`DELETE`) passou a exigir a permissão `excluir_definitivo` (padrão: só ADMIN) e a auditoria da exclusão guarda uma cópia do conteúdo. `aviso_leituras` sem mudança (serve para lido/não lido e "quem leu").

## Auditoria

Sem mudança de tabela. Novas ações: `ACESSO_PERFIL_ALTERADO`, `ACESSO_PERMISSAO_ALTERADA`, `ACESSO_USUARIO_ATIVADO/DESATIVADO`, `CONTEUDO_ARQUIVADO`, `CONTEUDO_RESTAURADO`, `DOCUMENTO_VERSAO_ENVIADA`, `ATALHO_GLOBAL_ALTERADO`.
