/* =========================================================================
   Rota: #/documentos/:id/restrito · #/admin/documentos/:id/restrito
   O backend não guarda permissão "somente visualização" (BACKEND FUTURO):
   todo documento publicado é abrível/baixável. Estas rotas antigas apenas
   encaminham para a visualização normal do documento (ou 404 se não existir).
   ========================================================================= */
(function () {
  function adminDocumentoRestrito(id) {
    return Pages.documentoView(id);
  }

  Object.assign(PagesAdmin, { adminDocumentoRestrito });
})();
