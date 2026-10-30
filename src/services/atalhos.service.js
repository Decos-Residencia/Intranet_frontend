(function () {
  // Acessos rápidos globais (o ADMIN cadastra; todos veem os ativos). Os pessoais ficam nas preferências.
  const atalhosService = {
    list() {
      return App.API.request("/atalhos");
    },
    todos() {
      return App.API.request("/atalhos/todos"); // ADMIN: inclui inativos
    },
    create(data) {
      return App.API.request("/atalhos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/atalhos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/atalhos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
  Object.assign(window.Services, { atalhos: atalhosService });
})();
