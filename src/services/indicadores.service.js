(function () {
  // Painel de indicadores (permissão ver_indicadores): leitura, obrigatórios, chamados e validade.
  const indicadoresService = {
    painel(params = {}) {
      return App.API.request(`/indicadores${Services.toQuery(params)}`);
    },
  };
  Object.assign(window.Services, { indicadores: indicadoresService });
})();
