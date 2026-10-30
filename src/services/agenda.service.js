(function () {
  // Agenda pessoal (só do usuário logado): tarefas por dia.
  const agendaService = {
    doDia(data) {
      return App.API.request(`/agenda${Services.toQuery({ data })}`);
    },
    criar(body) {
      return App.API.request("/agenda", { method: "POST", body });
    },
    atualizar(id, body) {
      return App.API.request(`/agenda/${encodeURIComponent(id)}`, { method: "PUT", body });
    },
    excluir(id) {
      return App.API.request(`/agenda/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    lembretes(data) {
      return App.API.request(`/agenda/lembretes${Services.toQuery({ data })}`);
    },
    reordenar(data, ids) {
      return App.API.request("/agenda/ordem", { method: "PUT", body: { data, ids } });
    },
  };
  Object.assign(window.Services, { agenda: agendaService });
})();
