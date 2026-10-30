/* =========================================================================
   Rotas — cada endereço aponta para a função da tela
   need = capacidade exigida (App.can). Sem ela, volta ao Início.
   publica = abre sem login (visitante): só conteúdo institucional; o resto pede login.
   ========================================================================= */
(function () {
  const routes = [
    { re: /^#\/login$/, page: () => Pages.login() },
    { re: /^#\/redefinir-senha(?:\?(.+))?$/, page: (m) => Pages.redefinirSenha(m[1]) },
    { re: /^#\/trocar-senha$/, page: () => Pages.trocarSenha() },
    { re: /^#\/dashboard$/, page: () => Pages.dashboard(), publica: true },
    { re: /^#\/avisos$/, page: () => Pages.avisos(), publica: true },
    { re: /^#\/avisos\/([\w-]+)$/, page: (m) => Pages.avisoDetalhe(m[1]), publica: true },
    { re: /^#\/aniversariantes$/, page: () => Pages.aniversariantes() },
    { re: /^#\/aniversariantes\/hoje$/, page: () => Pages.aniversarianteDoDia() },
    { re: /^#\/avaliacoes$/, page: () => PagesAvaliacoes.avaliacoes() },
    { re: /^#\/admin\/avaliacoes$/, page: () => PagesAdmin.adminAvaliacoes(), need: "manage_reviews" },
    { re: /^#\/eventos$/, page: () => Pages.eventos(), publica: true },
    { re: /^#\/eventos\/(\d+)$/, page: (m) => Pages.eventoDetalhe(m[1]), publica: true },
    { re: /^#\/documentos$/, page: () => Pages.documentos(), publica: true },
    { re: /^#\/documentos\/([\w-]+)$/, page: (m) => Pages.documentoView(m[1]), publica: true },
    { re: /^#\/documentos\/([\w-]+)\/restrito$/, page: (m) => Pages.documentoRestrito(m[1]) },
    { re: /^#\/faq$/, page: () => Pages.faq(), publica: true },
    { re: /^#\/diretorio$/, page: () => Pages.diretorio() },
    { re: /^#\/perfil$/, page: () => Pages.perfil() },
    { re: /^#\/configuracoes$/, page: () => Pages.configuracoes() },
    { re: /^#\/agenda(?:\/(\d{4}-\d{2}-\d{2}))?$/, page: (m) => Pages.agenda(m[1]) },
    { re: /^#\/painel$/, page: () => Pages.painel() },
    { re: /^#\/vagas$/, page: () => Pages.vagas() },
    { re: /^#\/vagas\/(\d+)$/, page: (m) => Pages.vagaDetalhe(m[1]) },
    { re: /^#\/admin\/vagas$/, page: () => PagesAdmin.adminVagas(), need: "manage_vagas" },
    { re: /^#\/chamados$/, page: () => Pages.meusChamados(), need: "interact" },
    { re: /^#\/notificacoes$/, page: () => Pages.notificacoes() },
    // gestão de conteúdo (RH / Admin)
    { re: /^#\/admin\/noticias$/, page: () => PagesAdmin.adminNoticias(), need: "manage_news" },
    { re: /^#\/admin\/noticias\/nova$/, page: () => PagesAdmin.adminNoticiaNova(), need: "manage_news" },
    { re: /^#\/admin\/noticias\/([\w-]+)\/editar$/, page: (m) => PagesAdmin.adminNoticiaNova(m[1]), need: "manage_news" },
    { re: /^#\/admin\/documentos$/, page: () => PagesAdmin.adminDocumentos(), need: "manage_docs" },
    { re: /^#\/admin\/documentos\/novo$/, page: () => PagesAdmin.adminDocumentoNovo(), need: "manage_docs" },
    { re: /^#\/admin\/documentos\/([\w-]+)\/editar$/, page: (m) => PagesAdmin.adminDocumentoNovo(m[1]), need: "manage_docs" },
    // gestão administrativa e auditoria (somente ADMIN)
    { re: /^#\/admin\/usuarios$/, page: () => PagesAdmin.adminUsuarios(), need: "manage_users" },
    { re: /^#\/admin\/acessos$/, page: () => PagesAdmin.adminAcessos(), need: "manage_users" },
    { re: /^#\/admin\/chamados$/, page: () => PagesAdmin.adminChamados(), need: "manage_tickets" },
    { re: /^#\/admin\/eventos$/, page: () => PagesAdmin.adminEventos(), need: "manage_events" },
    { re: /^#\/admin\/eventos\/novo$/, page: () => PagesAdmin.adminEventoForm(), need: "manage_events" },
    { re: /^#\/admin\/eventos\/(\d+)\/editar$/, page: (m) => PagesAdmin.adminEventoForm(m[1]), need: "manage_events" },
    { re: /^#\/admin\/calendario$/, page: () => PagesAdmin.adminCalendario(), need: "manage_events" },
    { re: /^#\/admin\/revisao$/, page: () => PagesAdmin.adminRevisao(), need: "approve" },
    { re: /^#\/admin\/treinamentos$/, page: () => PagesAdmin.adminTreinamentos(), need: "manage_events" },
    { re: /^#\/admin\/faqs$/, page: () => PagesAdmin.adminFaqs(), need: "manage_faq" },
    { re: /^#\/admin\/solicitacoes$/, page: () => PagesAdmin.adminSolicitacoes(), need: "manage_users" },
    { re: /^#\/admin\/auditoria$/, page: () => PagesAdmin.adminAuditoria(), need: "audit_all" },
  ];

  Object.assign(App, { routes });
})();
