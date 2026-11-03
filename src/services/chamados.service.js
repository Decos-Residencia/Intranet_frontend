(function () {
  // Chamados (dados reais no PostgreSQL via FastAPI; nada em localStorage).
  const chamadosService = {
    create(data) {
      return App.API.request("/chamados", { method: "POST", body: data });
    },
    meus(params = {}) {
      return App.API.request(`/chamados/meus${Services.toQuery(params)}`);
    },
    list(params = {}) {
      return App.API.request(`/chamados${Services.toQuery(params)}`); // ADMIN
    },
    resumo() {
      return App.API.request("/chamados/resumo");
    },
    permissoes() {
      return App.API.request("/chamados/permissoes");
    },
    atendentes(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}/atendentes`);
    },
    historico(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}/historico`);
    },
    get(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`);
    },
    update(id, data) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
  };
  Object.assign(window.Services, { chamados: chamadosService });
})();
