(function () {
  const faqService = {
    list(params = {}) {
      return App.API.request(`/faqs${Services.toQuery(params)}`);
    },
    create(data) {
      return App.API.request("/faqs", { method: "POST", body: data });
    },
    // O backend ainda não tem GET/PUT/DELETE /faqs/{id} (BACKEND FUTURO).
  };

  Object.assign(window.Services, { faq: faqService });
})();
