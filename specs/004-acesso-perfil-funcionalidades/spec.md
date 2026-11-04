# Feature Specification: Intranet v4 — acesso por perfil, funcionalidades liberáveis, ramal por setor e inscrição externa em eventos

**Feature Branch**: `feat/acesso-perfil-funcionalidades` (backend e frontend, a partir da `main` de 2026-11-01: backend `fe81d5d`, frontend `067b6cc`)

**Created**: 2026-11-01

**Status**: Implementado (aguardando conferência, sem commit)

**Input**: User description: "Veja se cada perfil está com auditoria correta e se estão vendo as respectivas telas corretas que deveriam; agora o controle de acesso deve ser por perfil; veja se a tela de documentos tem no perfil de admin; deixe o ramal somente por setor; alguns eventos vão precisar que o usuário se inscreva por um link fora; o admin pode desabilitar funcionalidades para certos perfis ou para todos (ex.: desabilitar a agenda para todos) e, quando achar que é a hora, ele mesmo habilita de novo."

## Diagnóstico de partida (main de 2026-11-01)

Levantamento feito no código antes da spec; é a base dos requisitos de correção (US2 e US3).

**Perfis e telas hoje** (menu e rotas seguem as permissões efetivas; o servidor também valida):

| Tela | Visitante | Leitura | Colaborador | RH | Admin |
|---|---|---|---|---|---|
| Início, Avisos, Eventos, FAQ | sim | sim | sim | sim | sim |
| Documentos & POPs (consulta) | sim | sim | sim | **não aparece no menu** | **não aparece no menu** |
| Meu painel, Minha agenda, Aniversariantes, Diretório, Vagas, Configurações | — | sim | sim | sim | sim |
| Gerenciar notícias, documentos, FAQ, eventos, treinamentos, calendário, validade de documentos | — | — | — | sim | sim |
| Gerenciar vagas | — | — | — | sim | sim |
| Indicadores, chamados (atendimento), revisão de publicações | — | — | — | — | sim |
| Usuários & setores, importação, controle de acesso, solicitações cadastrais, auditoria | — | — | — | — | sim |

**Lacunas encontradas**:

- G1 — ADMIN e RH (quem gerencia documentos) perdem o item "Documentos & POPs" do menu: o item vira "Gerenciar Documentos" e não há caminho no menu para a central de consulta.
- G2 — Exportar a planilha de inscritos de um evento e a de interessados de uma vaga (dados pessoais) não fica registrado na auditoria.
- G3 — Reenviar um e-mail da fila não fica registrado na auditoria.
- G4 — Responsáveis por setor dos chamados e reenvio de e-mail checam "é ADMIN" direto, fora do catálogo de permissões; não aparecem na matriz de acesso.
- G5 — O controle de acesso está por pessoa (perfil + ajustes individuais). A partir desta versão passa a ser só por perfil.
- G7 — A permissão "Atender chamados" da matriz não era usada pelo servidor (a fila era só do ADMIN e dos responsáveis por setor), e o responsável por setor não tinha a fila no menu.
- G8 — "Editar o próprio perfil" escondia o botão de pedir alteração na tela, mas o servidor exigia "Interagir" para o pedido.
- G6 — O Diretório abre na lista de pessoas e o colaborador edita o próprio ramal no Meu perfil; o pedido é ver os ramais organizados por setor e só o ADMIN alterar.

## Clarifications

### Session 2026-11-01

Decisões tomadas a partir do pedido e do histórico do projeto (registradas aqui para conferência do responsável):

- Q: Os ajustes individuais de permissão que existem hoje continuam valendo? → A: Não. O acesso passa a ser só por perfil; ajustes por pessoa deixam de existir e a matriz de cada perfil começa no padrão do sistema.
- Q: "Desabilitar para todos" inclui o próprio ADMIN e o visitante? → A: Sim. "Todos" vale para os quatro perfis e para quem não está logado. O ADMIN continua tendo a tela de Funcionalidades para religar.
- Q: "Ramal somente por setor" elimina o ramal da pessoa? → A: Não (resposta do responsável em 2026-11-01). A pessoa continua com o ramal individual, mas o Diretório passa a ser organizado por setor: cada setor com o ramal geral e, dentro, as pessoas com o ramal de cada uma (sem ramal próprio, vale o do setor). Nenhum ramal é apagado.
- Q: Quem altera o ramal individual? → A: Só o ADMIN (Usuários & Setores ou planilha); a pessoa pede a mudança pela solicitação cadastral.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controle de acesso por perfil (Priority: P1)

O ADMIN abre "Controle de acesso" e vê uma matriz com as permissões nas linhas e os perfis (Leitura, Colaborador, RH) nas colunas. Ele marca ou desmarca o que cada perfil pode fazer e salva; vale na hora para todas as pessoas daquele perfil. Na mesma tela, a lista de pessoas mostra o perfil e a situação de cada uma, e o ADMIN só troca o perfil ou ativa/desativa a pessoa; não existe mais conceder ou retirar permissão de uma pessoa específica.

**Why this priority**: É a base das demais histórias (telas e funcionalidades dependem do perfil) e o pedido explícito: "o controle de acesso deve ser por perfil".

**Independent Test**: Como ADMIN, tirar "Gerenciar FAQ" do RH e salvar; entrar como RH e conferir que "Gerenciar FAQ" sumiu do menu, que o endereço da tela volta ao Início e que salvar uma FAQ é recusado; devolver a permissão e conferir que volta.

**Acceptance Scenarios**:

1. **Given** o ADMIN na matriz, **When** retira uma permissão do RH e salva, **Then** todas as pessoas com perfil RH perdem essa permissão na próxima ação, sem precisar sair e entrar de novo.
2. **Given** a matriz, **When** o ADMIN tenta dar a outro perfil "Usuários, setores e acessos" ou "Ver auditoria", **Then** essas linhas aparecem travadas como exclusivas do Administrador.
3. **Given** a coluna Administrador, **When** a matriz abre, **Then** aparece toda marcada e sem edição (o ADMIN sempre tem tudo).
4. **Given** uma pessoa na lista, **When** o ADMIN abre "Gerenciar", **Then** vê o perfil, a situação e as permissões que vêm do perfil (só leitura), sem opções por pessoa.
5. **Given** a matriz alterada, **When** o ADMIN usa "Restaurar padrão" num perfil e salva, **Then** o perfil volta às permissões padrão do sistema.
6. **Given** qualquer mudança na matriz ou no perfil de uma pessoa, **When** se consulta a auditoria, **Then** consta quem mudou, o quê (permissão, perfil, de → para) e quando.
7. **Given** o último ADMIN ativo, **When** alguém tenta rebaixá-lo ou desativá-lo, **Then** a ação é recusada (regra já existente, mantida).

---

### User Story 2 - Cada perfil vê as telas certas (Priority: P1)

Cada perfil enxerga no menu exatamente as telas que pode usar, e o que não aparece no menu também não abre pelo endereço nem pela API. Em especial, quem gerencia documentos (ADMIN e RH) passa a ver os dois itens: "Documentos & POPs" (consulta, como qualquer colaborador) e "Gerenciar Documentos".

**Why this priority**: É o pedido de conferência ("se estão vendo as telas corretas") e corrige a falha G1, que hoje deixa o ADMIN sem a central de documentos.

**Independent Test**: Entrar com um usuário de cada perfil (e como visitante) e comparar o menu com a matriz de telas desta spec; para cada tela fora do perfil, abrir o endereço direto e conferir que volta ao Início; como ADMIN, abrir "Documentos & POPs" pelo menu.

**Acceptance Scenarios**:

1. **Given** um ADMIN ou RH com "Gerenciar documentos", **When** abre o grupo "Documentos & FAQ", **Then** vê "Documentos & POPs" e "Gerenciar Documentos" como itens separados.
2. **Given** qualquer perfil, **When** abre pelo endereço uma tela que não está no seu menu, **Then** volta ao Início com o aviso de que não tem acesso.
3. **Given** um perfil sem a permissão de uma ação, **When** a ação é pedida direto ao servidor, **Then** é recusada com a mensagem de falta de permissão.
4. **Given** um perfil Leitura, **When** navega, **Then** não vê botões de interação (inscrever, parabenizar, abrir chamado, manifestar interesse em vaga) e consegue consultar e baixar documentos.
5. **Given** a configuração de responsáveis por setor dos chamados e o reenvio de e-mails, **When** o acesso é conferido, **Then** seguem permissões do catálogo (visíveis na matriz), e não uma checagem fixa de perfil.

---

### User Story 3 - Auditoria completa das ações administrativas (Priority: P1)

Toda ação administrativa ou de exportação de dados pessoais fica registrada na auditoria com quem fez, o quê e quando, para qualquer perfil que a execute.

**Why this priority**: Exigência de auditoria hospitalar e LGPD; hoje há lacunas (G2, G3) justamente nas exportações de dados pessoais.

**Independent Test**: Como RH, exportar a planilha de inscritos de um evento e a de interessados de uma vaga; como ADMIN, reenviar um e-mail; conferir na auditoria uma linha para cada ação, com o autor certo.

**Acceptance Scenarios**:

1. **Given** um gestor de eventos, **When** exporta a planilha de inscritos, **Then** a auditoria registra a exportação com o evento e a quantidade de linhas (sem copiar os dados pessoais).
2. **Given** um gestor de vagas, **When** exporta os interessados de uma vaga, **Then** a auditoria registra a exportação.
3. **Given** o ADMIN, **When** reenvia um e-mail da fila, **Then** a auditoria registra o reenvio.
4. **Given** as mudanças de matriz de acesso, perfil, funcionalidades, ramal de setor e link de inscrição de evento, **When** acontecem, **Then** cada uma gera uma linha de auditoria.
5. **Given** o filtro da tela de auditoria, **When** o ADMIN filtra pelas novas ações, **Then** elas aparecem com rótulo legível.

---

### User Story 4 - Funcionalidades liberáveis (Priority: P1)

O ADMIN abre "Funcionalidades" e vê a lista dos módulos da intranet (Minha agenda, Vagas internas, Aniversariantes, Eventos e treinamentos, Calendário institucional, FAQ, Diretório & Ramais, Meu painel, Chamados). Para cada um escolhe "Ligado para todos", "Desligado para todos" ou "Só para alguns perfis" (marcando Visitante, Leitura, Colaborador, RH, Administrador). Um módulo desligado para um perfil some do menu, dos blocos da Inicial e do Meu painel, o endereço volta ao Início e o servidor recusa as ações dele. Quando o ADMIN achar que é a hora, religa e tudo volta como estava.

**Why this priority**: Pedido explícito; permite lançar módulos aos poucos (ex.: agenda desligada até o treinamento da equipe).

**Independent Test**: Desligar "Minha agenda" para todos; conferir que nenhum perfil (nem o ADMIN) vê a agenda no menu nem no painel e que o endereço volta ao Início; religar e conferir que as tarefas que já existiam voltam intactas.

**Acceptance Scenarios**:

1. **Given** "Minha agenda" desligada para todos, **When** qualquer pessoa navega, **Then** não há item de agenda no menu, o bloco de tarefas some do Meu painel, `#/agenda` volta ao Início e criar tarefa é recusado.
2. **Given** "Vagas internas" ligada só para Colaborador e RH, **When** um Leitura navega, **Then** não vê Vagas; **When** um Colaborador navega, **Then** vê normalmente.
3. **Given** um módulo desligado, **When** o ADMIN religa, **Then** os dados que já existiam (tarefas, vagas, eventos, FAQs) aparecem de novo sem perda.
4. **Given** um módulo desligado para um perfil, **When** chega a hora de um lembrete ou notificação automática daquele módulo, **Then** ela não é enviada a quem tem o módulo desligado.
5. **Given** "Eventos e treinamentos" desligado para RH, **When** um RH navega, **Then** também não vê "Gerenciar Eventos" nem "Treinamentos obrigatórios" (desligar esconde a consulta e a gestão do módulo para aquele perfil).
6. **Given** a tela Funcionalidades, **When** o ADMIN muda qualquer módulo, **Then** a mudança vale na próxima navegação de cada pessoa e fica registrada na auditoria (módulo, de → para).
7. **Given** a tela Funcionalidades, **When** o ADMIN desliga um módulo para todos, **Then** a própria tela Funcionalidades continua acessível a ele (ela nunca pode ser desligada).

---

### User Story 5 - Ramais organizados por setor (Priority: P2)

O Diretório abre organizado por setor: cada setor mostra o seu ramal geral e, dentro dele, as pessoas com o ramal individual de cada uma; quem não tem ramal próprio aparece com o ramal do setor. A lista de pessoas continua disponível como segunda visão. Só o ADMIN cadastra ou muda ramais (do setor em "Usuários & Setores", da pessoa no cadastro dela ou na planilha); o colaborador vê o seu ramal no Meu perfil e pede mudança pela solicitação cadastral.

**Why this priority**: Facilita achar o ramal certo pelo setor e evita ramais alterados sem controle; é independente das demais histórias.

**Independent Test**: Cadastrar o ramal 2100 na Recepção e o ramal individual 2145 de uma recepcionista; abrir o Diretório e ver o card da Recepção com 2100 e, dentro, a recepcionista com 2145 e as demais com "2100 (do setor)"; como colaborador, conferir que o Meu perfil não tem campo para editar o ramal.

**Acceptance Scenarios**:

1. **Given** o Diretório, **When** abre, **Then** a visão inicial é por setor, com o ramal do setor e as pessoas dentro dele.
2. **Given** uma pessoa com ramal individual, **When** aparece no setor, **Then** mostra o ramal dela (com botão de copiar); **Given** uma pessoa sem ramal próprio, **Then** mostra o ramal do setor indicado como "do setor".
3. **Given** um colaborador, **When** abre o Meu perfil, **Then** vê o ramal só para leitura e a orientação de pedir a mudança pela solicitação cadastral.
4. **Given** um colaborador, **When** tenta alterar o próprio ramal direto no servidor, **Then** é recusado; **Given** o ADMIN, **When** altera o ramal de alguém, **Then** a mudança vale e fica na auditoria.
5. **Given** uma busca pelo número do ramal, **When** o número é de uma pessoa ou de um setor, **Then** a pessoa (ou o setor e quem trabalha nele) aparece.
6. **Given** um chamado aberto por quem não tem ramal próprio, **When** o atendente o abre, **Then** vê o ramal do setor do solicitante.

---

### User Story 6 - Eventos com inscrição externa (Priority: P2)

Ao criar ou editar um evento, o organizador escolhe como é a inscrição: "Pela intranet" (como hoje), "Por link externo" (informa o endereço do formulário de fora) ou "Sem inscrição". Com link externo, o botão do evento vira "Inscrever-se (site externo)" e abre o link numa nova aba; não há vagas nem lista de inscritos na intranet para esse evento.

**Why this priority**: Alguns eventos são organizados por terceiros (congressos, cursos com formulário próprio); evita inscrição duplicada e confusa.

**Independent Test**: Criar um evento com inscrição por link externo; como colaborador, abrir o evento e conferir que o botão abre o link numa nova aba e que não há contagem de vagas; como gestor, conferir que não há lista de inscritos para exportar.

**Acceptance Scenarios**:

1. **Given** um evento com inscrição externa, **When** um colaborador abre o detalhe, **Then** vê "Inscrever-se (site externo)" com a indicação de que abre em nova aba, e o clique abre o link.
2. **Given** um visitante sem login, **When** abre um evento com inscrição externa, **Then** também vê o botão do link externo (não precisa entrar na intranet).
3. **Given** o formulário do evento, **When** o organizador escolhe "Por link externo" sem informar o endereço, ou informa um endereço que não começa com https:// ou http://, **Then** o formulário não salva e explica o erro.
4. **Given** um evento com inscrição externa, **When** alguém tenta se inscrever pela intranet (inclusive direto no servidor), **Then** é recusado com a mensagem de que a inscrição é feita no link externo.
5. **Given** um evento que já tinha inscritos internos, **When** o organizador muda para link externo, **Then** recebe um alerta, os inscritos existentes continuam visíveis para o organizador e nenhuma nova inscrição interna é aceita.
6. **Given** um treinamento que é turma de um treinamento obrigatório, **When** o organizador tenta escolher link externo, **Then** é recusado (a presença do obrigatório precisa da lista da intranet).
7. **Given** um evento "Sem inscrição", **When** é exibido, **Then** não há botão de inscrição, só as informações.
8. **Given** a lista de eventos e o carrossel da Inicial, **When** um evento tem inscrição externa, **Then** aparece um selo "Inscrição externa".

---

### Edge Cases

- Matriz salva enquanto alguém do perfil está com a tela aberta: a próxima ação dessa pessoa já obedece à nova regra; o menu se ajusta na próxima navegação.
- Permissão de gestão retirada de um perfil cujo módulo está ligado: a pessoa continua consultando o módulo, só perde a gestão.
- Módulo ligado mas permissão de gestão ausente, ou módulo desligado mas permissão presente: o módulo desligado sempre vence (nada do módulo aparece).
- Desligar "Eventos e treinamentos" não desliga o "Calendário institucional" nem vice-versa; cada um é um módulo.
- Desligar "Meu painel": a Inicial continua sendo a página de entrada; os endereços antigos que abriam o painel (ex.: `#/chamados`) voltam ao Início.
- Desligar "Chamados": "abrir chamado" some do botão rápido e do painel; o atendimento (Administração → Chamados) também some para os perfis desligados.
- Treinamento obrigatório pendente com o módulo Eventos desligado para a pessoa: não aparece no Meu painel enquanto o módulo estiver desligado.
- Link externo de evento quebrado ou fora do ar: é responsabilidade do organizador; a intranet só valida o formato do endereço.
- Pessoa trocada de setor: passa a aparecer no novo setor; sem ramal próprio, mostra o ramal do novo setor.
- Perfil sem nenhuma permissão marcada na matriz: continua conseguindo entrar e consultar o conteúdo institucional (consulta não depende de permissão).

## Requirements *(mandatory)*

### Functional Requirements

**Controle de acesso por perfil (US1)**

- **FR-001**: As permissões de cada pessoa MUST ser exatamente as do seu perfil; não pode haver concessão ou retirada de permissão por pessoa.
- **FR-002**: O ADMIN MUST poder editar, numa matriz, as permissões dos perfis Leitura, Colaborador e RH; o Administrador MUST ter sempre todas as permissões.
- **FR-003**: "Usuários, setores e acessos" e "Ver auditoria" MUST ser exclusivas do Administrador e não editáveis na matriz.
- **FR-004**: A mudança na matriz MUST valer para todas as pessoas do perfil a partir da próxima ação delas, sem novo login.
- **FR-005**: O ADMIN MUST poder restaurar o padrão do sistema de um perfil.
- **FR-006**: Ajustes individuais existentes MUST ser descartados na entrada da versão, com a matriz começando no padrão do sistema.

**Telas por perfil (US2)**

- **FR-007**: Menu, endereço da tela e servidor MUST usar a mesma regra (permissão do perfil + funcionalidade ligada) para cada tela e ação.
- **FR-008**: Quem gerencia documentos MUST ver no menu a consulta "Documentos & POPs" e, separado, "Gerenciar Documentos".
- **FR-009**: A configuração de responsáveis por setor dos chamados e o reenvio de e-mails MUST depender de permissões do catálogo, visíveis na matriz.
- **FR-010**: O endereço de uma tela sem acesso MUST voltar ao Início com aviso.
- **FR-010a**: "Atender chamados" MUST dar acesso à fila inteira (atender, transferir e atribuir); sem ela, o responsável por um setor atende só os chamados do setor e vê a fila no menu.
- **FR-010b**: Pedir alteração do próprio cadastro MUST depender da permissão "Pedir alteração do próprio cadastro" (antes "Editar o próprio perfil"), na tela e no servidor.

**Auditoria (US3)**

- **FR-011**: Exportações de planilhas com dados pessoais (inscritos de evento, interessados de vaga) MUST ser auditadas, sem copiar os dados exportados para a auditoria.
- **FR-012**: O reenvio de e-mail MUST ser auditado.
- **FR-013**: Mudanças na matriz de permissões, no perfil de uma pessoa, nas funcionalidades, no ramal de setor e no modo de inscrição de um evento MUST ser auditadas com "de → para".
- **FR-014**: As novas ações MUST aparecer com rótulo legível no filtro da tela de auditoria.

**Funcionalidades liberáveis (US4)**

- **FR-015**: O sistema MUST ter um catálogo fixo de módulos liberáveis: Minha agenda, Vagas internas, Aniversariantes, Eventos e treinamentos, Calendário institucional, FAQ, Diretório & Ramais, Meu painel e Chamados.
- **FR-016**: Início, Avisos, Documentos, Meu perfil, Configurações, Notificações e toda a Administração de usuários/acessos/auditoria/funcionalidades MUST ficar sempre ligados (não aparecem como liberáveis).
- **FR-017**: Para cada módulo o ADMIN MUST poder escolher: ligado para todos, desligado para todos, ou ligado só para os perfis marcados (Visitante, Leitura, Colaborador, RH, Administrador).
- **FR-018**: Um módulo desligado para um perfil MUST sumir do menu, da Inicial, do Meu painel e do botão rápido para esse perfil; o endereço MUST voltar ao Início; e o servidor MUST recusar consultas e ações do módulo com uma mensagem de "funcionalidade desativada".
- **FR-019**: Desligar um módulo MUST esconder também a gestão dele para os perfis desligados.
- **FR-020**: Lembretes, notificações e e-mails automáticos de um módulo MUST não ser enviados a quem tem o módulo desligado.
- **FR-021**: Desligar e religar MUST preservar todos os dados do módulo.
- **FR-022**: Todo módulo MUST começar ligado para todos (comportamento atual) na entrada da versão.

**Ramais por setor (US5)**

- **FR-023**: O Diretório MUST abrir na visão por setor: ramal do setor e, dentro, as pessoas com o ramal individual ou, sem ele, o do setor identificado como tal.
- **FR-024**: Só o ADMIN MUST poder cadastrar ou alterar ramais (do setor e da pessoa); a pessoa não edita o próprio ramal e pede a mudança pela solicitação cadastral.
- **FR-025**: A busca do Diretório por número de ramal MUST encontrar a pessoa (ramal individual) ou o setor e as pessoas dele (ramal do setor).
- **FR-026**: Nenhum ramal existente MUST ser apagado; chamados mostram o ramal da pessoa ou, sem ele, o do setor.

**Inscrição externa em eventos (US6)**

- **FR-027**: Cada evento MUST ter um modo de inscrição: pela intranet, por link externo ou sem inscrição; eventos existentes ficam "pela intranet".
- **FR-028**: No modo link externo, o endereço MUST ser obrigatório, começar com https:// ou http:// e ter até 500 caracteres.
- **FR-029**: No modo link externo ou sem inscrição, novas inscrições pela intranet MUST ser recusadas e vagas MUST ser ignoradas; quem já estava inscrito ainda pode cancelar.
- **FR-030**: O botão do link externo MUST abrir em nova aba, indicar isso de forma acessível e aparecer também para visitantes.
- **FR-031**: Turmas de treinamento obrigatório MUST usar só inscrição pela intranet.
- **FR-032**: Mudar para link externo um evento com inscritos internos MUST mostrar alerta e manter os inscritos visíveis ao organizador.
- **FR-033**: Lista de eventos e carrossel MUST mostrar o selo "Inscrição externa" quando for o caso.

### Key Entities

- **Permissão do perfil**: par (perfil, permissão) que o ADMIN liga ou desliga; o Administrador não tem linhas (tem tudo). Guarda quem alterou e quando.
- **Funcionalidade**: módulo do catálogo fixo com o conjunto de perfis (incluindo Visitante) para os quais está ligado; guarda quem alterou e quando. Ausência de configuração = ligado para todos.
- **Setor / Pessoa**: o setor tem o ramal geral; a pessoa pode ter o ramal individual (só o ADMIN altera).
- **Evento**: ganha o modo de inscrição (intranet, link externo, nenhuma) e o endereço do link externo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para os 4 perfis e o visitante, 100% das telas do menu coincidem com a matriz de telas desta spec, e 100% das telas fora do menu voltam ao Início quando abertas pelo endereço.
- **SC-002**: Uma mudança na matriz de permissões ou nas funcionalidades vale para a pessoa afetada em até 1 navegação, sem novo login.
- **SC-003**: O ADMIN desliga ou religa um módulo para todos em até 3 cliques, e em menos de 1 minuto sem ajuda.
- **SC-004**: 100% das ações administrativas e exportações de dados pessoais listadas em FR-011 a FR-013 geram uma linha de auditoria com o autor certo.
- **SC-005**: Depois de religar um módulo, 100% dos registros que existiam antes do desligamento aparecem de novo.
- **SC-006**: 100% dos ramais existentes continuam visíveis no Diretório, agrupados no setor de cada pessoa.
- **SC-007**: Em eventos com link externo, 0 inscrições internas novas são aceitas, e o link abre em nova aba em 100% dos acessos.
- **SC-008**: As telas novas e alteradas (Controle de acesso, Funcionalidades, formulário de evento, Diretório, Meu perfil) mantêm WCAG 2.2 AA (navegação por teclado, rótulos, contraste) como o restante da intranet.

## Assumptions

- Base: `main` do backend (`fe81d5d`) e do frontend (`067b6cc`) em 2026-11-01; a versão por perfil que existiu entre 2026-10-29 e 2026-10-30 (migração 0029 e tela de matriz) é reaproveitada como ponto de partida.
- O padrão do sistema por perfil é o de hoje: Leitura = baixar; Colaborador = interagir, baixar, editar perfil; RH = Colaborador + gerenciar avisos, documentos, FAQ, eventos e vagas; Administrador = tudo.
- A permissão "Editar o próprio perfil" continua existindo para outros dados do perfil (preferências etc.), mesmo sem o ramal pessoal.
- Consultar conteúdo institucional (Início, Avisos, Documentos, FAQ, Eventos) não depende de permissão; só de funcionalidade ligada (quando o módulo é liberável).
- O visitante sem login só é afetado pelos módulos públicos liberáveis (Eventos e treinamentos, Calendário institucional, FAQ).
- Cliques no link externo não são contados nem registrados (a inscrição acontece fora da intranet).
- A validação do link externo é só de formato; a intranet não verifica se o site de fora está no ar.
- Sem mudança de LGPD além da auditoria das exportações: nenhum dado pessoal novo é coletado.
- Nada é commitado até o responsável conferir tudo (regra do projeto).
