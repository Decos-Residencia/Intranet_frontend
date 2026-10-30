(function () {
  // Temas de treinamento obrigatório (gestão) e presença nas turmas.
  const treinamentosService = {
    listar() {
      return App.API.request("/treinamentos-obrigatorios");
    },
    criar(body) {
      return App.API.request("/treinamentos-obrigatorios", { method: "POST", body });
    },
    atualizar(id, body) {
      return App.API.request(`/treinamentos-obrigatorios/${encodeURIComponent(id)}`, { method: "PUT", body });
    },
    excluir(id) {
      return App.API.request(`/treinamentos-obrigatorios/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    presencas(eventoId, presentes, ausentes) {
      return App.API.request(`/eventos/${encodeURIComponent(eventoId)}/presencas`, { method: "PUT", body: { presentes, ausentes } });
    },
  };
  Object.assign(window.Services, { treinamentos: treinamentosService });
})();
