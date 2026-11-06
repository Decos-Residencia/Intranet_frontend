(function () {
  // Funcionalidades liberáveis: módulos que o ADMIN liga e desliga por perfil (ou para todos).
  const funcionalidadesService = {
    // Para quem chama (perfil do usuário ou visitante): { ligadas: ["agenda", ...] }
    ligadas() {
      return App.API.request("/funcionalidades/ligadas");
    },
    // ADMIN: [{ codigo, rotulo, publicos, ligada_para, alterado_em }]
    listar() {
      return App.API.request("/funcionalidades");
    },
    definir(codigo, ligadaPara) {
      return App.API.request(`/funcionalidades/${encodeURIComponent(codigo)}`, { method: "PUT", body: { ligada_para: ligadaPara } });
    },
  };
  Object.assign(window.Services, { funcionalidades: funcionalidadesService });
})();
