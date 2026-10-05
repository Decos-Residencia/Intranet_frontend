/* =========================================================================
   Intranet Hospital Decós — dados LOCAIS (sem backend)
   Só restam aqui as partes que ainda não têm API (MANTER LOCAL / BACKEND FUTURO):
   eventos, estatísticas,
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
  const stats = {
    noticias: { ativas: 14, semana: 6, views: "4.821", viewsDelta: "12%", alertas: 1 },
    documentos: { total: 124, novos: 18, protocolos: 48, downloads: "1.284", pendencias: 3 },
  };

  // ---- Papéis (roles) e matriz de permissão ----
  // No modo integrado só existem dois papéis, derivados de GET /auth/me (user.perfil):
  //   ADMIN -> "admin" · COLABORADOR -> "normal". Isto é só UX: o backend é quem autoriza.
  // caps: interact, download, edit_profile, manage_news, manage_docs, manage_users, manage_faq, audit_all
  const roles = {
    normal:  { label: "Colaborador", curto: "COLABORADOR", icon: "user", desc: "Somente leitura", caps: ["interact", "download", "edit_profile"] },
    admin:   { label: "Administrador", curto: "ADMIN", icon: "shield", desc: "Acesso total + gestão", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_users", "manage_faq", "audit_all"] },
  };

  return {
    categorias, eventos, acessosRapidos, stats, roles,
  };
})();
