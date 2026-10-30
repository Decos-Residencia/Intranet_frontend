# Research: Intranet v3

## R1. Lembretes da agenda sem agendador

- **Decision**: Lembrete "materializado" sob demanda. Cada item da agenda guarda `lembrete_min` (0, 10 ou 30) e `lembrete_enviado_em`. Quando o dono consulta as notificações (o frontend já faz isso a cada 60 s enquanto a intranet está aberta, e sempre ao entrar), o backend cria, na mesma transação e uma única vez, a notificação de cada lembrete vencido. O frontend também agenda um alerta do navegador para os lembretes de hoje.
- **Rationale**: O backend não tem cron e roda num plano que dorme (Render). É o mesmo padrão já usado nos avisos agendados e no lembrete "É hoje" da v2. Com a intranet aberta, o atraso máximo é o intervalo da consulta (≤ 60 s, SC-004). Com ela fechada, a notificação aparece ao entrar (cenário 2 da US4).
- **Alternatives**: cron externo (custo e configuração extra no deploy); Web Push com service worker (exige chaves VAPID, HTTPS e infraestrutura nova, fora do escopo); só no navegador (perde o lembrete com a intranet fechada).

## R2. Prazo de destaque

- **Decision**: Campo `destaque_ate` (data/hora) no aviso. A regra "em destaque" é calculada na consulta (`destaque_ate IS NULL OR destaque_ate > agora`). A listagem ganha o filtro `destaque=true` e o campo `em_destaque`.
- **Rationale**: Também sem cron. Expira exatamente no horário (SC-003), sem nenhum job.

## R3. Fluxo de revisão

- **Decision**: Novo estado `EM_REVISAO` em avisos e eventos e a permissão `aprovar_publicacoes` (padrão ADMIN, ajustável). Quem não a tem só consegue `RASCUNHO` ou `EM_REVISAO`; quem a tem pode publicar direto. Aprovar leva a `PUBLICADO`, ou a `AGENDADO` (avisos) se houver `publicar_em` futuro. Devolver leva a `RASCUNHO`, com motivo obrigatório e sem o agendamento. Os metadados da revisão (`revisao_enviada_em/por`, `revisao_decidida_em/por`, `revisao_motivo`) ficam no próprio aviso ou evento; o histórico completo fica na auditoria.
- **Rationale**: Reaproveita os estados e o agendamento existentes, sem tabela nova. Uma etapa de aprovação basta (premissa da spec).
- **Alternatives**: tabela genérica de revisões (mais flexível, mas desnecessária para uma etapa só).

## R4. Treinamentos obrigatórios e presença

- **Decision**: Tabela `treinamentos_obrigatorios` (tema, descrição, setores-alvo, perfis-alvo, ativo). Cada turma é um evento do tipo `TREINAMENTO` ligado ao tema (`eventos.obrigatorio_id`). A presença fica em `evento_inscricoes` (`presente`, `presenca_em`, `presenca_por_id`). Uma pessoa está pendente num tema quando pertence ao público-alvo (setor OU perfil) e não tem presença em nenhuma turma desse tema.
- **Rationale**: Atende "vale por qualquer turma do tema" e a evidência pedida pelo auditor (inscritos × presentes), aproveitando inscrições e eventos.
- **Alternatives**: validade/reciclagem anual (útil, mas fica para a spec de validade de POPs).

## R5. Calendário institucional e feriados

- **Decision**: Tabela `datas_institucionais` (título, tipo `FERIADO|CAMPANHA|COMEMORATIVA|AUDITORIA`, `inicio` e `fim` como data, descrição, público `GERAL|INTERNO`). Os feriados nacionais são **calculados** para qualquer ano (fixos + móveis pela Páscoa: Carnaval, Sexta-feira Santa, Corpus Christi) e somados à resposta. Por isso não dependem de cadastro e valem para todos os anos. Visitante não recebe itens `INTERNO`.
- **Rationale**: "Pré-cadastrado" sem seed anual nem manutenção. Feriados locais são cadastrados como `FERIADO`.

## R6. PDF de evidências

- **Decision**: Gerado no backend com **fpdf2 2.8.3** (Python puro, sem dependência do sistema). Fonte padrão Helvetica (latin-1 cobre o português; caracteres fora dela são normalizados). O PDF é gerado sob demanda e enviado no download (`application/pdf`), sem ficar armazenado. Cada geração vai para a auditoria (`exportar_evidencias`, com os filtros). O período é limitado a 12 meses.
- **Rationale**: É um arquivo de verdade, pronto para entregar (SC-005), com dados controlados pelo servidor. O "imprimir como PDF" do navegador depende do usuário e muda conforme o navegador.
- **Alternatives**: WeasyPrint (exige Pango/Cairo no sistema, que o Render não tem por padrão); ReportLab (mais pesado e com licença dupla); jsPDF no navegador (exporia o processamento de dados de auditoria ao cliente).

## R7. Meu painel

- **Decision**: Um endpoint agregado `GET /painel`, com os cinco blocos já filtrados para o usuário (contagem e até 5 itens cada). O frontend monta a tela `#/painel`, adiciona a opção "Meu painel" em "Tela ao entrar" e um item no menu.
- **Rationale**: Uma chamada só, regras de "pendente" centralizadas no servidor e testáveis.

## R8. Vagas internas e privacidade

- **Decision**: Tabelas `vagas` e `vaga_interesses` e a permissão `gerenciar_vagas` (padrão RH e ADMIN). A lista de interessados só é exposta em rota de gestão. Para o colaborador comum, a vaga traz apenas o booleano `meu_interesse`. Nenhuma notificação vai para a chefia. A exportação usa o mesmo CSV seguro dos inscritos de eventos (`;`, BOM, fórmulas neutralizadas).
- **Rationale**: LGPD e confidencialidade do processo interno (FR-023).
