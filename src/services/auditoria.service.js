(function () {
  // Somente leitura (ADMIN): o log é gravado pelo backend, nunca pelo navegador.
  const auditoriaService = {
    list(params = {}) {
      return App.API.request(`/auditoria${Services.toQuery(params)}`);
    },
  };

  Object.assign(window.Services, { auditoria: auditoriaService });
})();
