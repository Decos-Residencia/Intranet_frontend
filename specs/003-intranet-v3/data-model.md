# Data Model: Intranet v3

Migração única: `Intranet_backend/alembic/versions/0026_intranet_v3.py` (depois de `0025_agenda_e_lembretes`). Tabelas novas com RLS ligada e sem privilégios para `anon`/`authenticated` (mesmo padrão das anteriores).

## Alterações em tabelas existentes

### avisos
| Campo | Tipo | Regra |
|---|---|---|
| status | + `EM_REVISAO` | CHECK atualizado |
| destaque_ate | timestamptz null | > `publicar_em` (ou > agora ao publicar) |
| revisao_enviada_em / revisao_enviada_por_id | timestamptz / FK usuarios null | preenchidos ao enviar |
| revisao_decidida_em / revisao_decidida_por_id | timestamptz / FK usuarios null | ao aprovar/devolver |
| revisao_motivo | varchar(500) null | obrigatório ao devolver |

### eventos
| Campo | Tipo | Regra |
|---|---|---|
| status | + `EM_REVISAO` | CHECK atualizado |
| revisao_* | igual a avisos | — |
| obrigatorio_id | FK treinamentos_obrigatorios null | só quando `tipo = TREINAMENTO` |

### evento_inscricoes
| Campo | Tipo | Regra |
|---|---|---|
| presente | bool default false | só a partir do início do evento |
| presenca_em / presenca_por_id | timestamptz / FK usuarios null | quem confirmou |

### agenda_itens
| Campo | Tipo | Regra |
|---|---|---|
| lembrete_min | smallint null | 0, 10 ou 30; exige `hora` |
| lembrete_enviado_em | timestamptz null | zerado ao mudar data/hora/lembrete; enviado no máx. 1 vez |

## Tabelas novas

### treinamentos_obrigatorios
`id`, `tema` (≤150, único entre ativos), `descricao` (≤1000), `setores_ids` (int[]), `perfis` (text[] de LEITURA/COLABORADOR/RH/ADMIN), `ativo`, `criado_por_id`, `criado_em`. É preciso ter pelo menos um setor ou um perfil.

**Pendente(usuário, tema)** = tema ativo ∧ (setor do usuário ∈ setores_ids ∨ perfil ∈ perfis) ∧ ∄ inscrição presente em evento com `obrigatorio_id = tema`.

### datas_institucionais
`id`, `titulo` (≤150), `tipo` (`FERIADO|CAMPANHA|COMEMORATIVA|AUDITORIA`), `inicio` (date), `fim` (date ≥ inicio, período ≤ 366 dias), `descricao` (≤1000 null), `publico` (`GERAL|INTERNO`, padrão `GERAL`; `AUDITORIA` é padrão `INTERNO`), `criado_por_id`, `criado_em`, `atualizado_em`.

Feriados nacionais não são gravados: são calculados (fixos: 1/1, 21/4, 1/5, 7/9, 12/10, 2/11, 15/11, 20/11, 25/12; móveis: Carnaval (segunda e terça), Sexta-feira Santa, Corpus Christi).

### vagas
`id`, `cargo` (≤150), `setor_id` (FK), `descricao` (≤3000), `requisitos` (≤3000), `turno` (`MANHA|TARDE|NOITE|DIURNO|12X36|COMERCIAL`), `prazo` (date), `status` (`ABERTA|ENCERRADA`), `criado_por_id`, `criado_em`, `atualizado_em`. "Aceita candidatura" = `ABERTA` ∧ hoje ≤ `prazo`.

### vaga_interesses
`id`, `vaga_id` (FK, cascade), `usuario_id` (FK), `mensagem` (≤500 null), `criado_em`, `retirado_em` (null). Único (`vaga_id`, `usuario_id`). Retirar marca `retirado_em`, e manifestar de novo limpa esse campo.

## Permissões novas (app/core/permissoes.py)
- `aprovar_publicacoes`: padrão ADMIN; ajustável.
- `gerenciar_vagas`: padrão RH e ADMIN; ajustável.

## Transições

```
Aviso:  RASCUNHO ─enviar→ EM_REVISAO ─aprovar→ PUBLICADO | AGENDADO
                       ↑            └devolver(motivo)→ RASCUNHO
        (aprovador)  RASCUNHO → PUBLICADO | AGENDADO   (direto, como hoje)
Evento: RASCUNHO ─enviar→ EM_REVISAO ─aprovar→ PUBLICADO ; devolver → RASCUNHO
```
Editar um conteúdo `EM_REVISAO` (autor) o mantém na fila. Se o autor não for aprovador, editar um conteúdo publicado não muda o estado (correções de publicados seguem a permissão de gerenciar, como hoje).
