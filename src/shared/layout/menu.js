/* =========================================================================
   Itens do menu (variam com o papel)
   ========================================================================= */
(function () {
  /* ---------- Menu (varia com o papel) ----------
     Cada item é uma rota (leaf) ou um grupo com `children` (submenu
     expansível). O agrupamento acompanha os 3 módulos da spec do projeto:
     Comunicação & Engajamento, Documentos & FAQ, Diretório & Ramais. */
  function menuItems(role) {
    const gere = role === "admin"; // gestão de conteúdo (no backend, só ADMIN escreve)
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
      { icon: "help-circle", label: "FAQ", route: "#/faq" },
    ]});

    items.push({ icon: "users", label: "Diretório & Ramais", route: "#/diretorio" });

    const adminChildren = [];
    if (role === "admin") adminChildren.push({ icon: "user-cog", label: "Usuários & Setores", route: "#/admin/usuarios" });
    if (role === "admin") adminChildren.push({ icon: "help-circle", label: "Chamados", route: "#/admin/chamados", count: App.state.api.chamadosPendentes || 0 });
    if (role === "admin") adminChildren.push({ icon: "check-check", label: "Solicitações Cadastrais", route: "#/admin/solicitacoes", count: App.state.api.solicitacoesPendentes || 0 });
    if (gere) adminChildren.push({ icon: "shield", label: "Auditoria", route: "#/admin/auditoria" });
    if (adminChildren.length) items.push({ icon: "shield", label: "Administração", children: adminChildren });

    return items;
  }

  Object.assign(UI, { menuItems });
})();
