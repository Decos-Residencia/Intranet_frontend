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
    // Troca da própria senha. Devolve um token novo (os anteriores deixam de valer).
    changePassword(senhaAtual, novaSenha) {
      return App.API.request("/auth/change-password", {
        method: "POST",
        body: { senha_atual: senhaAtual, nova_senha: novaSenha },
      });
    },
    forgotPassword(email) {
      return App.API.request("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email },
      });
    },
    // tokenHash vem do link do e-mail enviado pelo Supabase Auth; o backend o valida lá. O frontend
    // não recebe chave nem sessão do Supabase.
    resetPassword(tokenHash, novaSenha) {
      return App.API.request("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: { token_hash: tokenHash, nova_senha: novaSenha },
      });
    },
    // Cadastro feito por ADMIN (o backend sempre cria COLABORADOR). A senha
    // só trafega no corpo da requisição; nada é guardado no navegador.
    register(data) {
      return App.API.request("/auth/register", { method: "POST", body: data });
    },
  };

  Object.assign(window.Services, { auth: authService });
})();
