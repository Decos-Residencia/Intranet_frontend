(function () {
  const documentosService = {
    list(params = {}) {
      return App.API.request(`/documentos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`);
    },
    create(data) {
      return App.API.request("/documentos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/documentos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { documentos: documentosService });
})();
