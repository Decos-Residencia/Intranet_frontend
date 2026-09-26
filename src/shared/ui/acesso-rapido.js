/* =========================================================================
   Atalho de Acessos Rápidos
   ========================================================================= */
(function () {
  // Um atalho de Acessos Rápidos: rota (link) ou chamado (abre o formulário).
  // Usado tanto na faixa do Início quanto na bola flutuante.
  function qaLink(it, cls, inner, canInteract, extraAttrs = "") {
    if (it.route) return `<a href="${it.route}" class="${cls}" ${extraAttrs}>${inner}</a>`;
    if (!canInteract) return `<div class="${cls} opacity-40 cursor-not-allowed" title="Indisponível para seu perfil">${inner}</div>`;
    return `<button type="button" data-action="open-chamado" data-tipo="${it.chamado}" class="${cls}">${inner}</button>`;
  }

  Object.assign(UI, { qaLink });
})();
