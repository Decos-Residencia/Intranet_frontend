(function () {
  // Calendário institucional: feriados (calculados), campanhas, datas comemorativas e auditorias.
  const calendarioService = {
    listar(de, ate) {
      return App.API.request(`/calendario-institucional${Services.toQuery({ de, ate })}`);
    },
    criar(body) {
      return App.API.request("/calendario-institucional", { method: "POST", body });
    },
    atualizar(id, body) {
      return App.API.request(`/calendario-institucional/${encodeURIComponent(id)}`, { method: "PUT", body });
    },
    excluir(id) {
      return App.API.request(`/calendario-institucional/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
  Object.assign(window.Services, { calendario: calendarioService });
})();
