(function () {
  // Chamados (dados reais no PostgreSQL via FastAPI; nada em localStorage).
  const chamadosService = {
    create(data) {
      return App.API.request("/chamados", { method: "POST", body: data });
    },
    meus(params = {}) {
      return App.API.request(`/chamados/meus${Services.toQuery(params)}`);
    },
    // Fila de atendimento: quem tem "Atender chamados" vê tudo; responsável por setor, só o setor.
    list(params = {}) {
      return App.API.request(`/chamados${Services.toQuery(params)}`);
    },
    resumo() {
      return App.API.request("/chamados/resumo");
    },
    // { pode_atender, administrador (fila inteira), setores_ids }
    permissoes() {
      return App.API.request("/chamados/permissoes");
    },
    get(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`);
    },
    update(id, data) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`, { method: "PUT", body: data }); // ADMIN
    },
  };
  Object.assign(window.Services, { chamados: chamadosService });
})();
