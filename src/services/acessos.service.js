(function () {
  // Controle de acesso (somente ADMIN): permissões por perfil; cada pessoa só recebe um perfil.
  const acessosService = {
    permissoes() {
      return App.API.request("/acessos/permissoes");
    },
    perfis() {
      return App.API.request("/acessos/perfis");
    },
    definirPerfil(perfil, permissoes) {
      return App.API.request(`/acessos/perfis/${encodeURIComponent(perfil)}`, { method: "PUT", body: { permissoes } });
    },
    usuarios(params = {}) {
      return App.API.request(`/acessos/usuarios${Services.toQuery(params)}`);
    },
    // body: { perfil?, ativo? }
    atualizar(id, body) {
      return App.API.request(`/acessos/usuarios/${encodeURIComponent(id)}`, { method: "PUT", body });
    },
  };
  Object.assign(window.Services, { acessos: acessosService });
})();
