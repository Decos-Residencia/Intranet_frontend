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
    // FormData: arquivo + titulo, categoria, descricao, versao, setor_id, ativo.
    create(formData) {
      return App.API.request("/documentos", { method: "POST", body: formData, timeout: 120000 });
    },
    update(id, data) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    substituirArquivo(id, formData) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}/arquivo`, { method: "PUT", body: formData, timeout: 120000 });
    },
    remove(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { documentos: documentosService });
})();
