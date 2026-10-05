(function () {
  const avaliacoesService = {
    list(params = {}) {
      return App.API.request(`/avaliacoes-documentos${Services.toQuery(params)}`);
    },
    resumo() {
      return App.API.request("/avaliacoes-documentos/resumo"); // ADMIN
    },
    responder(id, data) {
      return App.API.request(`/avaliacoes-documentos/${encodeURIComponent(id)}/resposta`, { method: "PUT", body: data }); // só o avaliador
    },
    get(id) {
      return App.API.request(`/avaliacoes-documentos/${encodeURIComponent(id)}`);
    },
    create(data) {
      return App.API.request("/avaliacoes-documentos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/avaliacoes-documentos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/avaliacoes-documentos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { avaliacoes: avaliacoesService });
})();
