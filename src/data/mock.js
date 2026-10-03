/* =========================================================================
   Intranet Hospital Decós — dados LOCAIS (sem backend)
   Só restam aqui as partes que ainda não têm API (MANTER LOCAL / BACKEND FUTURO):
   eventos, notificações demonstrativas, estatísticas, auditoria semente,
   acessos rápidos, categorias (cores) e a matriz de papéis.
   Avisos, documentos, FAQ, usuários, setores e aniversariantes vêm da API.
   ========================================================================= */
window.DB = (function () {

  const categorias = {
    comunicado: { label: "Comunicado", tone: "blue" },
    evento:     { label: "Evento", tone: "amber" },
    promocao:   { label: "Promoção", tone: "green" },
    urgente:    { label: "Urgente", tone: "red" },
    noticia:    { label: "Notícia", tone: "teal" },
    relevante:  { label: "Relevante", tone: "blue" },
  };

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
  const stats = {
    noticias: { ativas: 14, semana: 6, views: "4.821", viewsDelta: "12%", alertas: 1 },
    documentos: { total: 124, novos: 18, protocolos: 48, downloads: "1.284", pendencias: 3 },
  };

  // ---- Papéis (roles) e matriz de permissão ----
  // No modo integrado só existem dois papéis, derivados de GET /auth/me (user.perfil):
  //   ADMIN -> "admin" · COLABORADOR -> "normal". Isto é só UX: o backend é quem autoriza.
  // caps: interact, download, edit_profile, manage_news, manage_docs, manage_users, manage_faq, audit_own, audit_all
  const roles = {
    normal:  { label: "Colaborador", curto: "COLABORADOR", icon: "user", desc: "Somente leitura", caps: ["interact", "download", "edit_profile"] },
    admin:   { label: "Administrador", curto: "ADMIN", icon: "shield", desc: "Acesso total + gestão", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_users", "manage_faq", "audit_own", "audit_all"] },
  };

  const auditoria = [
    { quando: "Hoje, 10:45", autor: "TI Hospitalar", autorRole: "admin", acao: "publicou", alvo: "Notícia: ALERTA instabilidade PEP", tipo: "noticia" },
    { quando: "Hoje, 09:12", autor: "Ana Paula Santos", autorRole: "rh", acao: "editou", alvo: "Documento: POP Higienização das Mãos", tipo: "documento" },
    { quando: "Ontem, 16:20", autor: "Recursos Humanos", autorRole: "rh", acao: "publicou", alvo: "Notícia: Campanha de Vacinação 2026", tipo: "noticia" },
    { quando: "Ontem, 14:03", autor: "Fernanda Lima", autorRole: "admin", acao: "alterou permissão", alvo: "Usuário: Bruno Ferreira → Leitura", tipo: "usuario" },
    { quando: "02/Set, 11:20", autor: "Núcleo de Qualidade", autorRole: "rh", acao: "enviou para revisão", alvo: "Documento: Ficha de Eventos Adversos", tipo: "documento" },
    { quando: "31/Ago, 08:30", autor: "Fernanda Lima", autorRole: "admin", acao: "criou", alvo: "Setor: UTI Neonatal", tipo: "setor" },
  ];

  return {
    categorias, eventos, notificacoes, acessosRapidos, stats, roles, auditoria,
  };
})();
