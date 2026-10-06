(function () {
  // CRUD completo de FAQ. ADMIN vê todas (e filtra por status); COLABORADOR só recebe as ativas.
  const faqService = {
    list(params = {}) {
      return App.API.request(`/faqs${Services.toQuery(params)}`);
    },
    get(id) {
      return App.API.request(`/faqs/${encodeURIComponent(id)}`);
    },
    resumo() {
      return App.API.request("/faqs/resumo"); // totais reais (ADMIN)
    },
    create(data) {
      return App.API.request("/faqs", { method: "POST", body: data });
    },
    update(id, data) {
      return App.API.request(`/faqs/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    remove(id) {
      return App.API.request(`/faqs/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  Object.assign(window.Services, { faq: faqService });
})();
