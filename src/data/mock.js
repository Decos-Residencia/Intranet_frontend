/* =========================================================================
   Intranet Hospital Decós — dados LOCAIS (sem backend)
   Só restam aqui as partes que ainda não têm API (MANTER LOCAL / BACKEND FUTURO):
   estatísticas,
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
  const stats = {}; // estatísticas reais vêm da API (M10 revisa o restante)

  // ---- Papéis (roles) e matriz de permissão ----
  // No modo integrado só existem dois papéis, derivados de GET /auth/me (user.perfil):
  //   ADMIN -> "admin" · COLABORADOR -> "normal". Isto é só UX: o backend é quem autoriza.
  // caps: interact, download, edit_profile, manage_news, manage_docs, manage_users, manage_faq, manage_events, manage_tickets, audit_all
  const roles = {
    normal:  { label: "Colaborador", curto: "COLABORADOR", icon: "user", desc: "Somente leitura", caps: ["interact", "download", "edit_profile"] },
    admin:   { label: "Administrador", curto: "ADMIN", icon: "shield", desc: "Acesso total + gestão", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_users", "manage_faq", "manage_events", "manage_tickets", "audit_all"] },
  };

  return {
    categorias, acessosRapidos, stats, roles,
  };
})();
