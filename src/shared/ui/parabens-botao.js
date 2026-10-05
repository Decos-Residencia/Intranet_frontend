/* =========================================================================
   Botão "Parabenizar"
   Usado em Aniversariantes do Mês e Aniversariante do Dia.
   ========================================================================= */
(function () {
  const { icon } = UI;

  // Estado vem do servidor (GET /aniversariantes*): só se parabeniza no dia, uma vez por pessoa e ano.
  function parabensBtn(p, cls) {
    if (!App.can("interact")) return `<span class="text-xs text-slate-400 mt-auto flex items-center gap-1">${icon("lock","w-3.5 h-3.5")} Somente leitura</span>`;
    if (App.state.user && p.id === App.state.user.id) return `<span class="text-xs font-bold text-wine mt-auto">É o seu dia! 🎉</span>`;
    if (p.jaParabenizado) return `<button disabled class="${cls} opacity-70 cursor-default">${icon("check","w-4 h-4")} Parabéns enviado</button>`;
    if (!p.hoje) return `<span class="text-xs text-slate-400 mt-auto">Disponível em ${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}</span>`;
    return `<button data-action="celebrate" data-id="${p.id}" data-nome="${UI.esc(p.nome)}" class="${cls} relative overflow-visible">${icon("party","w-4 h-4")} Parabenizar</button>`;
  }

  Object.assign(UI, { parabensBtn });
})();
