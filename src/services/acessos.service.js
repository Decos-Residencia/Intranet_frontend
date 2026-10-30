(function () {
  // Controle de acesso (somente ADMIN): perfil, ativação e permissões individuais.
  const acessosService = {
    permissoes() {
      return App.API.request("/acessos/permissoes");
    },
    usuarios(params = {}) {
      return App.API.request(`/acessos/usuarios${Services.toQuery(params)}`);
    },
    // body: { perfil?, ativo?, ajustes?: [{ permissao, concedida: true | false | null }] }
    atualizar(id, body) {
      return App.API.request(`/acessos/usuarios/${encodeURIComponent(id)}`, { method: "PUT", body });
    },
  };
  Object.assign(window.Services, { acessos: acessosService });
})();
