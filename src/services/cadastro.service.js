(function () {
  // Solicitações cadastrais (um campo por pedido). O colaborador vê as próprias; o ADMIN vê todas.
  const cadastroService = {
    list(params = {}) {
      return App.API.request(`/solicitacoes-cadastrais${Services.toQuery(params)}`);
    },
    criar(body) {
      return App.API.request("/solicitacoes-cadastrais", { method: "POST", body });
    },
    aprovar(id, observacao) {
      return App.API.request(`/solicitacoes-cadastrais/${encodeURIComponent(id)}/aprovar`, {
        method: "POST", body: observacao ? { observacao } : {},
      });
    },
    rejeitar(id, observacao) {
      return App.API.request(`/solicitacoes-cadastrais/${encodeURIComponent(id)}/rejeitar`, {
        method: "POST", body: { observacao },
      });
    },
  };

  Object.assign(window.Services, { cadastro: cadastroService });
})();
