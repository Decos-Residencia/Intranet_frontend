/* =========================================================================
   Botão "Parabenizar"
   Usado em Aniversariantes do Mês e Aniversariante do Dia.
   ========================================================================= */
(function () {
  const { icon } = UI;

  // Botão "Parabenizar": vira "Parabéns enviado" depois do primeiro envio.
  function parabensBtn(p, cls) {
    if (!App.can("interact")) return `<span class="text-xs text-slate-400 mt-auto flex items-center gap-1">${icon("lock","w-3.5 h-3.5")} Somente leitura</span>`;
    if (App.state.parabens.includes(p.nome)) return `<button disabled class="${cls} opacity-70 cursor-default">${icon("check","w-4 h-4")} Parabéns enviado</button>`;
    return `<button data-action="celebrate" data-nome="${UI.esc(p.nome)}" data-msg="🎉 Parabéns enviado para ${UI.esc(p.nome)}!" class="${cls} relative overflow-visible">${icon("party","w-4 h-4")} Parabenizar</button>`;
  }

  Object.assign(UI, { parabensBtn });
})();
