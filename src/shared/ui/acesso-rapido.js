/* =========================================================================
   Atalho de Acessos Rápidos
   Três origens, nesta ordem: globais (do ADMIN), pessoais (do usuário) e os internos fixos.
   Externos (http/https) abrem em nova aba; rotas (#/...) navegam; "chamado" abre o formulário.
   ========================================================================= */
(function () {
  const externo = (url) => /^https?:\/\//i.test(url || "");

  function qaLink(it, cls, inner, canInteract, extraAttrs = "") {
    const destino = it.url || it.route;
    if (destino && externo(destino)) {
      return `<a href="${UI.esc(destino)}" target="_blank" rel="noopener noreferrer" class="${cls}" ${extraAttrs}>${inner}
        <span class="qa-ext" aria-hidden="true">${UI.icon("external-link", "w-3.5 h-3.5")}</span><span class="sr-only">(abre em nova aba)</span></a>`;
    }
    if (destino) return `<a href="${UI.esc(destino)}" class="${cls}" ${extraAttrs}>${inner}</a>`;
    if (!canInteract) return `<div class="${cls} opacity-40 cursor-not-allowed" title="Indisponível para seu perfil">${inner}</div>`;
    return `<button type="button" data-action="open-chamado" data-tipo="${it.chamado}" class="${cls}">${inner}</button>`;
  }

  // Lista única usada na Inicial e na bola flutuante.
  function todosAtalhos() {
    const globais = (App.state.api.atalhos || []).map((a) => ({ titulo: a.nome, url: a.url, icon: a.icone || "link", origem: "global" }));
    const pessoais = (App.state.user?.preferencias?.atalhos || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map((a) => ({ titulo: a.nome, url: a.url, icon: a.icone || "link", origem: "pessoal" }));
    return [...globais, ...pessoais, ...DB.acessosRapidos];
  }

  Object.assign(UI, { qaLink });
  Object.assign(App, { todosAtalhos });
})();
