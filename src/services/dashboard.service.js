(function () {
  // Números do dashboard, agregados no servidor (nada é contado no navegador).
  const dashboardService = {
    resumo() {
      return App.API.request("/dashboard/resumo");
    },
  };
  Object.assign(window.Services, { dashboard: dashboardService });
})();
