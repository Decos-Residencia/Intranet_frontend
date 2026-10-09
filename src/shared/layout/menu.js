/* =========================================================================
   Itens do menu (variam com o papel)
   ========================================================================= */
(function () {
  /* ---------- Menu (varia com o papel) ----------
     Cada item é uma rota (leaf) ou um grupo com `children` (submenu
     expansível). O agrupamento acompanha os 3 módulos da spec do projeto:
     Comunicação & Engajamento, Documentos & FAQ, Diretório & Ramais. */
  function menuItems(role) {
    const can = App.can;
    const gere = can("manage_news"); // gestão de conteúdo: RH e ADMIN (o backend também valida)
    const items = [{ icon: "home", label: "Início", route: "#/dashboard" }];

    const comunicacao = [
      { icon: "megaphone", label: gere ? "Mural de Avisos" : "Avisos", route: "#/avisos", count: gere ? App.avisosAll().length : 0 },
    ];
    if (gere) comunicacao.push({ icon: "edit", label: "Gerenciar Notícias", route: "#/admin/noticias" });
    comunicacao.push({ icon: "gift", label: "Aniversariantes do Mês", route: "#/aniversariantes" });
    comunicacao.push({ icon: "gift", label: "Aniversariante do Dia", route: "#/aniversariantes/hoje" });
    comunicacao.push({ icon: "calendar", label: "Eventos", route: "#/eventos" });
    if (gere) comunicacao.push({ icon: "edit", label: "Gerenciar Eventos", route: "#/admin/eventos" });
    items.push({ icon: "megaphone", label: "Comunicação", children: comunicacao });

    items.push({ icon: "file-text", label: "Documentos & FAQ", children: [
      { icon: "file-text", label: gere ? "Gerenciar Documentos" : "Documentos & POPs", route: gere ? "#/admin/documentos" : "#/documentos" },
      ...(gere ? [{ icon: "edit", label: "Gerenciar FAQ", route: "#/admin/faqs" }] : []),
      ...(can("interact") ? [{ icon: "check-check", label: "Minhas Avaliações", route: "#/avaliacoes", count: App.state.api.avaliacoesPendentes || 0 }] : []),
      ...(can("manage_reviews") ? [{ icon: "check-check", label: "Gerenciar Avaliações", route: "#/admin/avaliacoes" }] : []),
      { icon: "help-circle", label: "FAQ", route: "#/faq" },
    ]});

    items.push({ icon: "users", label: "Diretório & Ramais", route: "#/diretorio" });

    const adminChildren = [];
    if (can("manage_users")) adminChildren.push({ icon: "user-cog", label: "Usuários & Setores", route: "#/admin/usuarios" });
    if (can("manage_tickets")) adminChildren.push({ icon: "help-circle", label: "Chamados", route: "#/admin/chamados", count: App.state.api.chamadosPendentes || 0 });
    if (can("manage_users")) adminChildren.push({ icon: "check-check", label: "Solicitações Cadastrais", route: "#/admin/solicitacoes", count: App.state.api.solicitacoesPendentes || 0 });
    if (can("audit_all")) adminChildren.push({ icon: "shield", label: "Auditoria", route: "#/admin/auditoria" });
    if (adminChildren.length) items.push({ icon: "shield", label: "Administração", children: adminChildren });

    return items;
  }

  Object.assign(UI, { menuItems });
})();
