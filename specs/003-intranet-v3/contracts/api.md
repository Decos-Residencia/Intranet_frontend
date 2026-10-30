# API Contract: Intranet v3

Erros no padrão atual (`{"detail": ...}`). 401 sem login, 403 sem permissão, 404 para itens que a pessoa não pode ver.

## Meu painel
- `GET /painel` (logado) → `{avisos_nao_lidos: {total, itens[≤5]}, treinamentos_pendentes: {total, itens[{tema_id, tema, proxima_turma: Evento|null}]}, chamados_abertos: {total, itens}, agenda_hoje: {total, feitos, itens}, proximos_eventos: {total, itens}}`

## Revisão de publicações
- `POST /avisos` e `POST /eventos`: um autor sem `aprovar_publicacoes` só pode usar `status ∈ {RASCUNHO, EM_REVISAO}`. Qualquer outro valor → 403.
- `POST /avisos/{id}/revisao` e `POST /eventos/{id}/revisao` (autor ou gestor): envia para revisão → `EM_REVISAO`. Notifica os aprovadores. Sem aprovador ativo → 409 com mensagem.
- `POST /avisos/{id}/aprovar`, `POST /eventos/{id}/aprovar` (`aprovar_publicacoes`) → PUBLICADO ou AGENDADO. Notifica o autor e audita.
- `POST /avisos/{id}/devolver`, `POST /eventos/{id}/devolver` (`aprovar_publicacoes`) com corpo `{motivo: 5..500}` → RASCUNHO e limpa `publicar_em`. Notifica o autor com o motivo e audita.
- `GET /revisao` (`aprovar_publicacoes`) → fila `[{tipo: "aviso"|"evento", id, titulo, autor, enviado_em, previa}]`.
- Listagens públicas e de colaborador nunca devolvem `EM_REVISAO`.

## Prazo de destaque
- Aviso: o campo `destaque_ate` aparece na criação/edição e na leitura. A leitura também traz `em_destaque: bool`.
- `GET /avisos?destaque=true` → só os que estão em destaque (usado pela Inicial).
- `destaque_ate` que não for posterior à publicação → 422.

## Agenda: lembretes
- `POST/PUT /agenda` aceitam `lembrete_min ∈ {null, 0, 10, 30}`. Sem `hora` → 422.
- `GET /notificacoes` materializa antes os lembretes vencidos do usuário (tipo `agenda`, rota `#/agenda/AAAA-MM-DD`), uma vez por item.
- `GET /agenda/lembretes?data=hoje` → `[{id, texto, dispara_em}]` (para o alerta do navegador).

## Calendário institucional
- `GET /calendario-institucional?de=AAAA-MM-DD&ate=AAAA-MM-DD` (público; o visitante não recebe `INTERNO`) → `[{id|null, titulo, tipo, inicio, fim, descricao, publico, calculado: bool}]`. Período máximo de 400 dias.
- `POST /calendario-institucional`, `PUT/DELETE /calendario-institucional/{id}` (`gerenciar_eventos`). Feriados calculados não são editáveis.

## Treinamentos obrigatórios e presença
- `GET /treinamentos-obrigatorios` (`gerenciar_eventos`), `POST`, `PUT /{id}`, `DELETE /{id}` (desativa se houver turmas).
- `PUT /eventos/{id}` aceita `obrigatorio_id` (só em `TREINAMENTO`).
- `PUT /eventos/{id}/presencas` (`gerenciar_eventos`) com `{presentes: [usuario_id], ausentes: [usuario_id]}` → 409 antes do início do evento. Audita.
- `GET /eventos/{id}/inscritos` passa a trazer `presente`.

## Vagas internas
- `GET /vagas?setor_id=&turno=&abertas=true` (logado) → itens com `meu_interesse: bool` e `aceita_candidatura`. Sem lista de interessados.
- `GET /vagas/{id}` (logado).
- `POST /vagas/{id}/interesse` com `{mensagem?}` e `DELETE /vagas/{id}/interesse` (logado, enquanto aceita candidatura; fora disso → 409).
- `POST /vagas`, `PUT /vagas/{id}`, `POST /vagas/{id}/encerrar` (`gerenciar_vagas`). Editar com interessados notifica esses interessados.
- `GET /vagas/{id}/interessados` e `GET /vagas/{id}/interessados.csv` (`gerenciar_vagas`).

## Evidências para auditoria
- `GET /auditoria/evidencias.pdf?de=AAAA-MM-DD&ate=AAAA-MM-DD&setor_id=` (`auditoria`) → `application/pdf` (`Content-Disposition: attachment; filename="evidencias-<de>-<ate>.pdf"`, `Cache-Control: no-store`). Período maior que 12 meses ou `de > ate` → 422. Registra `exportar_evidencias` na auditoria.

## Preferências
- `tela_inicial` aceita também `painel`. Nova preferência `camada_institucional: bool` (padrão ligada).
