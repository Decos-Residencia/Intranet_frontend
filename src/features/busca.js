/* =========================================================================
   Busca global (avisos, documentos, ramais)
   ========================================================================= */
(function () {
  function searchResults(q, limit = 4) {
    const t = q.trim().toLowerCase();
    if (!t) return { av: [], doc: [], rm: [] };
    return {
      av: App.avisosAll().filter((a) => (a.titulo + " " + a.resumo + " " + a.autor).toLowerCase().includes(t)).slice(0, limit),
      doc: App.documentosAll().filter((d) => (d.titulo + " " + d.tipo + " " + d.arquivo).toLowerCase().includes(t)).slice(0, limit),
      rm: App.ramaisAll().filter((r) => (r.nome + " " + r.setor + " " + r.cargo + " " + r.ramal).toLowerCase().includes(t)).slice(0, limit),
    };
  }

  function openSearchPanel(q) {
    const { av, doc, rm } = searchResults(q);
    const sec = (titulo, arr, renderItem) => arr.length ? `<div class="mb-4"><div class="text-xs font-bold tracking-wider text-slate-400 mb-2">${titulo}</div><div class="space-y-2">${arr.map(renderItem).join("")}</div></div>` : "";
    const html = `<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Resultados para <b class="text-wine">"${UI.esc(q)}"</b></p>
      ${sec("AVISOS", av, (a) => `<a href="#/avisos/${a.id}" data-action="close-panel" class="block card p-3 hover:shadow-md"><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${UI.esc(a.titulo)}</div><div class="text-xs text-slate-400">${UI.esc(a.autor)}</div></a>`)}
      ${sec("DOCUMENTOS", doc, (d) => `<a href="#/documentos/${d.id}" data-action="close-panel" class="block card p-3 hover:shadow-md"><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${UI.esc(d.titulo)}</div><div class="text-xs text-slate-400">${UI.esc(d.tipo)}</div></a>`)}
      ${sec("RAMAIS", rm, (r) => `<a href="#/diretorio" data-action="close-panel" class="block card p-3 hover:shadow-md flex items-center justify-between"><div><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${UI.esc(r.nome)}</div><div class="text-xs text-slate-400">${UI.esc(r.setor)}</div></div><span class="font-bold text-wine">${UI.esc(r.ramal)}</span></a>`)}
      ${(!av.length && !doc.length && !rm.length) ? `<div class="text-center py-10 text-slate-400"><div class="text-4xl mb-2">🔍</div>Nada encontrado para "${UI.esc(q)}".</div>` : ""}`;
    App.openPanel("Busca", html);
  }

  function previewHtml(q) {
    const termo = q.trim();
    if (termo.length < 2) return "";
    const { av, doc, rm } = searchResults(termo, 3);
    const total = av.length + doc.length + rm.length;
    const sec = (titulo, arr, renderItem) => arr.length ? `<div class="search-preview-section"><div class="search-preview-title">${titulo}</div>${arr.map(renderItem).join("")}</div>` : "";
    return `${sec("Avisos", av, (a) => `<a href="#/avisos/${a.id}" class="search-preview-item"><span class="search-preview-icon">${UI.icon("megaphone", "w-4 h-4")}</span><span><strong>${UI.esc(a.titulo)}</strong><small>${UI.esc(a.autor)}</small></span></a>`)}
      ${sec("Documentos", doc, (d) => `<a href="#/documentos/${d.id}" class="search-preview-item"><span class="search-preview-icon">${UI.icon("file-text", "w-4 h-4")}</span><span><strong>${UI.esc(d.titulo)}</strong><small>${UI.esc(d.tipo)}</small></span></a>`)}
      ${sec("Ramais", rm, (r) => `<a href="#/diretorio" class="search-preview-item"><span class="search-preview-icon">${UI.icon("users", "w-4 h-4")}</span><span><strong>${UI.esc(r.nome)}</strong><small>${UI.esc(r.setor)} · ramal ${UI.esc(r.ramal)}</small></span></a>`)}
      ${total ? `<button type="submit" class="search-preview-more">Ver todos os resultados</button>` : `<div class="search-preview-empty">Nada encontrado para "${UI.esc(termo)}".</div>`}`;
  }

  function wireSearchPreview() {
    const form = document.querySelector('[data-action="search"]');
    if (!form || form.dataset.previewReady) return;
    const input = form.querySelector("[data-search-input]");
    const preview = form.querySelector("[data-search-preview]");
    if (!input || !preview) return;
    form.dataset.previewReady = "true";
    const render = () => {
      preview.innerHTML = previewHtml(input.value);
      preview.classList.toggle("hidden", !preview.innerHTML);
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    preview.addEventListener("click", (e) => {
      if (e.target.closest("a")) preview.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) preview.classList.add("hidden");
    });
  }

  Object.assign(App, { openSearchPanel, wireSearchPreview });
})();
