(function () {
  // Documentos: metadados no PostgreSQL e arquivo no Supabase Storage PRIVADO. O navegador só fala
  // com a API; para ver/baixar recebe uma URL assinada de 60 s (nunca guardada).
  const documentosService = {
    list(params = {}) {
      return App.API.request(`/documentos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`);
    },
    resumo() {
      return App.API.request("/documentos/resumo"); // totais reais (ADMIN)
    },
    // URL assinada de 60 s, gerada pelo backend depois de autorizar (inline = abrir no navegador).
    download(id, inline = false) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/download${Services.toQuery({ inline: inline ? "true" : "" })}`);
    },
    // PDF vigente em bytes, para a intranet desenhar na tela (sem link de download).
    conteudo(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/conteudo`, { blob: true, timeout: 60000 });
    },
    // FormData: arquivo + titulo, categoria, descricao, versao, setor_id, ativo.
    create(formData) {
      return App.API.request("/documentos", { method: "POST", body: formData, timeout: 120000 });
    },
    // Vencidos e que vencem a revisão nos próximos `dias` (ADMIN/RH).
    validades(dias = 60) {
      return App.API.request(`/documentos/validades?dias=${encodeURIComponent(dias)}`);
    },
    update(id, data) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    substituirArquivo(id, formData) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/arquivo`, { method: "PUT", body: formData, timeout: 120000 });
    },
    // Histórico de versões (vigente primeiro) e envio de nova versão (vigente ou antiga).
    versoes(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/versoes`);
    },
    // FormData: arquivo + rotulo, vigente ("true"/"false"), observacao (opcional).
    enviarVersao(id, formData) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/versoes`, { method: "POST", body: formData, timeout: 120000 });
    },
    tornarVigente(id, versaoId) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/versoes/${encodeURIComponent(versaoId)}/vigente`, { method: "PUT" });
    },
    downloadVersao(id, versaoId, inline = false) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/versoes/${encodeURIComponent(versaoId)}/download${Services.toQuery({ inline: inline ? "true" : "" })}`);
    },
    remove(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { documentos: documentosService });
})();
