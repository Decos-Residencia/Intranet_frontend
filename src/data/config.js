/* =========================================================================
   Intranet Hospital Decós — configuração de interface (NÃO são dados de negócio)
   Atalhos de acesso rápido, categorias de aviso (rótulo/cor) e a matriz de papéis (só UX: o
   backend é quem autoriza). Todos os dados reais vêm da API.
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

  // ---- Papéis (roles) e matriz de permissão ----
  // Os 4 papéis vêm de GET /auth/me (user.perfil): LEITURA -> "leitura" · COLABORADOR -> "normal" ·
  // RH -> "rh" · ADMIN -> "admin". Isto é só UX: o backend é quem autoriza.
  // caps: interact, download, edit_profile, manage_news, manage_docs, manage_faq, manage_events,
  //       manage_users, manage_tickets, manage_reviews, audit_all
  const roles = {
    leitura: { label: "Leitura", curto: "LEITURA", icon: "eye", desc: "Somente consulta", caps: ["download"] },
    normal:  { label: "Colaborador", curto: "COLABORADOR", icon: "user", desc: "Colaborador padrão", caps: ["interact", "download", "edit_profile"] },
    rh:      { label: "RH · Editor-Gestor", curto: "RH", icon: "user-cog", desc: "Cria e gerencia conteúdo", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_faq", "manage_events"] },
    admin:   { label: "Administrador", curto: "ADMIN", icon: "shield", desc: "Acesso total + gestão", caps: ["interact", "download", "edit_profile", "manage_news", "manage_docs", "manage_faq", "manage_events", "manage_users", "manage_tickets", "manage_reviews", "audit_all"] },
  };

  return {
    categorias, acessosRapidos, roles,
  };
})();
