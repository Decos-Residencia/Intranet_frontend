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
    // Cada gestão segue a sua permissão (perfil + ajustes do Controle de acesso); o backend também valida.
    const gereAvisos = can("manage_news"), gereEventos = can("manage_events");
    const gereDocs = can("manage_docs"), gereFaq = can("manage_faq");
    const logado = App.state.auth; // visitante só vê o conteúdo institucional
    const items = [{ icon: "home", label: "Início", route: "#/dashboard" }];
    if (logado) items.push({ icon: "inbox", label: "Meu painel", route: "#/painel" });

    const comunicacao = [
      { icon: "megaphone", label: gereAvisos ? "Mural de Avisos" : "Avisos", route: "#/avisos", count: gereAvisos ? App.avisosAll().length : 0 },
    ];
    if (gereAvisos) comunicacao.push({ icon: "edit", label: "Gerenciar Notícias", route: "#/admin/noticias" });
    if (logado) comunicacao.push({ icon: "gift", label: "Aniversariantes do Mês", route: "#/aniversariantes" });
    if (logado) comunicacao.push({ icon: "gift", label: "Aniversariante do Dia", route: "#/aniversariantes/hoje" });
    comunicacao.push({ icon: "calendar", label: "Eventos", route: "#/eventos" });
    if (logado) comunicacao.push({ icon: "check-check", label: "Minha agenda", route: "#/agenda" });
    if (gereEventos) comunicacao.push({ icon: "edit", label: "Gerenciar Eventos", route: "#/admin/eventos" });
    if (gereEventos) comunicacao.push({ icon: "graduation", label: "Treinamentos obrigatórios", route: "#/admin/treinamentos" });
    if (gereEventos) comunicacao.push({ icon: "calendar", label: "Calendário institucional", route: "#/admin/calendario" });
    items.push({ icon: "megaphone", label: "Comunicação", children: comunicacao });

    items.push({ icon: "file-text", label: "Documentos & FAQ", children: [
      { icon: "file-text", label: gereDocs ? "Gerenciar Documentos" : "Documentos & POPs", route: gereDocs ? "#/admin/documentos" : "#/documentos" },
      ...(gereFaq ? [{ icon: "edit", label: "Gerenciar FAQ", route: "#/admin/faqs" }] : []),
      // Quem é responsável por algum documento (ou tem avaliação pendente) revisa aqui.
      ...(App.state.api.minhasRevisoes || App.state.api.avaliacoesPendentes ? [{ icon: "check-check", label: "Minhas revisões", route: "#/revisoes", count: App.state.api.avaliacoesPendentes || 0 }] : []),
      { icon: "help-circle", label: "FAQ", route: "#/faq" },
    ]});

    if (logado) items.push({ icon: "users", label: "Diretório & Ramais", route: "#/diretorio" });
    if (logado) items.push(can("manage_vagas")
      ? { icon: "trending-up", label: "Vagas internas", children: [
          { icon: "trending-up", label: "Mural de vagas", route: "#/vagas" },
          { icon: "edit", label: "Gerenciar vagas", route: "#/admin/vagas" }] }
      : { icon: "trending-up", label: "Vagas internas", route: "#/vagas" });
    if (logado) items.push({ icon: "settings", label: "Configurações", route: "#/configuracoes" });

    const adminChildren = [];
    if (can("view_indicators")) adminChildren.push({ icon: "trending-up", label: "Indicadores", route: "#/admin/indicadores" });
    if (can("manage_users")) adminChildren.push({ icon: "upload", label: "Importar usuários", route: "#/admin/importacao" });
    if (can("manage_docs")) adminChildren.push({ icon: "clock", label: "Validade de documentos", route: "#/admin/validades" });
    if (can("manage_users")) adminChildren.push({ icon: "user-cog", label: "Usuários & Setores", route: "#/admin/usuarios" });
    if (can("manage_users")) adminChildren.push({ icon: "key", label: "Controle de acesso", route: "#/admin/acessos" });
    if (can("approve")) adminChildren.push({ icon: "check-check", label: "Revisão de publicações", route: "#/admin/revisao", count: App.state.api.revisaoPendentes || 0 });
    if (can("manage_tickets")) adminChildren.push({ icon: "help-circle", label: "Chamados", route: "#/admin/chamados", count: App.state.api.chamadosPendentes || 0 });
    if (can("manage_users")) adminChildren.push({ icon: "check-check", label: "Solicitações Cadastrais", route: "#/admin/solicitacoes", count: App.state.api.solicitacoesPendentes || 0 });
    if (can("audit_all")) adminChildren.push({ icon: "shield", label: "Auditoria", route: "#/admin/auditoria" });
    if (adminChildren.length) items.push({ icon: "shield", label: "Administração", children: adminChildren });

    return items;
  }

  Object.assign(UI, { menuItems });
})();
