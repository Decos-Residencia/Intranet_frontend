(function () {
  // Aniversariantes (só dia/mês, só usuários ativos) e parabéns persistidos no backend.
  const aniversariantesService = {
    list(params = {}) {
      return App.API.request(`/aniversariantes${Services.toQuery(params)}`);
    },
    hoje() {
      return App.API.request("/aniversariantes/hoje");
    },
    proximos(dias = 30) {
      return App.API.request(`/aniversariantes/proximos${Services.toQuery({ dias })}`);
    },
    parabenizar(aniversarianteId) {
      return App.API.request("/parabens", { method: "POST", body: { aniversariante_id: aniversarianteId } });
    },
  };

  Object.assign(window.Services, { aniversariantes: aniversariantesService });
})();
