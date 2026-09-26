/* =========================================================================
   Rotas — cada endereço aponta para a função da tela
   need = capacidade exigida (ver DB.roles). Sem ela, volta ao Início.
   ========================================================================= */
(function () {
  const routes = [
    { re: /^#\/login$/, page: () => Pages.login() },
    { re: /^#\/dashboard$/, page: () => Pages.dashboard() },
    { re: /^#\/avisos$/, page: () => Pages.avisos() },
    { re: /^#\/avisos\/([\w-]+)$/, page: (m) => Pages.avisoDetalhe(m[1]) },
    { re: /^#\/aniversariantes$/, page: () => Pages.aniversariantes() },
    { re: /^#\/aniversariantes\/hoje$/, page: () => Pages.aniversarianteDoDia() },
    { re: /^#\/eventos$/, page: () => Pages.eventos() },
    { re: /^#\/eventos\/(\d+)$/, page: (m) => Pages.eventoDetalhe(m[1]) },
    { re: /^#\/documentos$/, page: () => Pages.documentos() },
    { re: /^#\/documentos\/([\w-]+)$/, page: (m) => Pages.documentoView(m[1]) },
    { re: /^#\/documentos\/([\w-]+)\/restrito$/, page: (m) => PagesAdmin.adminDocumentoRestrito(m[1]) },
    { re: /^#\/faq$/, page: () => Pages.faq() },
    { re: /^#\/diretorio$/, page: () => Pages.diretorio() },
    { re: /^#\/perfil$/, page: () => Pages.perfil() },
    { re: /^#\/notificacoes$/, page: () => Pages.notificacoes() },
    // gestão de conteúdo (RH / Admin)
    { re: /^#\/admin\/noticias$/, page: () => PagesAdmin.adminNoticias(), need: "manage_news" },
    { re: /^#\/admin\/noticias\/nova$/, page: () => PagesAdmin.adminNoticiaNova(), need: "manage_news" },
    { re: /^#\/admin\/noticias\/([\w-]+)\/editar$/, page: (m) => PagesAdmin.adminNoticiaNova(m[1]), need: "manage_news" },
    { re: /^#\/admin\/documentos$/, page: () => PagesAdmin.adminDocumentos(), need: "manage_docs" },
    { re: /^#\/admin\/documentos\/novo$/, page: () => PagesAdmin.adminDocumentoNovo(), need: "manage_docs" },
    { re: /^#\/admin\/documentos\/([\w-]+)\/editar$/, page: (m) => PagesAdmin.adminDocumentoNovo(m[1]), need: "manage_docs" },
    { re: /^#\/admin\/documentos\/([\w-]+)\/restrito$/, page: (m) => PagesAdmin.adminDocumentoRestrito(m[1]), need: "manage_docs" },
    // gestão administrativa (Admin) e auditoria (RH próprias / Admin todas)
    { re: /^#\/admin\/usuarios$/, page: () => PagesAdmin.adminUsuarios(), need: "manage_users" },
    { re: /^#\/admin\/auditoria$/, page: () => PagesAdmin.adminAuditoria(), need: "audit_own" },
  ];

  Object.assign(App, { routes });
})();
