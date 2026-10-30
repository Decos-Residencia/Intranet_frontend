(function () {
  // Revisão de publicações: fila (quem aprova) e envio/decisão de avisos e eventos.
  const base = (tipo, id) => `/${tipo === "evento" ? "eventos" : "avisos"}/${encodeURIComponent(id)}`;
  const revisaoService = {
    fila() {
      return App.API.request("/revisao");
    },
    enviar(tipo, id) {
      return App.API.request(`${base(tipo, id)}/revisao`, { method: "POST" });
    },
    aprovar(tipo, id) {
      return App.API.request(`${base(tipo, id)}/aprovar`, { method: "POST" });
    },
    devolver(tipo, id, motivo) {
      return App.API.request(`${base(tipo, id)}/devolver`, { method: "POST", body: { motivo } });
    },
  };
  Object.assign(window.Services, { revisao: revisaoService });
})();
