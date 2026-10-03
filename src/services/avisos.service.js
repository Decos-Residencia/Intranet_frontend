(function () {
  const avisosService = {
    list(params = {}) {
      return App.API.request(`/avisos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`);
    },
    create(data) {
      return App.API.request("/avisos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { avisos: avisosService });
})();
