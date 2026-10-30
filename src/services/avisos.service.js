(function () {
  const avisosService = {
    // Quem leu (ADMIN/RH): nome, setor e data da leitura, paginado.
    leitores(id, params = {}) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}/leitores${Services.toQuery(params)}`);
    },
    list(params = {}) {
      return App.API.request(`/avisos${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`);
    },
    resumo() {
      return App.API.request("/avisos/resumo"); // totais reais por estado e leituras (ADMIN)
    },
    leitura(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}/leitura`, { method: "POST" });
    },
    create(data) {
      return App.API.request("/avisos", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    // Foto opcional: link assinado de 60 s; enviar (multipart) ou remover.
    imagem(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}/imagem`);
    },
    definirImagem(id, arquivo) {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      return App.API.request(`/avisos/${encodeURIComponent(id)}/imagem`, { method: "PUT", body: fd, timeout: 60000 });
    },
    removerImagem(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}/imagem`, { method: "DELETE" });
    },
    remove(id) {
      return App.API.request(`/avisos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { avisos: avisosService });
})();
