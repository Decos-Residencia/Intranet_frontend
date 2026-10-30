(function () {
  // Eventos e inscrições (dados reais no PostgreSQL via FastAPI; nada em localStorage).
  const eventosService = {
    list(params = {}) {
      return App.API.request(`/eventos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`);
    },
    resumo() {
      return App.API.request("/eventos/resumo"); // totais reais (ADMIN)
    },
    // Meus eventos de hoje (o servidor gera o aviso "É hoje" uma vez por inscrição).
    hoje() {
      return App.API.request("/eventos/hoje");
    },
    minhas() {
      return App.API.request("/eventos/minhas-inscricoes");
    },
    // CSV (texto) com os inscritos e envio da lista ao meu e-mail (ADMIN/RH).
    inscritosCsv(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscritos.csv`);
    },
    enviarInscritos(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscritos/enviar`, { method: "POST" });
    },
    inscritos(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscritos`); // ADMIN
    },
    create(data) {
      return App.API.request("/eventos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    // Fotos do evento (tipo "capa" = normal; "banner" = esticada da Inicial): link assinado de 60 s,
    // envio (FormData com "arquivo") e remoção.
    imagem(id, tipo = "capa") {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/imagem${Services.toQuery({ tipo })}`);
    },
    enviarImagem(id, formData, tipo = "capa") {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/imagem${Services.toQuery({ tipo })}`, { method: "PUT", body: formData, timeout: 120000 });
    },
    removerImagem(id, tipo = "capa") {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/imagem${Services.toQuery({ tipo })}`, { method: "DELETE" });
    },
    // Marca o evento como visto (some o selo "novo"); idempotente.
    visualizar(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/visualizacao`, { method: "POST" });
    },
    inscrever(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscricao`, { method: "POST" });
    },
    cancelarInscricao(id) {
      return App.API.request(`/eventos/${encodeURIComponent(id)}/inscricao`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { eventos: eventosService });
})();
