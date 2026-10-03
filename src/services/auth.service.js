(function () {
  const authService = {
    login(credentials) {
      return App.API.request("/auth/login", {
        method: "POST",
        auth: false,
        body: credentials,
      });
    },
    me() {
      return App.API.request("/auth/me");
    },
    // Cadastro feito por ADMIN (o backend sempre cria COLABORADOR). A senha
    // só trafega no corpo da requisição; nada é guardado no navegador.
    register(data) {
      return App.API.request("/auth/register", { method: "POST", body: data });
    },
  };

  Object.assign(window.Services, { auth: authService });
})();
