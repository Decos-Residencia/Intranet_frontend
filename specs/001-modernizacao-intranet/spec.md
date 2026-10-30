# Feature Specification: Modernização da Intranet Hospital Decós

**Feature Branch**: `001-modernizacao-intranet`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Modernização da Intranet: controle de acesso por tela de administração (removendo a troca de perfil do topo), redesign moderno da Inicial (estilo Apple, vidro fosco, melhor contraste, menos poluição no admin), temas Claro/Escuro/Vinho repensados, configurações de acessibilidade, documentos com descrição e versão nova/antiga, aniversariantes só do mês atual, melhorias de ramais, Meus chamados, acessos rápidos externos, quem leu cada aviso, RH sem exclusão definitiva, evento x treinamento, calendário com hover, e-mail de inscrição e pesquisa comparativa com outras intranets. Sem chat."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controle de acesso pelo administrador (Priority: P1)

O administrador abre uma tela de "Controle de acesso", vê todos os usuários com seu perfil atual (Leitura, Colaborador, RH, Administrador) e altera o acesso de cada um. O botão do topo que hoje permite trocar de perfil deixa de existir: o perfil de cada pessoa só muda por essa tela.

**Why this priority**: É pré-condição para remover a troca de perfil do topo, que hoje confunde e é uma brecha de UX. Sem ela, nenhuma outra mudança de permissão (ex.: RH sem exclusão) tem onde ser gerida.

**Independent Test**: Entrar como ADMIN, mudar o perfil de um colaborador para RH, entrar como esse colaborador e verificar que os menus de gestão aparecem; confirmar que nenhum perfil vê mais o botão de troca no topo.

**Acceptance Scenarios**:

1. **Given** um ADMIN na tela de Controle de acesso, **When** altera o perfil de um usuário e confirma, **Then** a mudança é salva, registrada na auditoria (quem, quando, perfil anterior e novo) e vale no próximo carregamento do usuário afetado.
2. **Given** qualquer usuário logado, **When** olha o topo da tela, **Then** não existe botão nem painel lateral para trocar de perfil.
3. **Given** um ADMIN, **When** tenta remover o próprio acesso de administrador sendo o único ADMIN ativo, **Then** o sistema bloqueia e explica o motivo.
4. **Given** um usuário que não é ADMIN, **When** tenta abrir a tela de Controle de acesso, **Then** é redirecionado ao Início sem ver os dados.
5. **Given** a tela de Controle de acesso, **When** o ADMIN busca por nome, e-mail ou setor e filtra por perfil, **Then** a lista mostra só os usuários correspondentes.
6. **Given** um colaborador sem perfil RH, **When** o ADMIN concede a ele a permissão "Gerenciar eventos", **Then** o colaborador passa a ver e usar a gestão de eventos, e continua sem as demais permissões de RH.
7. **Given** um RH com a permissão "Gerenciar documentos" retirada, **When** tenta acessar a gestão de documentos (pela tela ou diretamente pelo servidor), **Then** o acesso é negado.

### Session 2026-10-28 (Clarifications)

- Q: O controle é só por perfil ou também por permissão individual? → A: Perfil base + permissões extras concedidas/retiradas por usuário (opção B).

---

### User Story 2 - Nova tela Inicial moderna para todos os perfis (Priority: P1)

Colaboradores e gestores entram e veem uma Inicial limpa e moderna, no estilo das interfaces da Apple: cartões em superfície translúcida (vidro fosco) sobre o fundo, hierarquia clara, botões com contraste forte em relação ao fundo. O colaborador vê primeiro o que é para ele (avisos não lidos, próximos eventos com botão "Inscrever-se", aniversariantes do mês, acessos rápidos). O administrador vê uma visão resumida e organizada, sem excesso de números e atalhos.

**Why this priority**: É a primeira tela de todos os usuários e o principal pedido visual. Concentra os ganhos de uso (inscrição direta, lido/não lido).

**Independent Test**: Entrar com um perfil Colaborador e um ADMIN, comparar com a Inicial atual e verificar: inscrição em evento sem sair da Inicial, avisos não lidos destacados, painel do admin com no máximo os blocos definidos.

**Acceptance Scenarios**:

1. **Given** um colaborador na Inicial, **When** clica em "Inscrever-se" num próximo evento com vagas, **Then** a inscrição é feita ali mesmo, o botão passa a "Inscrito" e o número de vagas é atualizado.
2. **Given** avisos que o usuário ainda não abriu, **When** ele vê a Inicial ou a lista de avisos, **Then** cada aviso não lido tem um indicador visível de "não lido" e os já abertos mostram "lido".
3. **Given** eventos novos que o usuário ainda não viu, **When** ele vê a Inicial ou a lista de eventos, **Then** eles aparecem marcados como novos/não vistos até serem abertos.
4. **Given** um ADMIN na Inicial, **When** a tela carrega, **Then** os indicadores aparecem agrupados em no máximo 4 cartões-resumo e as pendências (chamados, solicitações) em uma única área "Precisa da sua atenção".
5. **Given** qualquer tema, **When** a Inicial é exibida, **Then** todo texto e botão atende contraste mínimo de 4,5:1 (texto normal) e 3:1 (componentes e texto grande), inclusive sobre as superfícies translúcidas.
6. **Given** um evento lotado ou encerrado, **When** aparece na Inicial, **Then** o botão de inscrição fica desabilitado com o motivo ("Esgotado", "Encerrado").

---

### User Story 3 - Temas Claro, Escuro e Vinho repensados (Priority: P1)

O usuário escolhe entre Claro, Escuro e Vinho num seletor claro (com prévia de cada tema), em vez de um botão que alterna em ciclo sem mostrar o próximo. Os três temas seguem a nova linguagem visual (translucidez, contraste, cantos e sombras suaves) e a escolha fica salva.

**Why this priority**: Os temas são parte do redesign e hoje a troca é pouco clara. Precisa estar pronto junto com a nova Inicial para não haver duas linguagens visuais.

**Independent Test**: Trocar entre os três temas pelo seletor, recarregar a página e trocar de dispositivo; verificar que o tema escolhido persiste e que nenhuma tela da Inicial fica com texto ilegível.

**Acceptance Scenarios**:

1. **Given** o seletor de aparência aberto, **When** o usuário escolhe um tema, **Then** a interface muda na hora, sem recarregar, e o tema escolhido aparece marcado.
2. **Given** um tema escolhido, **When** o usuário sai e entra de novo (mesmo em outro dispositivo), **Then** o mesmo tema é aplicado.
3. **Given** a opção "Automático", **When** o sistema operacional está em modo escuro, **Then** a intranet usa o tema Escuro.
4. **Given** qualquer um dos três temas, **When** se verifica o contraste de textos e botões, **Then** atende aos mínimos do critério SC-003.

---

### User Story 4 - Configurações de acessibilidade (Priority: P1)

Qualquer usuário, inclusive pessoas com baixa visão, daltonismo, sensibilidade a movimento ou que navegam só pelo teclado, abre "Configurações > Acessibilidade" e ajusta: tamanho do texto, escala da interface (botões e espaçamentos maiores), alto contraste, redução de animações e transparências, destaque de links, foco sempre visível e fonte de leitura facilitada. As preferências ficam salvas na conta.

**Why this priority**: Acessibilidade é exigência para todos os colaboradores de um hospital e afeta todas as telas; precisa entrar junto com a nova base visual.

**Independent Test**: Ativar cada preferência e verificar o efeito na Inicial; navegar a Inicial inteira só com teclado; recarregar e confirmar que as preferências persistem.

**Acceptance Scenarios**:

1. **Given** o tamanho de texto em 150%, **When** o usuário navega pela Inicial e pelo menu, **Then** todo o conteúdo continua legível e utilizável, sem rolagem horizontal e sem texto cortado.
2. **Given** "Alto contraste" ativado, **When** qualquer tela é exibida, **Then** as superfícies translúcidas viram sólidas e textos e bordas atingem contraste mínimo de 7:1.
3. **Given** "Reduzir movimento" ativado, ou o sistema operacional com essa preferência, **When** a interface muda, **Then** não há animações nem transições além de mudanças instantâneas.
4. **Given** um usuário que navega só por teclado, **When** usa Tab pela Inicial, **Then** todo elemento interativo recebe foco visível, em ordem lógica, e há um atalho "Pular para o conteúdo".
5. **Given** preferências salvas, **When** o usuário entra em outro dispositivo, **Then** as mesmas preferências são aplicadas.
6. **Given** a tela de Configurações, **When** o usuário clica em "Restaurar padrão", **Then** todas as preferências voltam ao padrão.

---

### User Story 5 - Documentos com descrição e versão (Priority: P2)

Quem envia um documento é obrigado a escrever uma descrição e a indicar se aquele arquivo é a versão vigente (nova) ou uma versão antiga. Ao enviar uma nova versão de um documento existente, a anterior passa automaticamente a "antiga" e continua acessível no histórico do documento. O colaborador vê sempre a versão vigente em destaque e pode abrir as versões antigas, claramente marcadas como obsoletas.

**Why this priority**: Evita uso de POP ou protocolo desatualizado, que tem risco assistencial; depende só da tela de documentos.

**Independent Test**: Enviar um documento, depois enviar nova versão do mesmo documento; verificar que a central mostra a nova como vigente e que a antiga aparece no histórico com selo "Versão antiga".

**Acceptance Scenarios**:

1. **Given** o formulário de upload, **When** o gestor tenta enviar sem descrição, **Then** o envio é bloqueado com a mensagem "Descrição obrigatória".
2. **Given** o formulário de upload, **When** o gestor envia o arquivo, **Then** ele escolhe obrigatoriamente "Versão nova (vigente)" ou "Versão antiga" e informa o número/rótulo da versão.
3. **Given** um documento com versão vigente, **When** o gestor envia uma nova versão marcada como vigente, **Then** a anterior vira "antiga" automaticamente e ambas ficam no histórico com data, autor e rótulo.
4. **Given** um colaborador abrindo um documento, **When** existem versões antigas, **Then** ele vê a vigente em destaque e uma lista "Versões anteriores"; ao abrir uma antiga, um aviso indica que não é a versão em vigor.
5. **Given** a central de documentos, **When** o colaborador busca, **Then** os resultados mostram por padrão só versões vigentes.

---

### User Story 6 - Aniversariantes só do mês atual (Priority: P2)

A tela de aniversariantes mostra apenas os aniversariantes do mês corrente, sem os botões de outros meses.

**Why this priority**: Pedido simples e direto, de baixo esforço.

**Independent Test**: Abrir a tela de aniversariantes e verificar que só aparece o mês atual e que não há seletor de meses.

**Acceptance Scenarios**:

1. **Given** a data atual em outubro, **When** o usuário abre Aniversariantes do Mês, **Then** vê só os aniversariantes de outubro, ordenados por dia, e o título indica o mês.
2. **Given** a tela de aniversariantes, **When** ela é exibida, **Then** não há botões ou chips de outros meses; os filtros por setor e busca por nome continuam disponíveis.

---

### User Story 7 - Ramais melhores (Priority: P2)

O colaborador encontra rapidamente o ramal de uma pessoa ou de um setor no Diretório: busca única por nome, setor, cargo ou número de ramal, ramal em destaque no cartão, botão para copiar o ramal e agrupamento por setor. O próprio colaborador mantém o seu ramal atualizado no perfil, e o ADMIN pode cadastrar ramais de setores.

**Why this priority**: O diretório é muito usado no dia a dia do hospital; as melhorias são localizadas.

**Independent Test**: Buscar um ramal pelo número e pelo nome do setor, copiar o ramal e atualizar o próprio ramal no perfil.

**Acceptance Scenarios**:

1. **Given** o Diretório, **When** o usuário digita um número de ramal, **Then** aparecem as pessoas e setores com esse ramal.
2. **Given** um cartão de pessoa, **When** o usuário clica em "Copiar ramal", **Then** o ramal vai para a área de transferência e uma confirmação aparece.
3. **Given** o perfil do colaborador, **When** ele edita o ramal com um valor válido (somente dígitos, 3 a 6 caracteres), **Then** o novo ramal aparece no Diretório.
4. **Given** o Diretório, **When** o usuário escolhe "Ver por setor", **Then** vê os setores com o ramal do setor e as pessoas de cada um.

---

### User Story 8 - Meus chamados (Priority: P2)

O colaborador tem no menu o item "Meus chamados", com uma tela que lista os chamados que abriu (identificados), com status, data e resposta, e um botão para abrir um novo chamado.

**Why this priority**: Hoje o colaborador abre o chamado e não tem onde acompanhá-lo; o servidor já fornece os dados.

**Independent Test**: Como colaborador, abrir um chamado, acessar Meus chamados e ver o chamado com status "Aberto"; como ADMIN, mudar o status e verificar a atualização para o colaborador.

**Acceptance Scenarios**:

1. **Given** um colaborador, **When** abre o menu, **Then** vê "Meus chamados".
2. **Given** chamados abertos pelo colaborador, **When** ele acessa a tela, **Then** vê cada chamado com tipo, assunto, data, status e resposta da administração, se houver.
3. **Given** um chamado enviado como anônimo, **When** o colaborador vê Meus chamados, **Then** esse chamado não aparece (para preservar o anonimato) e a tela explica isso.
4. **Given** um usuário com perfil Leitura, **When** abre o menu, **Then** não vê "Meus chamados".

---

### User Story 9 - Acessos rápidos com links externos (Priority: P3)

A Inicial tem acessos rápidos que levam a sistemas externos (site do Hospital Decós e outros sistemas internos), abrindo em nova aba. O ADMIN define os atalhos padrão para todos; cada usuário pode adicionar os próprios atalhos (nome + link), reordenar e remover os seus.

**Why this priority**: Útil, mas não bloqueia nada; depende do redesign da Inicial.

**Independent Test**: ADMIN cadastra o atalho "Site Decós"; um colaborador vê o atalho, adiciona um atalho pessoal e confirma que só ele o vê.

**Acceptance Scenarios**:

1. **Given** um ADMIN, **When** cadastra um atalho global com nome e link, **Then** todos os usuários passam a vê-lo nos acessos rápidos.
2. **Given** um colaborador, **When** clica em "Adicionar atalho" e informa nome e link válido (http/https), **Then** o atalho aparece só para ele.
3. **Given** um atalho externo, **When** o usuário clica nele, **Then** o link abre em nova aba com indicação visual de link externo.
4. **Given** um link inválido ou com protocolo diferente de http/https, **When** o usuário tenta salvar, **Then** o sistema recusa com mensagem clara.

---

### User Story 10 - Leituras, histórico de exclusões, treinamentos e calendário (Priority: P3)

Melhorias complementares:
- O gestor vê quantas pessoas leram cada aviso e a lista de quem leu (nome, setor, data).
- O RH não exclui definitivamente avisos, documentos e eventos: a ação vira "arquivar", e todo arquivamento ou exclusão fica no histórico (quem, quando, o quê); só o ADMIN pode excluir de vez.
- Os eventos são classificados como "Evento" ou "Treinamento", com filtro por tipo.
- No calendário de eventos, ao passar o mouse sobre um dia (ou focar pelo teclado ou tocar no celular), os eventos daquele dia aparecem abaixo do calendário.
- Ao se inscrever num evento, o colaborador recebe um e-mail de confirmação; o organizador pode exportar e receber a lista de inscritos.

**Why this priority**: São ganhos incrementais sobre funcionalidades que já existem.

**Independent Test**: Cada item pode ser testado isoladamente: abrir lista de leitores de um aviso; arquivar como RH e ver o registro no histórico; filtrar eventos por "Treinamento"; passar o mouse num dia do calendário; inscrever-se e receber o e-mail.

**Acceptance Scenarios**:

1. **Given** um aviso lido por 12 pessoas, **When** o gestor abre "Quem leu", **Then** vê 12 nomes com setor e data/hora da leitura.
2. **Given** um usuário RH, **When** escolhe remover um aviso, **Then** o aviso é arquivado (some para os colaboradores, continua recuperável) e o histórico registra a ação.
3. **Given** um ADMIN, **When** abre o histórico de um item arquivado ou excluído, **Then** vê quem fez, quando e qual era o conteúdo.
4. **Given** a lista de eventos, **When** o usuário filtra por "Treinamento", **Then** só aparecem treinamentos.
5. **Given** o calendário de eventos, **When** o usuário passa o mouse sobre um dia com eventos, **Then** a área abaixo do calendário mostra os eventos desse dia; ao sair, volta ao conteúdo padrão.
6. **Given** um colaborador que se inscreveu, **When** a inscrição é confirmada, **Then** ele recebe em até 5 minutos um e-mail com título, data, local do evento e como cancelar.

---

### User Story 11 - Pesquisa comparativa com outras intranets (Priority: P1, insumo do redesign)

Antes de fechar o visual da nova Inicial, a equipe compara a intranet Decós com intranets corporativas e hospitalares de referência, e registra o que adotar.

**Why this priority**: Orienta as histórias 2, 3 e 4; precisa sair antes do design final.

**Independent Test**: Existe um documento de comparação revisado pela equipe, com pelo menos 5 referências e uma lista priorizada de melhorias adotadas ou descartadas.

**Acceptance Scenarios**:

1. **Given** a pesquisa concluída, **When** a equipe revisa o documento, **Then** ele compara pelo menos 5 intranets ou plataformas de intranet em: Inicial, navegação, avisos, eventos, documentos, diretório, acessibilidade e personalização.
2. **Given** cada recurso identificado, **When** listado no documento, **Then** traz a decisão (adotar agora, depois, ou descartar) e o motivo.

---

### User Story 12 - Foto do evento em carrossel na Inicial (Priority: P2)

*Pedido do usuário em 2026-10-29, depois da primeira entrega.* Cada evento ou treinamento pode ter uma foto de capa, enviada por quem gerencia eventos. A Inicial mostra um carrossel com os próximos eventos: foto, tipo, título, data, horário, local e o botão de inscrição. Evento sem foto aparece com um fundo da marca.

**Why this priority**: Deixa a Inicial mais atrativa e chama a atenção para inscrições, sem custo para quem não usa fotos.

**Independent Test**: Como gestor, enviar a foto de um evento; como colaborador, ver o carrossel na Inicial com a foto, avançar os slides pelas setas, pontos e teclado, e se inscrever pelo próprio slide.

**Acceptance Scenarios**:

1. **Given** o formulário de evento, **When** o gestor escolhe uma imagem JPG, PNG ou WEBP de até 5 MB, **Then** vê uma prévia e, ao salvar, a foto passa a ser a capa do evento; outro formato ou tamanho é recusado com mensagem clara.
2. **Given** próximos eventos publicados, **When** o colaborador abre a Inicial, **Then** vê um carrossel com até 5 eventos, com foto (ou fundo da marca), tipo, título, data, local e botão de inscrição ou "Ver detalhes".
3. **Given** o carrossel, **When** o usuário usa as setas, os pontos ou o teclado, **Then** troca de slide; a troca automática pausa com o mouse ou o foco em cima e não acontece com "Reduzir movimento".
4. **Given** um evento com foto, **When** o usuário abre o detalhe, **Then** vê a mesma foto no topo.



- ADMIN tenta rebaixar o último ADMIN ativo: bloqueado (US1).
- Usuário tem o perfil alterado enquanto está logado: a mudança vale na próxima ação que consulta o servidor; menus sem permissão somem e rotas restritas redirecionam ao Início.
- Navegador sem suporte a efeito de vidro fosco: as superfícies caem para fundo sólido com o mesmo contraste.
- Texto em 200% em celular (320 px de largura): o layout reorganiza em uma coluna, sem rolagem horizontal.
- Alto contraste combinado com tema Vinho: alto contraste prevalece sobre a translucidez.
- Duas pessoas se inscrevem ao mesmo tempo na última vaga: só uma fica inscrita; a outra vê "Esgotado".
- Envio de nova versão de documento falha no meio: a versão vigente anterior continua vigente.
- Documento com apenas versões antigas (nenhuma vigente): a central sinaliza "Sem versão vigente" para o gestor.
- Atalho externo cujo site saiu do ar: o atalho continua; o erro é do site de destino.
- Servidor de e-mail indisponível: a inscrição é concluída mesmo assim e o envio é tentado de novo depois.
- Aviso lido antes desta mudança: as leituras já registradas continuam valendo para o indicador lido/não lido.

## Requirements *(mandatory)*

### Functional Requirements

**Controle de acesso**
- **FR-001**: O sistema MUST oferecer ao ADMIN uma tela "Controle de acesso" com a lista de usuários, perfil atual, setor, situação (ativo/inativo) e último acesso, com busca e filtro por perfil e setor.
- **FR-002**: O ADMIN MUST poder alterar o perfil de qualquer usuário entre Leitura, Colaborador, RH e Administrador, e ativar ou desativar o acesso dele.
- **FR-003**: O ADMIN MUST poder conceder ou retirar permissões individuais de um usuário além do perfil base (ex.: um colaborador que gerencia eventos sem ser RH). A permissão efetiva é: permissões do perfil + concedidas − retiradas. A tela MUST mostrar, para cada permissão, se vem do perfil ou de ajuste individual, e permitir "voltar ao padrão do perfil". Permissões exclusivas de administração (gerir usuários e acessos, auditoria) só podem vir do perfil Administrador.
- **FR-003a**: O servidor MUST aplicar a permissão efetiva em toda ação protegida; a interface só reflete o que o servidor autoriza.
- **FR-004**: Toda alteração de perfil ou permissão MUST ser registrada na auditoria com autor, data, usuário afetado, valor anterior e novo.
- **FR-005**: O sistema MUST impedir que o último ADMIN ativo perca o perfil de administrador ou seja desativado.
- **FR-006**: O botão e o painel de troca de perfil no topo MUST ser removidos para todos os perfis.

**Inicial e linguagem visual**
- **FR-007**: A Inicial MUST ter versões por perfil: colaborador (avisos não lidos, próximos eventos com inscrição, aniversariantes do mês, acessos rápidos) e gestor/ADMIN (até 4 cartões-resumo, área "Precisa da sua atenção" e atalhos de gestão).
- **FR-008**: Usuários com permissão de interagir MUST poder se inscrever e cancelar inscrição em eventos diretamente pela Inicial.
- **FR-009**: O sistema MUST indicar "lido" e "não lido" por usuário em avisos (Inicial e lista de avisos) e "novo" em eventos ainda não abertos.
- **FR-010**: A nova linguagem visual MUST usar superfícies translúcidas com desfoque de fundo, com alternativa sólida quando o recurso não existir ou o usuário pedir redução de transparência.
- **FR-011**: Botões principais MUST se destacar do fundo com contraste mínimo de 3:1 da borda/preenchimento e 4,5:1 do texto, em todos os temas.

**Temas**
- **FR-012**: O usuário MUST escolher o tema (Claro, Escuro, Vinho ou Automático) num seletor que mostra todas as opções com prévia, substituindo o botão de troca em ciclo.
- **FR-013**: A escolha de tema MUST ser salva na conta do usuário e aplicada em qualquer dispositivo em que ele entrar.

**Acessibilidade**
- **FR-014**: O sistema MUST ter uma tela de Configurações com seção de Acessibilidade, acessível a todos os perfis, inclusive Leitura.
- **FR-015**: O usuário MUST poder ajustar o tamanho do texto (pelo menos 100%, 125%, 150%, 175% e 200%) e a escala da interface (normal, confortável, ampla).
- **FR-016**: O usuário MUST poder ativar alto contraste, reduzir movimento, reduzir transparência, sublinhar links, foco reforçado e fonte de leitura facilitada.
- **FR-017**: O sistema MUST respeitar por padrão as preferências do sistema operacional de movimento reduzido, contraste e tema escuro, enquanto o usuário não escolher outra coisa.
- **FR-018**: As preferências de acessibilidade MUST ser salvas na conta e aplicadas antes da primeira exibição da tela, sem "piscar" o visual padrão.
- **FR-019**: Todas as telas alteradas MUST funcionar só com teclado, com foco visível, ordem lógica, link "Pular para o conteúdo" e rótulos legíveis por leitor de tela.

**Documentos**
- **FR-020**: O upload e a edição de documentos MUST exigir descrição (mínimo de 10 caracteres).
- **FR-021**: O upload MUST exigir o estado da versão (vigente ou antiga) e o rótulo da versão.
- **FR-022**: Enviar nova versão vigente MUST tornar a anterior "antiga" automaticamente, mantendo arquivo, rótulo, data e autor de cada versão.
- **FR-023**: O colaborador MUST ver a versão vigente em destaque e poder abrir versões antigas, sempre com aviso de versão obsoleta.
- **FR-024**: A busca da central MUST mostrar por padrão só documentos vigentes, com opção de incluir versões antigas.

**Aniversariantes, ramais e chamados**
- **FR-025**: A tela de aniversariantes MUST mostrar só o mês corrente, sem seletor de meses, mantendo filtro por setor e busca.
- **FR-026**: O Diretório MUST buscar por nome, setor, cargo e número de ramal, destacar o ramal, permitir copiar o ramal e agrupar por setor.
- **FR-027**: O colaborador MUST poder editar o próprio ramal (somente dígitos, 3 a 6 caracteres); o ADMIN MUST poder editar o ramal de setores e de qualquer usuário.
- **FR-028**: Usuários com permissão de interagir MUST ter "Meus chamados" no menu, com lista de chamados identificados (tipo, assunto, data, status, resposta) e botão para abrir novo chamado; chamados anônimos não aparecem.

**Complementares**
- **FR-029**: O ADMIN MUST gerenciar atalhos globais (nome, link, ícone, ordem); cada usuário MUST poder adicionar, reordenar e remover atalhos pessoais; só links http/https são aceitos e abrem em nova aba.
- **FR-030**: Gestores MUST ver, por aviso, o total e a lista de quem leu (nome, setor, data/hora).
- **FR-031**: O RH MUST apenas arquivar avisos, documentos e eventos; a exclusão definitiva MUST ser exclusiva do ADMIN; arquivamentos, restaurações e exclusões MUST ficar no histórico com autor, data e conteúdo anterior.
- **FR-032**: Eventos MUST ter tipo "Evento" ou "Treinamento", com filtro por tipo na lista e no calendário.
- **FR-033**: No calendário, passar o mouse, focar pelo teclado ou tocar num dia MUST mostrar os eventos daquele dia abaixo do calendário.
- **FR-034**: Ao confirmar uma inscrição, o sistema MUST enviar e-mail de confirmação ao inscrito; o organizador MUST poder exportar a lista de inscritos (planilha) e recebê-la por e-mail.

**Foto do evento (US12)**
- **FR-038**: Quem gerencia eventos MUST poder enviar, trocar e remover a foto de capa de um evento (JPG, PNG ou WEBP, até 5 MB; o servidor confere o conteúdo real). A foto fica no armazenamento privado, nunca no banco.
- **FR-039**: A Inicial MUST exibir um carrossel acessível com até 5 próximos eventos (foto ou fundo da marca, tipo, título, data, local e ação de inscrição), com setas, pontos de 24 px ou mais, teclado, pausa com mouse ou foco e sem troca automática quando o movimento estiver reduzido. O texto sobre a foto MUST manter contraste mínimo de 4,5:1.
- **FR-040**: O detalhe do evento MUST mostrar a foto de capa quando houver.

**Pesquisa**
- **FR-035**: A equipe MUST produzir um documento comparando a intranet Decós com pelo menos 5 intranets ou plataformas de intranet de referência (corporativas e hospitalares), com decisões priorizadas que alimentem o redesign.

**Fora de escopo**
- **FR-036**: Chat (entre usuários ou com documentos) está fora do escopo.
- **FR-037**: Redesign das demais telas (Eventos, Documentos, Avisos, Admin internas) fica para uma especificação posterior; nesta entrega elas só recebem a nova base de temas e acessibilidade.

### Key Entities

- **Usuário**: pessoa com acesso; perfil (Leitura, Colaborador, RH, Administrador), situação, setor, ramal.
- **Permissão**: capacidade nomeada (ex.: interagir, baixar, gerenciar avisos, documentos, FAQ, eventos, chamados, avaliações, usuários, auditoria).
- **Ajuste de permissão**: por usuário, uma permissão concedida ou retirada em relação ao perfil base.
- **Alteração de acesso**: registro de auditoria de mudança de perfil/permissão: autor, usuário afetado, antes, depois, data.
- **Preferências do usuário**: tema, tamanho do texto, escala, alto contraste, redução de movimento e transparência, sublinhado de links, foco reforçado, fonte de leitura.
- **Documento**: título, descrição, categoria, setor; possui várias **Versões de documento** (rótulo, estado vigente/antiga, arquivo, autor, data).
- **Leitura**: registro de que um usuário abriu um aviso ou evento, com data.
- **Atalho**: nome, link, ícone, ordem; global (do ADMIN) ou pessoal (de um usuário).
- **Evento**: passa a ter tipo (Evento ou Treinamento).
- **Registro de histórico**: arquivamento, restauração ou exclusão de conteúdo, com autor, data e cópia do conteúdo anterior.
- **Chamado**: já existente; exibido ao autor quando identificado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma tela exibe opção de troca de perfil; 100% das mudanças de perfil feitas na tela de Controle de acesso aparecem na auditoria.
- **SC-002**: Um colaborador se inscreve num evento a partir da Inicial em até 2 cliques e menos de 10 segundos.
- **SC-003**: 100% dos textos e botões da Inicial, do menu e das Configurações atendem WCAG 2.2 nível AA nos três temas (contraste 4,5:1 para texto e 3:1 para componentes), e 7:1 com alto contraste ativado.
- **SC-004**: A Inicial, o menu e as Configurações continuam utilizáveis com texto em 200% e em telas de 320 px de largura, sem rolagem horizontal.
- **SC-005**: Todas as funções da Inicial e das Configurações podem ser executadas só com teclado.
- **SC-006**: A nota de acessibilidade em auditoria automatizada da Inicial é de pelo menos 95/100, no desktop e no celular.
- **SC-007**: A visão do ADMIN na Inicial tem no máximo 4 cartões-resumo e 1 área de pendências (hoje há mais de 10 blocos).
- **SC-008**: Em teste com pelo menos 5 colaboradores, 80% acham um ramal em menos de 15 segundos e 80% avaliam a nova Inicial como "mais clara" que a atual.
- **SC-009**: Em 100% dos documentos com mais de uma versão, só uma aparece como vigente na busca padrão.
- **SC-010**: 95% dos e-mails de confirmação de inscrição chegam em até 5 minutos.

## Assumptions

- O stack atual é mantido (frontend estático e API existente); não há troca de framework nesta entrega.
- Os 4 perfis atuais continuam existindo; a tela de Controle de acesso os gerencia.
- "Estilo Apple" significa: superfícies translúcidas com desfoque, cantos arredondados generosos, tipografia limpa, hierarquia por espaço em vez de bordas, sombras suaves e animações discretas, sempre subordinados ao contraste e à acessibilidade.
- "Versão antiga" é sempre de um documento existente; ver "antiga x nova" significa abrir cada versão do histórico, não um comparador de texto lado a lado.
- O RH "sem exclusão" vira arquivamento recuperável; só o ADMIN exclui de vez.
- O envio de e-mail depende de um serviço de e-mail transacional a ser contratado/configurado; se ele não estiver pronto, o resto da US10 é entregue sem o e-mail.
- "Marketing" citado pelo usuário é tratado como parte do perfil RH (gestão de conteúdo); não é criado perfil novo.
- O "local de login" pedido pelo usuário foi substituído pela tela de Controle de acesso, conforme a conversa.
- O acesso sem login (somente visualização) não entra nesta entrega.
- Leituras de avisos já registradas são reaproveitadas.
