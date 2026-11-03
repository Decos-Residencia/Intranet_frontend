(function () {
  // Quem pode atender o chamado (ADMIN, ou usuário do setor com a permissão "Atender chamados").
  // Base do seletor de responsável; substitui a antiga lista de "responsáveis por setor". ADMIN.
  // Arquivo próprio para não conflitar com mudanças em andamento em chamados.service.js.
  Object.assign(window.Services.chamados, {
    atendentes(chamadoId) {
      return App.API.request(`/chamados/${encodeURIComponent(chamadoId)}/atendentes`);
    },
  });
})();
