(function () {
  const setoresService = {
    list(params = {}) {
      return App.API.request(`/setores${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/setores/${encodeURIComponent(id)}`);
    },
    create(data) {
      return App.API.request("/setores", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/setores/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/setores/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { setores: setoresService });
})();
