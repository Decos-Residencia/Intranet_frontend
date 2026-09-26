/* =========================================================================
   Intranet Hospital Decós — Base de dados mock (local, sem backend)
   Tudo em window.DB para funcionar mesmo abrindo o index.html via file://
   ========================================================================= */
window.DB = (function () {
  // "Hoje" do protótipo: um único dia fixo (não o relógio real do dispositivo),
  // igual ao resto do mock (ex.: avisos com "Hoje, 07 de Setembro de 2026").
  // Tudo que depende de "aniversariante do dia" lê daqui.
  const hojeDia = 23;

  const usuario = {
    nome: "Ana Paula Santos",
    nomeCompleto: "Ana Paula Santos de Oliveira",
    iniciais: "AS",
    cargo: "Analista de Gestão da Qualidade Sênior",
    cargoCurto: "Gestão de Qualidade",
    setor: "Qualidade e Segurança do Paciente",
    email: "anapaula.santos@decos.com",
    matricula: "#DEC202688",
    unidade: "Sede Central",
    andar: "4º Andar - Bloco Administrativo",
    ramal: "#4402",
    admissao: "15 de Fevereiro de 2024",
    nascimento: "23 de Setembro de 1993",
    diaAniversario: hojeDia,
  };

  // categorias de avisos e suas cores (classes utilitárias definidas em styles.css)
  const categorias = {
    comunicado: { label: "Comunicado", tone: "blue" },
    evento:     { label: "Evento", tone: "amber" },
    promocao:   { label: "Promoção", tone: "green" },
    urgente:    { label: "Urgente", tone: "red" },
    noticia:    { label: "Notícia", tone: "teal" },
    relevante:  { label: "Relevante", tone: "blue" },
  };

  const avisos = [
    {
      id: 1, categoria: "urgente", extra: "comunicado",
      titulo: "ALERTA: Suspensão Emergencial do Sistema de Prontuário PEP - Ação Imediata Necessária",
      resumo: "O sistema PEP encontra-se temporariamente indisponível por falha crítica de infraestrutura. Todas as alas devem adotar o protocolo manual de registros até nova comunicação da TI. Aguardem instruções complementares.",
      data: "Hoje, 07 de Setembro de 2026", dataCurta: "07 set. de 2026",
      autor: "Tecnologia da Informação", autorSigla: "TI",
      tags: ["⚠ Afeta todas as alas", "Protocolo manual ativo"],
      cta: "Ver comunicado urgente",
      conteudo: [
        "O sistema PEP (Prontuário Eletrônico do Paciente) encontra-se temporariamente indisponível devido a uma falha crítica de infraestrutura identificada na madrugada de hoje.",
        "Todas as alas assistenciais devem adotar imediatamente o protocolo manual de registros clínicos até nova comunicação oficial da equipe de Tecnologia da Informação.",
        "A previsão de normalização é de até 4 horas. Registros manuais deverão ser digitalizados assim que o sistema retornar."
      ],
    },
    {
      id: 2, categoria: "noticia",
      titulo: "Time de Enfermagem do Decós Conquista Certificação de Excelência em Cuidado ao Paciente",
      resumo: "Em cerimônia realizada na última quarta-feira, o Hospital Decós recebeu a certificação de excelência do Conselho Regional de Enfermagem, reconhecendo as práticas assistenciais da equipe.",
      data: "06 de Setembro de 2026", dataCurta: "06 set. de 2026",
      autor: "Enfermagem", autorSigla: "En",
      imagem: true, cta: "Ler matéria completa",
      conteudo: [
        "Em cerimônia realizada na última quarta-feira, o Hospital Decós recebeu a certificação de excelência do Conselho Regional de Enfermagem.",
        "O reconhecimento valoriza as práticas assistenciais seguras e humanizadas adotadas por toda a equipe multidisciplinar."
      ],
    },
    {
      id: 3, categoria: "comunicado", extra: "relevante",
      titulo: "Nova Política de Crachás e Controle de Acesso Biométrico e Facial",
      resumo: "A partir do dia 15/09, a entrada de todos os colaboradores do complexo hospitalar será feita exclusivamente pelo novo leitor facial e crachá atualizado.",
      data: "05 de Setembro de 2026", dataCurta: "02 set. de 2026",
      autor: "Recursos Humanos", autorSigla: "RH",
      cta: "Ler comunicado na íntegra",
      conteudo: [
        "Prezados colaboradores, comunicamos que a partir do próximo dia 15/09 iniciaremos a implantação do novo sistema integrado de controle de acesso biométrico e por reconhecimento facial nas dependências do Hospital Decós.",
        "Esta medida visa aumentar a segurança de nossos pacientes, corpo clínico e demais profissionais de apoio, garantindo o monitoramento preciso do fluxo de pessoas em áreas restritas (CTIs, farmácias de manipulação e laboratórios).",
        "Pontos fundamentais para atenção imediata:",
        "• O cadastramento facial será realizado no posto de RH (Bloco B, Sala 12) de segunda a sexta, das 8h às 18h;",
        "• Todos os colaboradores ativos deverão atualizar sua foto até o dia 12/09;",
        "• Crachás antigos sem chip RFID não serão válidos para acionamento das catracas a partir de 15/09.",
        "Contamos com a colaboração de todos para que esta transição ocorra de maneira fluida e segura."
      ],
    },
    {
      id: 4, categoria: "evento",
      titulo: "Treinamento de Brigada de Incêndio - Turma Setembro",
      resumo: "Convocamos os novos indicados das equipes administrativas e de assistência médica para a primeira etapa prática que ocorrerá no pátio interno.",
      data: "04 de Setembro de 2026", dataCurta: "01 set. de 2026",
      autor: "SESMT", autorSigla: "SE",
      cta: "Ler comunicado na íntegra",
      conteudo: [
        "Convocamos os novos indicados das equipes administrativas e de assistência médica para a primeira etapa prática do treinamento de brigada de incêndio.",
        "A atividade ocorrerá no pátio interno sob supervisão do Corpo de Bombeiros Civil."
      ],
    },
    {
      id: 5, categoria: "promocao",
      titulo: "Parceria com Academia Local: Desconto de até 40% na Mensalidade",
      resumo: "Mais qualidade de vida! Apresente seu holerite Decós atualizado na rede Movimento e ganhe isenção de matrícula e tarifas diferenciadas.",
      data: "02 de Setembro de 2026", dataCurta: "29 ago. de 2026",
      autor: "Benefícios", autorSigla: "Be",
      cta: "Ler comunicado na íntegra",
      conteudo: [
        "Mais qualidade de vida para você! Firmamos uma nova parceria com a rede de academias Movimento.",
        "Apresente seu holerite Decós atualizado em qualquer unidade e ganhe isenção de matrícula e tarifas diferenciadas na mensalidade."
      ],
    },
    {
      id: 6, categoria: "comunicado",
      titulo: "Manutenção Preventiva nos Sistemas de Prontuário Eletrônico",
      resumo: "No próximo sábado, o sistema PEP passará por uma atualização de infraestrutura programada. Solicitamos a atenção de todas as alas cirúrgicas.",
      data: "28 de Agosto de 2026", dataCurta: "27 ago. de 2026",
      autor: "Tecnologia da Informação", autorSigla: "TI",
      cta: "Ler comunicado na íntegra",
      conteudo: [
        "No próximo sábado, o sistema PEP passará por uma atualização de infraestrutura programada.",
        "O sistema de faturamento e o portal de ramais ficarão indisponíveis das 22h às 02h. Solicitamos a atenção de todas as alas cirúrgicas."
      ],
    },
  ];

  const eventos = [
    { id: 1, dia: "08", mes: "SET", tag: "Obrigatório", titulo: "Treinamento Anual NR-32 de Biossegurança",
      desc: "Curso obrigatório para todas as equipes de enfermagem, apoio assistencial e limpeza do hospital Decós.",
      horario: "14:00 - 17:00", local: "Auditório Central (Bloco A)", organizador: "SESMT", vagas: "28/40", vagasDisp: 12,
      longa: [
        "A Norma Regulamentadora 32 (NR-32) tem por finalidade estabelecer as diretrizes básicas para a implementação de medidas de proteção à segurança e à saúde dos trabalhadores dos serviços de saúde. O objetivo deste treinamento anual é capacitar as equipes na prevenção de acidentes e incidentes de trabalho cotidianos em nosso complexo hospitalar.",
        "Serão abordados tópicos fundamentais como riscos biológicos, descarte de resíduos químicos e perfurocortantes, uso correto de equipamentos de proteção individual (EPIs), ergonomia hospitalar e protocolos de higiene de alta performance. A presença é obrigatória para os setores indicados.",
        "Nota importante: O não comparecimento sem justificativa prévia homologada pela chefia imediata resultará em reagendamento obrigatório com penalidade no painel de compliance do setor."
      ] },
    { id: 2, dia: "12", mes: "SET", tag: "Campanha", titulo: "Campanha de Vacinação Contra Influenza - Colaboradores",
      desc: "Dose anual liberada para todos os setores de atendimento e retaguarda. Lembre-se de levar sua caderneta física.",
      horario: "08:00 - 17:00", local: "Ambulatório de Especialidades", organizador: "Medicina do Trabalho", vagas: "—", vagasDisp: 0 },
    { id: 3, dia: "18", mes: "SET", tag: "Institucional", titulo: "Reunião de Alinhamento Geral de Metas Financeiras Q4",
      desc: "Apresentação e planejamento de metas para os setores faturamento, recepção e administrativo.",
      horario: "09:00 - 10:30", local: "Sala de Reuniões Principal", organizador: "Diretoria", vagas: "—", vagasDisp: 0 },
    { id: 4, dia: "22", mes: "SET", tag: "SIPAT", titulo: "SIPAT Decós 2026 - Semana de Prevenção de Acidentes",
      desc: "Palestras interativas sobre ergonomia no ambiente corporativo e controle de estresse térmico.",
      horario: "10:00 - 12:00", local: "Plataforma de Videoconferência (Online)", organizador: "SESMT", vagas: "—", vagasDisp: 0 },
    { id: 5, dia: "25", mes: "SET", tag: "Obrigatório", titulo: "Simulado Prático de Brigada de Incêndio",
      desc: "Treinamento prático sob coordenação do Corpo de Bombeiros Civil. Alerta para as rotas de fuga do Bloco B.",
      horario: "15:00 - 16:30", local: "Estacionamento Externo", organizador: "SESMT", vagas: "—", vagasDisp: 0 },
  ];

  const aniversariantes = [
    { nome: "Mariana Costa", cargo: "Recepcionista Pleno", setor: "Recepção", dia: 3 },
    { nome: "Rafael Almeida", cargo: "Auxiliar de Contas", setor: "Faturamento", dia: 6 },
    { nome: "Juliana Ribeiro", cargo: "Enfermeira Chefe", setor: "Enfermagem", dia: 9 },
    { nome: "Carlos Mendes", cargo: "Analista de DP", setor: "RH", dia: 12 },
    { nome: "Fernanda Lima", cargo: "Suporte de Redes", setor: "TI", dia: 15 },
    { nome: "Bruno Ferreira", cargo: "Farmacêutico Clínico", setor: "Farmácia", dia: 19 },
    { nome: "Patrícia Souza", cargo: "Líder de Atendimento", setor: "Recepção", dia: 23 },
    { nome: "Diego Martins", cargo: "Analista de Sistemas", setor: "TI", dia: 28 },
  ];

  const documentos = [
    { id: 1, tipo: "POP", cor: "red", titulo: "POP - Higienização das Mãos", data: "05 de Setembro de 2026",
      desc: "Normas vigentes para higienização simples e cirúrgica das mãos em toda a equipe multidisciplinar de assistência médica.",
      tamanho: "1.4 MB", download: false, arquivo: "POP_Higienizacao_Maos_v2.pdf",
      versao: "2.0 (Vigente)", criadoPor: "SCIH - Controle de Infecção", setor: "Gestão de Qualidade", atualizado: "05/09/2026" },
    { id: 2, tipo: "MANUAL", cor: "amber", titulo: "Manual de Biossegurança Geral", data: "18 de Agosto de 2026",
      desc: "Manual completo descrevendo normas de segurança biológica, manuseio de descartes e uso de EPIs por setor.",
      tamanho: "4.2 MB", download: false, arquivo: "Manual_Biosseguranca_Geral.pdf",
      versao: "3.1 (Vigente)", criadoPor: "Medicina do Trabalho", setor: "SESMT", atualizado: "18/08/2026" },
    { id: 3, tipo: "PROTOCOLO", cor: "blue", titulo: "Protocolo de Classificação de Risco", data: "29 de Agosto de 2026",
      desc: "Protocolo atualizado para triagem e classificação de risco (Manchester) para o pronto atendimento Decós.",
      tamanho: "2.1 MB", download: true, arquivo: "Protocolo_Manchester.pdf",
      versao: "1.5 (Vigente)", criadoPor: "Pronto Atendimento", setor: "Assistencial", atualizado: "29/08/2026" },
    { id: 4, tipo: "FORMULÁRIO", cor: "green", titulo: "Notificação de Eventos Adversos", data: "01 de Setembro de 2026",
      desc: "Ficha padrão para preenchimento obrigatório e reporte imediato à equipe do Núcleo de Segurança do Paciente.",
      tamanho: "420 KB", download: true, icone: "W", arquivo: "Ficha_Eventos_Adversos.docx",
      versao: "2.0 (Vigente)", criadoPor: "Núcleo de Qualidade", setor: "Qualidade", atualizado: "01/09/2026" },
    { id: 5, tipo: "POP", cor: "red", titulo: "POP - Administração de Medicamentos", data: "25 de Agosto de 2026",
      desc: "Procedimento Operacional Padrão contendo a checagem dupla dos 9 certos na dispensação e infusão de fármacos.",
      tamanho: "1.8 MB", download: true, arquivo: "POP_Administracao_Medicamentos.pdf",
      versao: "1.2 (Vigente)", criadoPor: "Farmácia Clínica", setor: "Farmácia", atualizado: "25/08/2026" },
    { id: 6, tipo: "MANUAL", cor: "amber", titulo: "Manual de Prevenção de Infecção (SCIH)", data: "12 de Agosto de 2026",
      desc: "Guia institucional com as melhores condutas para desinfecção e higienização em áreas de terapia intensiva.",
      tamanho: "3.8 MB", download: true, arquivo: "Manual_SCIH.pdf",
      versao: "2.3 (Vigente)", criadoPor: "SCIH", setor: "Controle de Infecção", atualizado: "12/08/2026" },
  ];

  const faq = [
    { cat: "rh", pergunta: "Como solicitar minhas férias no portal do colaborador?",
      resposta: "A solicitação de férias deve ser realizada via Portal do Colaborador (Menu > Meus Dados > Férias) com antecedência mínima de 45 dias da data de início desejada. O pedido passará por validação e aprovação de escala pela sua respectiva coordenação de enfermagem ou gerência administrativa e depois finalizado pelo setor de Recursos Humanos." },
    { cat: "financeiro", pergunta: "Como acessar o contracheque e demonstrativo de pagamento online?",
      resposta: "O contracheque mensal está disponível digitalmente a partir do 5º dia útil de cada mês. Acesse a intranet Decós, clique na aba \"Recursos Humanos\" > \"Demonstrativo Financeiro\", insira seu CPF e sua senha única cadastrada para realizar a visualização e impressão do arquivo seguro em formato PDF." },
    { cat: "rh", pergunta: "Qual o procedimento correto para troca de turnos e folgas de plantão?",
      resposta: "As trocas de turno devem ser formalizadas via sistema de escalas com no mínimo 72h de antecedência e aprovadas pela chefia imediata de ambos os colaboradores envolvidos." },
    { cat: "administrativo", pergunta: "Como registrar horas extras e qual o fluxo de autorização gerencial?",
      resposta: "Horas extras só são válidas quando previamente autorizadas pela gerência do setor no sistema de ponto eletrônico. O registro deve ser feito no mesmo dia da ocorrência." },
    { cat: "assistencial", pergunta: "Onde encontro a versão atualizada dos POPs e manuais assistenciais?",
      resposta: "Todos os documentos vigentes estão na Central de Documentos & POPs da intranet, sempre com a versão homologada mais recente validada pelo Núcleo de Qualidade e SCIH." },
    { cat: "ti", pergunta: "Como solicitar assistência técnica para computadores e sistemas integrados (PEP)?",
      resposta: "Abra um chamado no portal de TI (ícone de suporte) descrevendo o problema, patrimônio do equipamento e setor. O SLA padrão de atendimento é de 4 horas úteis." },
    { cat: "administrativo", pergunta: "Quais são as regras de vestimenta (dress code) e uso de adereços em áreas críticas?",
      resposta: "Em áreas críticas (CTI, Centro Cirúrgico) é obrigatório o uso de pijama cirúrgico, sem adereços, unhas curtas e cabelos presos, conforme protocolo de segurança do paciente." },
  ];

  const faqCategorias = [
    { key: "todas", label: "Todas" },
    { key: "rh", label: "Recursos Humanos (RH)" },
    { key: "ti", label: "TI & Sistemas" },
    { key: "financeiro", label: "Financeiro" },
    { key: "administrativo", label: "Administrativo" },
    { key: "assistencial", label: "Assistencial" },
  ];

  const ramais = [
    { nome: "Ana Paula Santos", cargo: "Gestor de Qualidade", setor: "Qualidade", andar: "3º Andar", email: "anapaula@decos.com", ramal: "4421" },
    { nome: "Rafael Almeida", cargo: "Coordenador de Faturamento", setor: "Faturamento", andar: "Térreo", email: "rafael.almeida@decos.com", ramal: "1002" },
    { nome: "Juliana Ribeiro", cargo: "Enfermeira Chefe", setor: "UTI Geral", andar: "2º Andar", email: "juliana.ribeiro@decos.com", ramal: "2115" },
    { nome: "Carlos Mendes", cargo: "Analista de RH", setor: "Recursos Humanos", andar: "4º Andar", email: "carlos.mendes@decos.com", ramal: "4010" },
    { nome: "Fernanda Lima", cargo: "Engenheiro de TI", setor: "Tecnologia", andar: "4º Andar", email: "fernanda.lima@decos.com", ramal: "4040" },
    { nome: "Bruno Ferreira", cargo: "Farmacêutico Clínico", setor: "Farmácia", andar: "1º Andar", email: "bruno.ferreira@decos.com", ramal: "1550" },
    { nome: "Patrícia Souza", cargo: "Recepcionista Pleno", setor: "Recepção Central", andar: "Térreo", email: "patricia.souza@decos.com", ramal: "1000" },
    { nome: "Diego Martins", cargo: "Suporte Técnico TI", setor: "Tecnologia", andar: "4º Andar", email: "diego.martins@decos.com", ramal: "4042" },
    { nome: "Mariana Costa", cargo: "Recepcionista Ambulatório", setor: "Ambulatório", andar: "Térreo", email: "mariana.costa@decos.com", ramal: "1024" },
    { nome: "André Silva", cargo: "Médico Intensivista", setor: "UTI Adulto", andar: "2º Andar", email: "andre.silva@decos.com", ramal: "2110" },
  ];

  // ---- Acessos Rápidos (atalhos exibidos na tela de Início) ----
  const acessosRapidos = [
    { icon: "megaphone", titulo: "Mural de Avisos", route: "#/avisos" },
    { icon: "gift", titulo: "Aniversariante do Dia", route: "#/aniversariantes/hoje" },
    { icon: "calendar", titulo: "Eventos", route: "#/eventos" },
    { icon: "file-text", titulo: "Documentos & POPs", route: "#/documentos" },
    { icon: "help-circle", titulo: "FAQ", route: "#/faq" },
    { icon: "users", titulo: "Diretório & Ramais", route: "#/diretorio" },
    { icon: "printer", titulo: "Chamado de TI", chamado: "ti" },
    { icon: "shield", titulo: "Reportar Evento Adverso", chamado: "evento-adverso" },
    { icon: "user", titulo: "Meu Perfil", route: "#/perfil" },
    { icon: "bell", titulo: "Notificações", route: "#/notificacoes" },
  ];

  // id estável: o estado "lida" é salvo por id, então incluir notificações
  // novas não bagunça quais já foram lidas.
  const notificacoes = [
    { id: "u1", rota: "#/avisos/1", tipo: "urgente", urgente: true, icone: "alert-triangle", titulo: "Sistema de prontuário PEP fora do ar", texto: "Falha crítica de infraestrutura. Todas as alas devem adotar o protocolo manual de registros imediatamente até nova comunicação da TI.", tempo: "há 15 minutos", lida: false },
    { id: "n1", rota: "#/avisos/3", tipo: "aviso", icone: "megaphone", titulo: "Novo comunicado importante publicado", texto: 'A equipe de Recursos Humanos publicou: "Nova Política de Crachás e Controle de Acesso Biométrico".', tempo: "há 2 horas", lida: false },
    { id: "n2", rota: "#/eventos/1", tipo: "evento", icone: "calendar", titulo: "Treinamento próximo esta semana", texto: '"Treinamento Anual NR-32 de Biossegurança" ocorrerá amanhã às 14h00 no Auditório Central.', tempo: "há 4 horas", lida: false },
    { id: "n3", rota: "#/documentos/1", tipo: "documento", icone: "file-text", titulo: "POP atualizado e vigente", texto: 'O documento "POP-042: Protocolo de Higienização de Leitos de Isolamento" foi revisado e aprovado.', tempo: "há 6 horas", lida: false },
    { id: "n4", rota: "#/aniversariantes", tipo: "aniversario", icone: "gift", titulo: "Aniversariante do dia no seu setor", texto: "Hoje é aniversário de Mariana Costa (Recepção). Deseje os parabéns!", tempo: "hoje às 08:00", lida: false },
    { id: "n5", rota: "#/avisos/3", tipo: "aviso", icone: "megaphone", titulo: "Parceria Acadêmica e Benefício novo", texto: 'Novo benefício adicionado: "Parceria com Academia Local — até 40% de desconto na mensalidade".', tempo: "ontem", lida: true },
    { id: "n6", rota: "#/documentos/1", tipo: "documento", icone: "file-text", titulo: "Atualização cadastral efetuada", texto: "Sua solicitação de alteração de ramal interno foi processada com sucesso pelo TI.", tempo: "há 3 dias", lida: true },
    { id: "n7", rota: "#/eventos/1", tipo: "evento", icone: "calendar", titulo: "Inscrição confirmada com sucesso", texto: 'Sua presença foi homologada para o "Simulado Prático de Brigada de Incêndio" no dia 25/09.', tempo: "há 5 dias", lida: true },
  ];

  // ---- Painel administrativo (perfil Editor-Gestor) ----
  const adminNoticias = [
    { titulo: "ALERTA: Instabilidade temporária no sistema de prontuário PEP", tipo: "Comunicado", quando: "Hoje, 10:45", autor: "TI Hospitalar", status: "Publicado", prioridade: "urgente", leituras: 342 },
    { titulo: "Campanha de Vacinação Contra Gripe 2026 - Início na próxima semana", tipo: "Evento", quando: "Ontem, 16:20", autor: "Medicina do Trabalho", status: "Publicado", prioridade: "relevante", leituras: 189 },
    { titulo: "Treinamento Obrigatório: Protocolo de Segurança do Paciente", tipo: "Evento", quando: "05/Set", autor: "Núcleo de Qualidade", status: "Agendado", prioridade: "relevante", leituras: 0 },
    { titulo: "Parceria Estendida: Desconto em farmácias conveniadas para colaboradores", tipo: "Promoção", quando: "02/Set", autor: "Benefícios & RH", status: "Publicado", prioridade: "normal", leituras: 145 },
    { titulo: "Novas diretrizes para higienização de leitos da UTI Adulto", tipo: "Comunicado", quando: "31/Ago", autor: "SCIHI Decós", status: "Rascunho", prioridade: "normal", leituras: 0 },
  ];

  const adminDocumentos = [
    { tipo: "POP", cor: "red", titulo: "POP - Higienização das Mãos e Controle de Infecção", quando: "Hoje, 10:15", autor: "SCIHI Decós", status: "Publicado", permissao: "download", tamanho: "1.4 MB" },
    { tipo: "MANUAL", cor: "amber", titulo: "Manual de Biossegurança e Uso de EPIs 2026", quando: "02/Set, 14:30", autor: "Medicina do Trabalho", status: "Publicado", permissao: "view", tamanho: "4.2 MB" },
    { tipo: "PROTOCOLO", cor: "blue", titulo: "Protocolo Manchester - Triagem e Classificação de Risco", quando: "29/Ago, 09:15", autor: "Pronto Atendimento", status: "Publicado", permissao: "download", tamanho: "2.1 MB" },
    { tipo: "FORMULÁRIO", cor: "green", titulo: "Ficha de Notificação de Eventos Adversos e Erros", quando: "25/Ago, 11:20", autor: "Núcleo de Qualidade", status: "Em Revisão", permissao: "download", tamanho: "420 KB" },
    { tipo: "POP", cor: "red", titulo: "Diretrizes e POP de Punção Venosa Periférica", quando: "12/Ago, 16:45", autor: "Enfermagem Geral", status: "Rascunho", permissao: "view", tamanho: "1.8 MB" },
  ];

  const stats = {
    noticias: { ativas: 14, semana: 6, views: "4.821", viewsDelta: "12%", alertas: 1 },
    documentos: { total: 124, novos: 18, protocolos: 48, downloads: "1.284", pendencias: 3 },
  };

  // ---- Papéis (roles) e matriz de permissão ----
  // caps: interact, download, edit_profile, manage_news, manage_docs, manage_users, audit_own, audit_all
  const roles = {
    leitura: { label: "Leitura", curto: "LEITURA", icon: "eye", desc: "Somente consulta", caps: [] },
    normal:  { label: "Colaborador", curto: "NORMAL", icon: "user", desc: "Colaborador padrão", caps: ["interact", "download", "edit_profile"] },
    rh:      { label: "RH · Editor-Gestor", curto: "RH", icon: "user-cog", desc: "Cria e gerencia conteúdo", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "audit_own"] },
    admin:   { label: "Administrador", curto: "ADMIN", icon: "shield", desc: "Acesso total + gestão", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_users", "audit_own", "audit_all"] },
  };

  const setores = [
    { nome: "Qualidade e Segurança do Paciente", andar: "3º Andar", ramalBase: "44", ativos: 8 },
    { nome: "Recursos Humanos", andar: "4º Andar", ramalBase: "40", ativos: 12 },
    { nome: "Tecnologia da Informação", andar: "4º Andar", ramalBase: "40", ativos: 9 },
    { nome: "Faturamento", andar: "Térreo", ramalBase: "10", ativos: 15 },
    { nome: "Recepção Central", andar: "Térreo", ramalBase: "10", ativos: 18 },
    { nome: "Farmácia", andar: "1º Andar", ramalBase: "15", ativos: 11 },
    { nome: "UTI Geral", andar: "2º Andar", ramalBase: "21", ativos: 22 },
  ];

  const usuariosAdmin = [
    { nome: "Ana Paula Santos", email: "anapaula.santos@decos.com", setor: "Qualidade", cargo: "Analista de Qualidade", role: "rh", status: "Ativo" },
    { nome: "Carlos Mendes", email: "carlos.mendes@decos.com", setor: "Recursos Humanos", cargo: "Analista de RH", role: "rh", status: "Ativo" },
    { nome: "Fernanda Lima", email: "fernanda.lima@decos.com", setor: "Tecnologia", cargo: "Engenheira de TI", role: "admin", status: "Ativo" },
    { nome: "Diego Martins", email: "diego.martins@decos.com", setor: "Tecnologia", cargo: "Suporte Técnico", role: "normal", status: "Ativo" },
    { nome: "Patrícia Souza", email: "patricia.souza@decos.com", setor: "Recepção", cargo: "Recepcionista", role: "normal", status: "Ativo" },
    { nome: "Bruno Ferreira", email: "bruno.ferreira@decos.com", setor: "Farmácia", cargo: "Farmacêutico", role: "leitura", status: "Ativo" },
    { nome: "Rafael Almeida", email: "rafael.almeida@decos.com", setor: "Faturamento", cargo: "Auxiliar de Contas", role: "normal", status: "Inativo" },
    { nome: "Juliana Ribeiro", email: "juliana.ribeiro@decos.com", setor: "UTI Geral", cargo: "Enfermeira Chefe", role: "leitura", status: "Ativo" },
  ];

  // Log de auditoria semente (ações registradas). autorRole indica quem fez.
  const auditoria = [
    { quando: "Hoje, 10:45", autor: "TI Hospitalar", autorRole: "admin", acao: "publicou", alvo: "Notícia: ALERTA instabilidade PEP", tipo: "noticia" },
    { quando: "Hoje, 09:12", autor: "Ana Paula Santos", autorRole: "rh", acao: "editou", alvo: "Documento: POP Higienização das Mãos", tipo: "documento" },
    { quando: "Ontem, 16:20", autor: "Recursos Humanos", autorRole: "rh", acao: "publicou", alvo: "Notícia: Campanha de Vacinação 2026", tipo: "noticia" },
    { quando: "Ontem, 14:03", autor: "Fernanda Lima", autorRole: "admin", acao: "alterou permissão", alvo: "Usuário: Bruno Ferreira → Leitura", tipo: "usuario" },
    { quando: "02/Set, 11:20", autor: "Núcleo de Qualidade", autorRole: "rh", acao: "enviou para revisão", alvo: "Documento: Ficha de Eventos Adversos", tipo: "documento" },
    { quando: "31/Ago, 08:30", autor: "Fernanda Lima", autorRole: "admin", acao: "criou", alvo: "Setor: UTI Neonatal", tipo: "setor" },
  ];

  return {
    usuario, categorias, avisos, eventos, aniversariantes, documentos,
    faq, faqCategorias, ramais, notificacoes, acessosRapidos, adminNoticias, adminDocumentos, stats, hojeDia,
    roles, setores, usuariosAdmin, auditoria,
  };
})();
