(function () {
  // Eventos e inscrições (dados reais no PostgreSQL via FastAPI; nada em localStorage).
  const eventosService = {
    list(params = {}) {
      return App.API.request(`/eventos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`);
    },
    resumo() {
      return App.API.request("/eventos/resumo"); // totais reais (ADMIN)
    },
    minhas() {
      return App.API.request("/eventos/minhas-inscricoes");
    },
    inscritos(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscritos`); // ADMIN
    },
    create(data) {
      return App.API.request("/eventos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    inscrever(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscricao`, { method: "POST" });
    },
    cancelarInscricao(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscricao`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { eventos: eventosService });
})();
