(function () {
  const usuariosService = {
    list(params = {}) {
      return App.API.request(`/usuarios${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`);
    },
    update(id, data) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { usuarios: usuariosService });
})();
