(function () {
  // Preferências do usuário (tema, acessibilidade, atalhos pessoais), salvas na conta.
  const preferenciasService = {
    // Envia só o que mudou; `null` numa chave volta ao padrão. Devolve o /auth/me atualizado.
    salvar(parcial) {
      return App.API.request("/auth/me/preferencias", { method: "PUT", body: parcial });
    },
  };
  Object.assign(window.Services, { preferencias: preferenciasService });
})();
