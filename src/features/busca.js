/* =========================================================================
   Busca global (avisos, documentos, ramais)
   ========================================================================= */
(function () {
  function openSearchPanel(q) {
    const t = q.toLowerCase();
    const av = App.avisosAll().filter((a) => a.titulo.toLowerCase().includes(t)).slice(0, 4);
    const doc = App.documentosAll().filter((d) => (d.titulo + d.tipo).toLowerCase().includes(t)).slice(0, 4);
    const rm = DB.ramais.filter((r) => (r.nome + r.setor + r.ramal).toLowerCase().includes(t)).slice(0, 4);
    const sec = (titulo, arr, renderItem) => arr.length ? `<div class="mb-4"><div class="text-xs font-bold tracking-wider text-slate-400 mb-2">${titulo}</div><div class="space-y-2">${arr.map(renderItem).join("")}</div></div>` : "";
    const html = `<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Resultados para <b class="text-wine">"${q}"</b></p>
      ${sec("AVISOS", av, (a) => `<a href="#/avisos/${a.id}" data-action="close-panel" class="block card p-3 hover:shadow-md"><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${a.titulo}</div><div class="text-xs text-slate-400">${a.autor}</div></a>`)}
      ${sec("DOCUMENTOS", doc, (d) => `<a href="#/documentos/${d.id}" data-action="close-panel" class="block card p-3 hover:shadow-md"><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${d.titulo}</div><div class="text-xs text-slate-400">${d.tipo} • ${d.tamanho}</div></a>`)}
      ${sec("RAMAIS", rm, (r) => `<a href="#/diretorio" data-action="close-panel" class="block card p-3 hover:shadow-md flex items-center justify-between"><div><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${r.nome}</div><div class="text-xs text-slate-400">${r.setor}</div></div><span class="font-bold text-wine">${r.ramal}</span></a>`)}
      ${(!av.length && !doc.length && !rm.length) ? `<div class="text-center py-10 text-slate-400"><div class="text-4xl mb-2">🔍</div>Nada encontrado para "${q}".</div>` : ""}`;
    App.openPanel("Busca", html);
  }

  Object.assign(App, { openSearchPanel });
})();
