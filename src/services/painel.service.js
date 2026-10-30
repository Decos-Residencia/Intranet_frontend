(function () {
  // Meu painel: tudo o que está pendente para o usuário logado, numa chamada só.
  const painelService = {
    resumo() {
      return App.API.request("/painel");
    },
  };
  Object.assign(window.Services, { painel: painelService });
})();
