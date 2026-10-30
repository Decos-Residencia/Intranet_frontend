(function () {
  const usuariosService = {
    // O próprio colaborador atualiza o ramal (só dígitos, 3 a 6; null remove). Devolve o /auth/me.
    atualizarMeuRamal(ramal) {
      return App.API.request("/auth/me/ramal", { method: "PUT", body: { ramal } });
    },
    list(params = {}) {
      return App.API.request(`/usuarios${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`);
    },
    update(id, data) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    // Planilha CSV: simular=true só confere (nada é gravado); false grava se não houver erro.
    importar(arquivo, simular) {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      fd.append("simular", simular ? "true" : "false");
      return App.API.request("/usuarios/importacao", { method: "POST", body: fd, timeout: 180000 });
    },
    remove(id) {
      return App.API.request(`/usuarios/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { usuarios: usuariosService });
})();
