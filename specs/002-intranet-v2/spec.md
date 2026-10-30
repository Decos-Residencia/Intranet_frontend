# Feature Specification: Intranet v2 — acesso sem login, Inicial lúdica, agenda e refinamentos

**Feature Branch**: `001-modernizacao-intranet` (mesma branch: a 001 ainda não foi commitada)

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Seta no meio do menu para deixá-lo maior; conteúdo menos disperso; link para o site do Hospital Decós; Inicial mais lúdica (pesquisar outras intranets); mais configurações, só as que funcionam; tirar o texto do botão flutuante de acesso rápido; eventos de demonstração com foto; aviso no dia do evento em que a pessoa se inscreveu; tela de agenda em Comunicação para organizar o dia; no calendário, ao passar o mouse, mostrar foto e descrição do evento; aniversariantes do dia; documento privado de exemplo e visualização protegida dos restritos; chamado mostrando quem enviou e quando; qualquer pessoa vê a intranet, login só para interagir; troca de tema instantânea, sem painel lateral."

## Clarifications

### Session 2026-10-29

- Q: Sem login, o que o visitante vê? → A: Só conteúdo institucional (avisos publicados, eventos, FAQ e documentos gerais). Diretório, ramais, aniversariantes, documentos restritos e qualquer interação exigem login (LGPD).
- Q: Endereço do site do hospital? → A: https://decosdh.com.br/paciente/
- Q: Documento restrito "sem deixar tudo à mostra"? → A: Prévia protegida: conteúdo desfocado até clicar em "Mostrar conteúdo", marca d'água com nome e data de quem vê, sem download e sem impressão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a intranet sem login (Priority: P1)

Qualquer pessoa abre a intranet e vê, sem entrar, a Inicial pública, os avisos publicados, os eventos, a FAQ e os documentos gerais. Ao tentar interagir (inscrever-se, abrir chamado, ver diretório, aniversariantes ou documento restrito), recebe um convite claro para entrar e, depois do login, volta para onde estava.

**Why this priority**: É mudança de regra de acesso; muda o backend e todas as telas.

**Independent Test**: Sem sessão, abrir a intranet, navegar por avisos, eventos, FAQ e documentos gerais; tentar inscrever-se e ser levado ao login; tentar abrir o Diretório e ver o convite para entrar; pela API, confirmar que nada pessoal é devolvido sem token.

**Acceptance Scenarios**:

1. **Given** um visitante sem login, **When** abre a intranet, **Then** vê a Inicial pública (avisos, carrossel de eventos, FAQ, documentos gerais e link do site do hospital) e um botão "Entrar".
2. **Given** um visitante, **When** clica em "Inscrever-se", "Abrir chamado" ou num item restrito, **Then** vai para o login e, após entrar, volta à tela de onde veio.
3. **Given** um visitante, **When** a API é chamada sem token para diretório, aniversariantes, documentos restritos, notificações ou qualquer escrita, **Then** responde 401.
4. **Given** um visitante, **When** vê avisos e eventos, **Then** não aparecem dados pessoais (autor só como setor ou "Comunicação Decós", sem e-mail).

---

### User Story 2 - Inicial mais lúdica e completa (Priority: P1)

A Inicial fica mais acolhedora e organizada: saudação com ilustração e frase do dia, destaque dos aniversariantes do dia com botão de parabéns, lembrete "Hoje você tem" quando a pessoa está inscrita num evento do dia, carrossel de eventos com foto, e blocos agrupados para reduzir a dispersão.

**Why this priority**: Pedido central de experiência; a Inicial recebe a maior parte das visitas.

**Independent Test**: Entrar no dia de um evento em que está inscrito e ver o lembrete e a notificação; ver o aniversariante do dia com botão de parabéns; comparar a densidade com a versão anterior.

**Acceptance Scenarios**:

1. **Given** um colaborador inscrito num evento que acontece hoje, **When** abre a intranet, **Then** vê o lembrete "Hoje você tem" na Inicial e recebe uma notificação (uma única vez por inscrição).
2. **Given** aniversariantes hoje, **When** um colaborador abre a Inicial, **Then** vê um destaque com fotos/iniciais e o botão "Parabenizar".
3. **Given** a Inicial, **When** carrega, **Then** mostra saudação com ilustração e frase do dia, e os blocos ficam agrupados em no máximo duas colunas, sem repetir informação.

---

### User Story 3 - Menu mais prático (Priority: P1)

O menu lateral ganha uma alça com seta no meio da borda para recolher e expandir. O site do hospital aparece no menu e no topo. Os itens ficam agrupados para menos dispersão.

**Independent Test**: Clicar na seta no meio do menu (e usar o teclado) para recolher e expandir; abrir o link do site do hospital em nova aba.

**Acceptance Scenarios**:

1. **Given** o menu expandido, **When** o usuário clica na seta no meio da borda, **Then** o menu recolhe para ícones; clicando de novo, expande; a escolha fica salva.
2. **Given** qualquer tela, **When** o usuário clica em "Site do Hospital Decós", **Then** https://decosdh.com.br/paciente/ abre em nova aba.

---

### User Story 4 - Troca de tema instantânea (Priority: P1)

O botão de tema abre um pequeno menu junto ao próprio botão (sem painel lateral) e a troca acontece no clique, na hora.

**Independent Test**: Clicar no botão de tema, escolher "Escuro" e ver a troca imediata; navegar o menu pelo teclado; fechar com Esc ou clicando fora.

**Acceptance Scenarios**:

1. **Given** o botão de tema, **When** o usuário clica, **Then** aparece um menu compacto com Automático, Claro, Escuro e Vinho, sem painel lateral.
2. **Given** o menu aberto, **When** escolhe uma opção, **Then** o tema muda na hora, o menu fecha e a escolha fica salva (na conta, se logado).

---

### User Story 5 - Agenda pessoal (Priority: P2)

Em Comunicação, a tela "Minha agenda" mostra um dia por vez: as tarefas que a pessoa anotou (com horário opcional), que ela pode criar, editar, marcar como feita, reordenar e excluir, junto com os eventos em que está inscrita naquele dia.

**Independent Test**: Criar três tarefas para hoje, marcar uma como feita, mudar a ordem, editar o texto, ir para amanhã e voltar; recarregar e ver tudo salvo; outro usuário não vê essas tarefas.

**Acceptance Scenarios**:

1. **Given** a agenda de hoje, **When** o usuário adiciona "Revisar escala" às 14:00, **Then** a tarefa aparece na lista do dia, ordenada pelo horário.
2. **Given** tarefas do dia, **When** marca como feita, edita, muda a ordem ou exclui, **Then** a mudança é salva na conta.
3. **Given** inscrição num evento no dia, **When** abre a agenda daquele dia, **Then** o evento aparece junto, com horário e local.

---

### User Story 6 - Calendário com foto e descrição (Priority: P2)

Na tela de Eventos, ao passar o mouse, focar ou tocar num dia do calendário, a área abaixo mostra os eventos daquele dia com foto, tipo, horário, local e resumo.

**Acceptance Scenarios**:

1. **Given** um dia com evento com foto, **When** o usuário passa o mouse, **Then** vê abaixo a foto, o tipo, o horário, o local e o resumo, com link para o evento.

---

### User Story 7 - Documento restrito com prévia protegida (Priority: P2)

Documentos restritos a um setor abrem numa visualização protegida: o conteúdo começa desfocado com o botão "Mostrar conteúdo", há marca d'água com o nome e a data de quem está vendo, e não há download nem impressão.

**Acceptance Scenarios**:

1. **Given** um documento restrito ao setor do usuário, **When** ele abre, **Then** vê título, descrição e versão; o conteúdo aparece desfocado até clicar em "Mostrar conteúdo".
2. **Given** o conteúdo visível, **When** o usuário olha a página, **Then** há marca d'água repetida com nome e data, e não existem botões de baixar ou imprimir (a impressão sai em branco).

---

### User Story 8 - Chamado: quem enviou e quando (Priority: P2)

Quem atende chamados vê, na lista e no detalhe, o nome, setor, e-mail e ramal de quem enviou (ou "Anônimo"), a data e a hora de abertura e da última atualização.

**Acceptance Scenarios**:

1. **Given** um chamado identificado, **When** o gestor abre o detalhe, **Then** vê nome, setor, e-mail, ramal, data e hora de abertura e da última atualização.
2. **Given** um chamado anônimo, **When** o gestor abre, **Then** vê "Anônimo" e nenhum dado de quem enviou.

---

### User Story 9 - Mais configurações, todas funcionando (Priority: P3)

Configurações ganha opções novas e úteis, todas efetivas: espaçamento das linhas de texto, cor de destaque do foco, menu sempre recolhido ao entrar, abrir a intranet direto numa tela escolhida, e notificações sonoras desligáveis só se existirem; nenhuma opção sem efeito é exibida.

**Acceptance Scenarios**:

1. **Given** cada opção nova, **When** o usuário liga, **Then** o efeito é visível na hora e fica salvo na conta.

---

### User Story 10 - Ajustes e dados de demonstração (Priority: P3)

O botão flutuante de acessos rápidos perde o texto "Acesso Rápido" (fica só o ícone, com nome acessível). O ambiente de demonstração ganha eventos com foto e um documento restrito de exemplo.

**Acceptance Scenarios**:

1. **Given** qualquer tela, **When** aparece o botão flutuante, **Then** não há o rótulo "Acesso Rápido", mas o leitor de tela anuncia "Acessos rápidos".

### Edge Cases

- Visitante com token vencido: vira visitante (sem erro) e pode entrar de novo.
- Visitante abre link direto de aviso, evento ou documento restrito: restrito pede login; público abre.
- Lembrete de evento do dia: mais de um evento no dia mostra todos; o aviso sai uma vez por inscrição, mesmo abrindo várias vezes.
- Agenda: tarefa sem horário fica antes das com horário; texto até 200 caracteres; até 50 tarefas por dia.
- Documento restrito em tela pequena: marca d'água e desfoque continuam.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sem token, a API MUST permitir apenas leitura de: avisos publicados, eventos publicados ou cancelados (sem dados de quem se inscreveu), FAQ ativas, documentos gerais ativos (metadados e download) e acessos rápidos globais.
- **FR-002**: Sem token, a API MUST responder 401 para diretório, aniversariantes, documentos restritos, notificações, chamados, agenda, preferências e qualquer escrita.
- **FR-003**: O frontend MUST funcionar sem sessão nessas telas, com botão "Entrar" e convite ao login ao tentar interagir, voltando à tela de origem após o login.
- **FR-004**: Respostas públicas MUST NOT conter e-mail, ramal, nascimento ou identificação do autor; o autor do aviso aparece como "Comunicação Decós".
- **FR-005**: Na data do evento, cada inscrito MUST receber uma notificação única e ver o lembrete "Hoje você tem" na Inicial.
- **FR-006**: A Inicial MUST mostrar os aniversariantes do dia (para quem está logado) com botão de parabéns, saudação com ilustração e frase do dia, e agrupar os blocos em até duas colunas.
- **FR-007**: O menu lateral MUST ter uma alça com seta no meio da borda para recolher e expandir, operável por teclado, com a escolha salva.
- **FR-008**: O site https://decosdh.com.br/paciente/ MUST estar no menu e nos acessos rápidos, abrindo em nova aba.
- **FR-009**: O seletor de tema MUST ser um menu junto ao botão, sem painel lateral, trocando o tema no clique.
- **FR-010**: A agenda pessoal MUST permitir criar, editar, concluir, reordenar e excluir tarefas por dia (texto até 200, horário opcional, até 50 por dia), salvas na conta, e mostrar os eventos inscritos do dia.
- **FR-011**: O calendário de Eventos MUST mostrar, no hover/foco/toque de um dia, a foto, o tipo, o horário, o local e o resumo de cada evento.
- **FR-012**: Documento restrito MUST abrir com conteúdo desfocado até "Mostrar conteúdo", marca d'água com nome e data do usuário, sem download nem impressão.
- **FR-013**: A gestão de chamados MUST mostrar nome, setor, e-mail, ramal, data e hora de abertura e última atualização do solicitante identificado.
- **FR-014**: Configurações MUST oferecer espaçamento de linhas, menu recolhido ao entrar e tela inicial preferida, todas efetivas e salvas; nenhuma opção sem efeito.
- **FR-015**: O botão flutuante MUST não exibir o rótulo "Acesso Rápido" e MUST ter nome acessível.
- **FR-016**: O ambiente de demonstração MUST ter eventos com foto e um documento restrito de exemplo.

### Key Entities

- **Item de agenda**: usuário, data, texto, horário opcional, feito, ordem.
- **Lembrete de evento**: marca na inscrição de que o aviso do dia já foi enviado.

## Success Criteria *(mandatory)*

- **SC-001**: Um visitante navega por avisos, eventos, FAQ e documentos gerais sem login; 100% das rotas pessoais respondem 401 sem token.
- **SC-002**: 100% dos inscritos num evento do dia recebem exatamente uma notificação.
- **SC-003**: Trocar o tema leva 2 cliques e acontece em menos de 100 ms, sem painel lateral.
- **SC-004**: Zero violações axe WCAG 2.2 AA nas telas novas e alteradas, nos três temas e em 375/1440 px.
- **SC-005**: Uma tarefa de agenda é criada em menos de 10 segundos.

## Assumptions

- "Lúdica" = ilustração, frase do dia, destaque de aniversário e lembretes visuais (padrões vistos em intranets de referência: widgets de colegas e contatos, lista de tarefas, calendário, reconhecimento); sem gamificação com pontos nesta entrega.
- Os eventos e documentos de demonstração existem só no ambiente local; em produção, o conteúdo é do RH/ADMIN.
- O lembrete do dia é gerado quando qualquer usuário logado acessa a intranet naquele dia (sem agendador externo), de forma idempotente.
