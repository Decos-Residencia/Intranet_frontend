(function () {
  const notificacoesService = {
    list(params = {}) {
      return App.API.request(`/notificacoes${Services.toQuery(params)}`);
    },
    contagem() {
      return App.API.request("/notificacoes/contagem");
    },
    marcarLida(id) {
      return App.API.request(`/notificacoes/${encodeURIComponent(id)}/lida`, { method: "POST" });
    },
    marcarTodas() {
      return App.API.request("/notificacoes/lidas", { method: "POST" });
    },
  };

  Object.assign(window.Services, { notificacoes: notificacoesService });
})();
