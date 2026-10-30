# Feature Specification: Intranet v3 — vagas internas, painel pessoal, calendário institucional e governança da comunicação

**Feature Branch**: `001-modernizacao-intranet` (mesma branch: 001 e 002 ainda não foram commitadas)

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Itens escolhidos da lista de adições inspirada em outras intranets: (17) mural de vagas internas; (26) avisos com prazo de exibição; (30) calendário institucional (feriados, campanhas do mês, semana da enfermagem, datas de auditoria) numa camada separada dos eventos; (31) 'Meu painel' pessoal com treinamentos pendentes, avisos para ler, chamados abertos e próximos compromissos; (33) lembretes na hora marcada para as tarefas da Minha agenda; (37) aprovação de publicações (RH escreve, comunicação/ADMIN aprova antes de publicar); (39) exportação em PDF de evidências para auditoria (leituras de avisos, inscrições/presenças em treinamentos, versões de POP). Respeitar: leitura institucional sem login, perfil + permissões individuais, LGPD, WCAG 2.2 AA."

## Clarifications

### Session 2026-10-29

- Q: No "Meu painel", o que conta como treinamento pendente? → A: Treinamentos marcados como obrigatórios para o setor e/ou perfil da pessoa que ela ainda não concluiu (presença confirmada).
- Q: Na exportação para auditoria, como entram os treinamentos? → A: Inscritos e presença confirmada pelo organizador (lista de presença na gestão do evento).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Meu painel (Priority: P1)

O colaborador logado tem uma tela "Meu painel" que reúne, num lugar só, o que depende dele: avisos ainda não lidos, treinamentos pendentes, chamados em aberto (com o último status), as tarefas de hoje da Minha agenda e os próximos eventos em que está inscrito. Cada bloco mostra a contagem e leva direto ao item.

**Why this priority**: Concentra o que o colaborador precisa fazer; é o item que mais reduz cliques e esquecimentos e aproveita dados que já existem.

**Independent Test**: Com um colaborador da Recepção que tem 2 avisos não lidos, 1 treinamento obrigatório para a Recepção sem presença, 1 chamado em análise, 1 tarefa hoje e 1 inscrição futura, abrir "Meu painel" e conferir as contagens e os atalhos de cada bloco.

**Acceptance Scenarios**:

1. **Given** um colaborador com avisos não lidos, chamados abertos, tarefas de hoje e inscrições futuras, **When** abre "Meu painel", **Then** vê cada bloco com a contagem correta e pode ir a cada item em um clique.
2. **Given** um bloco sem pendências, **When** o painel abre, **Then** o bloco mostra uma mensagem positiva ("Tudo em dia") em vez de ficar vazio.
3. **Given** um visitante sem login, **When** tenta abrir "Meu painel", **Then** fica na Inicial com o convite para entrar (regra da v2).
4. **Given** um colaborador que lê um aviso pendente, **When** volta ao painel, **Then** a contagem de avisos diminui.
5. **Given** um treinamento obrigatório para o setor da pessoa, **When** o organizador confirma a presença dela numa turma, **Then** o treinamento sai dos pendentes do painel.

---

### User Story 2 - Aprovação de publicações (Priority: P1)

Quem escreve avisos e eventos sem permissão de aprovação (ex.: RH) envia o conteúdo "para revisão" em vez de publicá-lo. Quem tem a permissão de aprovar (por padrão, ADMIN; pode ser concedida a outras pessoas no Controle de acesso) vê a fila de revisão, lê, aprova (publica na hora ou na data agendada) ou devolve com um comentário obrigatório. O autor é notificado do resultado.

**Why this priority**: Governança da comunicação: evita aviso com erro publicado para o hospital inteiro; muda o fluxo de publicação existente.

**Independent Test**: Como RH, criar um aviso e enviar para revisão; como ADMIN, devolver com comentário; como RH, corrigir e reenviar; como ADMIN, aprovar; conferir que só depois disso o aviso aparece para colaboradores e visitantes.

**Acceptance Scenarios**:

1. **Given** um autor sem permissão de aprovar, **When** salva um aviso ou evento, **Then** as opções são "Salvar rascunho" e "Enviar para revisão" (não há "Publicar").
2. **Given** um conteúdo em revisão, **When** um colaborador ou visitante consulta avisos/eventos, **Then** o conteúdo não aparece.
3. **Given** um aprovador, **When** aprova um conteúdo com data agendada, **Then** ele é publicado na data; sem data, é publicado na hora.
4. **Given** um aprovador, **When** devolve um conteúdo, **Then** precisa escrever o motivo, o conteúdo volta a rascunho e o autor recebe notificação com o motivo.
5. **Given** um aprovador que escreve o próprio aviso, **When** salva, **Then** pode publicar direto (não precisa aprovar a si mesmo).
6. **Given** qualquer aprovação ou devolução, **When** se consulta a auditoria, **Then** consta quem aprovou/devolveu e quando.

---

### User Story 3 - Avisos com prazo de exibição (Priority: P2)

Ao publicar um aviso, o autor pode definir "Exibir em destaque até" (data). Depois dessa data o aviso sai sozinho da Inicial e do topo do mural, sem precisar de alguém arquivar, mas continua acessível no histórico de avisos e pela busca.

**Why this priority**: Resolve a Inicial "presa" em avisos velhos com mudança pequena.

**Independent Test**: Publicar um aviso com destaque até ontem e outro até amanhã; conferir que só o segundo aparece na Inicial e que o primeiro continua abrindo pelo link e no histórico.

**Acceptance Scenarios**:

1. **Given** um aviso com destaque vencido, **When** a Inicial abre, **Then** ele não aparece entre os destaques nem conta como "não lido" na Inicial.
2. **Given** um aviso com destaque vencido, **When** alguém abre o link dele ou o histórico, **Then** o aviso abre normalmente, marcado como "fora do destaque".
3. **Given** um aviso sem prazo, **When** passa o tempo, **Then** continua em destaque como hoje.
4. **Given** um prazo anterior à data de publicação, **When** o autor salva, **Then** recebe uma mensagem de erro clara.

---

### User Story 4 - Lembretes da Minha agenda (Priority: P2)

Ao criar ou editar uma tarefa com horário na Minha agenda, o colaborador pode ativar um lembrete (na hora, 10 min antes ou 30 min antes). No momento do lembrete, recebe uma notificação na intranet e, se permitir no navegador, um alerta do sistema.

**Why this priority**: Completa a agenda da v2, que hoje só organiza.

**Independent Test**: Criar uma tarefa para daqui a 2 minutos com lembrete "na hora"; esperar e conferir a notificação no sino (e o alerta do navegador quando permitido).

**Acceptance Scenarios**:

1. **Given** uma tarefa com horário e lembrete, **When** chega a hora do lembrete com a intranet aberta, **Then** aparece a notificação com o texto da tarefa e link para a agenda.
2. **Given** a intranet fechada na hora do lembrete, **When** o colaborador entra depois, **Then** encontra a notificação no sino.
3. **Given** uma tarefa marcada como feita antes da hora, **When** chega a hora, **Then** nenhum lembrete é enviado.
4. **Given** uma tarefa sem horário, **When** o colaborador tenta ativar lembrete, **Then** a opção fica indisponível com a explicação "defina um horário".
5. **Given** o colaborador não permitiu alertas do navegador, **When** chega a hora, **Then** a notificação da intranet acontece normalmente.

---

### User Story 5 - Calendário institucional (Priority: P2)

O calendário de Eventos ganha uma camada "Institucional" com feriados, campanhas de saúde do mês (Outubro Rosa, Novembro Azul etc.), datas comemorativas (Semana da Enfermagem) e datas de auditoria/acreditação. A camada pode ser ligada/desligada e tem cor própria; os itens não aceitam inscrição. Quem gerencia eventos cadastra e edita essas datas; feriados nacionais já vêm cadastrados.

**Why this priority**: Organiza o ano do hospital sem misturar com eventos com inscrição.

**Independent Test**: Cadastrar "Auditoria ONA" num dia e "Novembro Azul" no mês inteiro; conferir no calendário as duas marcações com a cor da camada, desligar a camada e ver que somem; conferir um feriado nacional já presente.

**Acceptance Scenarios**:

1. **Given** datas institucionais no mês, **When** alguém abre Eventos, **Then** elas aparecem no mini calendário e no mês completo com cor e legenda próprias.
2. **Given** uma campanha de período (mês inteiro), **When** o calendário mostra o mês, **Then** a campanha aparece como faixa/selo do período, sem poluir cada dia.
3. **Given** a camada desligada, **When** o calendário é exibido, **Then** só aparecem eventos e treinamentos (a escolha é lembrada).
4. **Given** um visitante, **When** abre Eventos, **Then** também vê a camada institucional, exceto itens marcados como "interno" (ex.: data de auditoria).
5. **Given** um item institucional, **When** é aberto, **Then** mostra título, período, descrição e não oferece inscrição.

---

### User Story 6 - Mural de vagas internas (Priority: P3)

O RH publica vagas internas (cargo, setor, requisitos, turno, prazo de candidatura). O colaborador logado vê o mural, filtra por setor/turno e clica em "Tenho interesse", podendo incluir uma mensagem curta. Só o RH (e quem tiver a permissão de gerir vagas) vê quem demonstrou interesse; a chefia atual do colaborador não é avisada.

**Why this priority**: Valoriza o crescimento interno, mas não é crítico para a rotina.

**Independent Test**: Como RH, publicar uma vaga com prazo; como colaborador, demonstrar interesse; como RH, ver a lista de interessados e exportar; após o prazo, conferir que o botão fica indisponível.

**Acceptance Scenarios**:

1. **Given** uma vaga aberta, **When** o colaborador clica em "Tenho interesse", **Then** recebe confirmação e pode desistir enquanto a vaga estiver aberta.
2. **Given** um colaborador interessado, **When** outra pessoa (colaborador ou chefia) consulta a vaga, **Then** não vê a lista de interessados.
3. **Given** o prazo vencido ou a vaga encerrada, **When** alguém abre a vaga, **Then** vê "Candidaturas encerradas" e não pode mais demonstrar interesse.
4. **Given** um visitante, **When** tenta abrir o mural, **Then** fica na Inicial com o convite para entrar (vagas internas são só para colaboradores).
5. **Given** o RH, **When** abre os interessados de uma vaga, **Then** vê nome, setor, cargo atual, data e mensagem, e pode exportar a lista.

---

### User Story 7 - Exportação de evidências para auditoria (Priority: P3)

Quem tem a permissão de auditoria gera, para um período e (opcionalmente) um setor, um PDF de evidências para a acreditação: avisos publicados com o percentual e a lista de quem leu, treinamentos com inscritos e presença confirmada, e documentos/POPs com o histórico de versões (vigente, datas e quem enviou). O PDF tem capa, sumário, data de geração e quem gerou.

**Why this priority**: Muito útil na época de auditoria, mas usado poucas vezes por ano.

**Independent Test**: Gerar o pacote do último trimestre para o setor Recepção Central e conferir que cada seção traz os dados do período e do setor, com capa e sumário.

**Acceptance Scenarios**:

1. **Given** um período e um setor, **When** o auditor gera o pacote, **Then** recebe um PDF com capa, sumário e as três seções filtradas.
2. **Given** um período sem dados numa seção, **When** o PDF é gerado, **Then** a seção aparece com "Sem registros no período".
3. **Given** alguém sem permissão de auditoria, **When** tenta gerar, **Then** a ação não aparece e o servidor recusa.
4. **Given** a geração de um pacote, **When** se consulta a auditoria, **Then** consta quem gerou, quando e com quais filtros.

---

### Edge Cases

- Aviso devolvido na revisão que já tinha data agendada: volta a rascunho e perde o agendamento até ser aprovado de novo.
- Aprovador remove a própria permissão de aprovar com itens na fila: os itens continuam na fila para os demais aprovadores.
- Nenhum aprovador ativo: o envio para revisão avisa que não há aprovador e sugere procurar o ADMIN (ADMIN sempre aprova).
- Tarefa com lembrete reagendada para outro dia/horário: o lembrete antigo é cancelado e o novo vale.
- Tarefa excluída antes do lembrete: nenhum lembrete é enviado.
- Vaga editada depois de haver interessados: interessados recebem notificação de que a vaga mudou.
- Colaborador desativado: o interesse dele some da lista ativa de interessados, mas fica no histórico da vaga para o RH.
- Campanha que atravessa meses (ex.: 15/out a 15/nov): aparece nos dois meses.
- PDF muito grande (período longo): o sistema limita o período (ex.: 12 meses) e informa o limite.
- Destaque com data no passado no momento de publicar: recusado com mensagem clara.

## Requirements *(mandatory)*

### Functional Requirements

**Meu painel**
- **FR-001**: Colaboradores logados MUST ter a tela "Meu painel" com os blocos: avisos não lidos (em destaque), treinamentos pendentes, chamados abertos/em análise, tarefas de hoje da agenda e próximos eventos inscritos.
- **FR-002**: Cada bloco MUST mostrar a contagem, até 5 itens e o atalho para a lista completa; sem pendências, MUST mostrar "Tudo em dia".
- **FR-003**: "Treinamento pendente" MUST significar treinamento marcado como obrigatório para o setor e/ou perfil da pessoa em que ela ainda não tem presença confirmada; o bloco mostra a próxima turma disponível (com inscrição em 1 clique) ou "Sem turma aberta".
- **FR-003a**: Quem gerencia eventos MUST poder marcar um treinamento como obrigatório e escolher para quais setores e/ou perfis.
- **FR-003b**: O organizador MUST poder confirmar a presença dos inscritos (todos de uma vez ou individualmente) a partir do início do treinamento; presença confirmada conclui a obrigação daquele tema para a pessoa.
- **FR-004**: O painel MUST estar acessível pelo menu e poder ser escolhido como "Tela ao entrar" nas Configurações.

**Aprovação de publicações**
- **FR-005**: O sistema MUST ter a permissão "aprovar publicações", padrão do perfil ADMIN e ajustável por pessoa no Controle de acesso.
- **FR-006**: Avisos e eventos de autores sem essa permissão MUST passar pelo estado "Em revisão" antes de publicados; o autor não pode publicar diretamente.
- **FR-007**: Aprovadores MUST ver a fila de revisão com autor, data de envio e prévia, e poder aprovar (publicando na hora ou na data agendada) ou devolver com motivo obrigatório.
- **FR-008**: O autor MUST ser notificado da aprovação ou devolução (com o motivo); aprovadores MUST ser notificados de novos itens na fila.
- **FR-009**: Conteúdo em revisão MUST ficar invisível para colaboradores e visitantes.
- **FR-010**: Aprovações e devoluções MUST ser registradas na auditoria.

**Prazo de exibição**
- **FR-011**: Avisos MUST aceitar a data opcional "Exibir em destaque até", posterior à publicação.
- **FR-012**: Após essa data, o aviso MUST sair da Inicial e do destaque do mural automaticamente, permanecendo acessível pelo link, histórico e busca, identificado como "fora do destaque".

**Lembretes da agenda**
- **FR-013**: Tarefas com horário MUST aceitar lembrete: na hora, 10 min antes ou 30 min antes.
- **FR-014**: No horário do lembrete, o sistema MUST criar uma notificação na intranet para o dono da tarefa e, se ele permitiu, mostrar um alerta do navegador.
- **FR-015**: Lembrete de tarefa concluída, excluída ou reagendada MUST ser cancelado/recalculado; nenhum lembrete pode ser enviado duas vezes.

**Calendário institucional**
- **FR-016**: O sistema MUST permitir cadastrar datas institucionais (título, tipo: feriado/campanha/data comemorativa/auditoria, período de um ou mais dias, descrição, público: geral ou interno).
- **FR-017**: Feriados nacionais do ano MUST vir pré-cadastrados.
- **FR-018**: O calendário de Eventos MUST mostrar a camada institucional com cor e legenda próprias, que pode ser ligada/desligada (preferência lembrada).
- **FR-019**: Itens institucionais MUST NOT aceitar inscrição; itens "internos" MUST ficar ocultos para visitantes.
- **FR-020**: Cadastrar e editar datas institucionais MUST exigir a permissão de gerenciar eventos.

**Vagas internas**
- **FR-021**: Quem tem a permissão "gerenciar vagas" (padrão RH e ADMIN) MUST poder publicar, editar e encerrar vagas com cargo, setor, requisitos, turno e prazo de candidatura.
- **FR-022**: Colaboradores logados MUST ver o mural de vagas abertas, filtrar por setor e turno e demonstrar ou retirar interesse (mensagem opcional de até 500 caracteres) até o prazo.
- **FR-023**: A lista de interessados MUST ser visível apenas para quem gerencia vagas, com exportação; ninguém mais, nem a chefia, vê quem se interessou.
- **FR-024**: Vagas MUST NOT ser visíveis para visitantes.

**Exportação para auditoria**
- **FR-025**: Quem tem a permissão de auditoria MUST poder gerar um PDF de evidências por período (até 12 meses) e setor opcional.
- **FR-026**: O PDF MUST conter capa (período, setor, data/hora da geração e quem gerou), sumário e as seções: leituras de avisos (percentual e lista de leitores), treinamentos (inscritos e presença conforme FR-027) e versões de documentos/POPs (vigente, histórico, datas e quem enviou).
- **FR-027**: Para treinamentos, o PDF MUST listar inscritos e presentes (com percentual de presença) e, para os obrigatórios, quem do público-alvo ainda está pendente.
- **FR-028**: Cada geração MUST ser registrada na auditoria com os filtros usados.

**Gerais**
- **FR-029**: Todas as telas novas MUST atender WCAG 2.2 AA nos três temas e em celular (375 px) e respeitar as preferências de acessibilidade existentes.
- **FR-030**: Nenhuma informação pessoal das novas funções MUST ser exposta a visitantes.

### Key Entities

- **Revisão de publicação**: estado de um aviso/evento entre rascunho e publicado; guarda quem enviou, quando, quem aprovou/devolveu e o motivo da devolução.
- **Prazo de destaque**: data opcional do aviso até a qual ele aparece em destaque.
- **Treinamento obrigatório**: tema de treinamento com o público-alvo (setores e/ou perfis); vale por qualquer turma desse tema.
- **Presença**: confirmação de comparecimento de um inscrito num treinamento, com quem confirmou e quando.
- **Lembrete de tarefa**: antecedência escolhida (0, 10 ou 30 min) e se já foi enviado.
- **Data institucional**: título, tipo, período, descrição, público (geral/interno), quem cadastrou.
- **Vaga interna**: cargo, setor, requisitos, turno, prazo, estado (aberta/encerrada), quem publicou.
- **Interesse em vaga**: colaborador, vaga, data, mensagem, se desistiu.
- **Pacote de evidências**: período, setor, quem gerou, quando (o arquivo é gerado sob demanda).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um colaborador encontra tudo o que está pendente para ele em uma única tela, em até 1 clique a partir de qualquer página.
- **SC-002**: 100% dos avisos e eventos de autores sem permissão de aprovar só ficam visíveis depois de aprovados (nenhum caminho de publicação direta).
- **SC-003**: Avisos com prazo vencido deixam a Inicial no máximo 1 minuto após o vencimento, sem ação manual.
- **SC-004**: Lembretes chegam em até 1 minuto do horário programado em 95% dos casos, e nunca em duplicidade.
- **SC-005**: O pacote de evidências de um trimestre é gerado em menos de 30 segundos e contém as três seções, prontas para entregar ao auditor sem edição.
- **SC-006**: O colaborador demonstra interesse numa vaga em até 2 cliques a partir do mural.
- **SC-007**: Todas as telas novas passam na verificação automática de acessibilidade (WCAG 2.2 AA) sem violações nos três temas e em duas larguras.

## Assumptions

- Mantém-se a mesma base: frontend da intranet e API existentes, branch atual, sem commit até liberação do usuário.
- "Comunicação" não é um perfil novo: aprovar é uma permissão (padrão ADMIN) que pode ser dada a quem cuida da comunicação.
- Aprovadores publicam o próprio conteúdo sem revisão; não há aprovação em duas etapas.
- O agendamento de avisos já existe e é reaproveitado na aprovação.
- Alertas do navegador dependem da permissão do usuário e da intranet aberta; a notificação no sino é a garantia.
- Feriados nacionais pré-cadastrados cobrem o ano atual e o seguinte; feriados municipais/estaduais são cadastrados pelo gestor.
- Vagas internas não substituem o processo seletivo do RH: o interesse é só a manifestação inicial.
- O PDF é gerado sob demanda e não fica armazenado; apenas o registro da geração vai para a auditoria.
- Fora do escopo: ciência obrigatória com confirmação, validade de POPs e busca global (itens 1, 2 e 4 da lista), que podem vir numa próxima spec.
