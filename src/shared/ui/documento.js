/* =========================================================================
   Peças de documento
   Linha chave/valor usada no visualizador de documentos.
   ========================================================================= */
(function () {
  const { esc } = UI;

  function kv(k, v) {
    return `<div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2"><span class="text-slate-500 dark:text-slate-400">${k}:</span><span class="font-bold text-slate-800 dark:text-slate-100 text-right">${v}</span></div>`;
  }
  Object.assign(UI, { kv });
})();
