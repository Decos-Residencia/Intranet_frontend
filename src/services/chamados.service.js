(function () {
  // Chamados (dados reais no PostgreSQL via FastAPI; nada em localStorage).
  const chamadosService = {
    create(data) {
      return App.API.request("/chamados", { method: "POST", body: data });
    },
    meus(params = {}) {
      return App.API.request(`/chamados/meus${Services.toQuery(params)}`);
    },
    // Fila de atendimento: quem tem "Atender chamados" vê tudo; responsável por setor, só o setor.
    list(params = {}) {
      return App.API.request(`/chamados${Services.toQuery(params)}`);
    },
    resumo() {
      return App.API.request("/chamados/resumo");
    },
    // { pode_atender, administrador, setores_ids }
    permissoes() {
      return App.API.request("/chamados/permissoes");
    },
    atendentes(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}/atendentes`);
    },
    historico(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}/historico`);
    },
    // Quem pode atender chamados do setor (nome e setor; nunca e-mail). Alimenta o seletor "Responsável".
    atendentesDoSetor(setorId) {
      return App.API.request(`/chamados/atendentes${Services.toQuery({ setor_id: setorId })}`);
    },
    get(id) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`);
    },
    update(id, data) {
      return App.API.request(`/chamados/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
  };
  Object.assign(window.Services, { chamados: chamadosService });
})();
