(function () {
  // Responsáveis por setor (quem atende e recebe e-mail dos chamados do setor). Só ADMIN.
  const responsaveisSetorService = {
    list(setorId) {
      return App.API.request(`/chamados/responsaveis-setor${Services.toQuery(setorId ? { setor_id: setorId } : {})}`);
    },
    add(data) {
      return App.API.request("/chamados/responsaveis-setor", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/chamados/responsaveis-setor/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
  };
  Object.assign(window.Services, { responsaveisSetor: responsaveisSetorService });
})();
