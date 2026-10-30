(function () {
  // Vagas internas: mural (colaborador) e gestão (quem tem "gerenciar vagas").
  const id = (v) => encodeURIComponent(v);
  const vagasService = {
    listar(params = {}) {
      return App.API.request(`/vagas${Services.toQuery(params)}`);
    },
    obter(vagaId) {
      return App.API.request(`/vagas/${id(vagaId)}`);
    },
    criar(body) {
      return App.API.request("/vagas", { method: "POST", body });
    },
    atualizar(vagaId, body) {
      return App.API.request(`/vagas/${id(vagaId)}`, { method: "PUT", body });
    },
    encerrar(vagaId) {
      return App.API.request(`/vagas/${id(vagaId)}/encerrar`, { method: "POST" });
    },
    interesse(vagaId, mensagem) {
      return App.API.request(`/vagas/${id(vagaId)}/interesse`, { method: "POST", body: { mensagem: mensagem || null } });
    },
    retirar(vagaId) {
      return App.API.request(`/vagas/${id(vagaId)}/interesse`, { method: "DELETE" });
    },
    interessados(vagaId) {
      return App.API.request(`/vagas/${id(vagaId)}/interessados`);
    },
    interessadosCsv(vagaId) {
      return App.API.request(`/vagas/${id(vagaId)}/interessados.csv`); // texto (não JSON)
    },
  };
  Object.assign(window.Services, { vagas: vagasService });
})();
