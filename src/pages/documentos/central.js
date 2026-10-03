/* =========================================================================
   Tela: Central de Documentos & POPs
   Rota: #/documentos
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc } = UI;
  const { wireFilters, wireList } = Lib;

  function documentos() {
    const docs = App.documentosAll();
    const vazio = docs.length ? "Nenhum documento neste tipo." : "Nenhum documento encontrado.";
    const cards = docs.map((d) => docCard(d)).join("");
    const rows = docs.map((d) => docCardList(d)).join("");
    const map = { "Todos": "all", "Protocolos": "PROTOCOLO", "Manuais": "MANUAL", "Formulários": "FORMULÁRIO", "POPs": "POP", "Normas": "NORMA" };
    const filterFn = (el, f) => { const tp = map[f] || "all"; return tp === "all" || el.dataset.tipo === tp; };
    return {
      title: "Central de Documentos & POPs",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs"}])}
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap" data-filter-group="doc">
          ${["Todos","Protocolos","Manuais","Formulários","POPs","Normas"].map((f,i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${f}">${f}</button>`).join("")}
        </div>
        <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1" data-filter-group="doc-view">
          <button class="chip chip-active" data-filter="grid">Grid</button>
          <button class="chip" data-filter="lista">Lista</button>
        </div>
      </div>
      <div id="doc-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${cards}</div>
      <div id="doc-list-wrap" class="hidden">
        <div class="card divide-y divide-slate-50 dark:divide-slate-800" id="doc-list">${rows}</div>
        <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
          <span id="doc-info-list">Exibindo documentos</span>
          <div class="flex gap-1.5" id="doc-pager-list"></div>
        </div>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-6 flex-wrap gap-3" id="doc-grid-footer">
        <span id="doc-info">Exibindo documentos</span>
        <div class="flex gap-1.5" id="doc-pager"></div>
      </div>`,
      init() {
        wireList({
          containerId: "doc-grid", itemSel: ".doc-item", size: 3,
          pagerId: "doc-pager", infoId: "doc-info", label: "documentos",
          filterGroup: "doc", onEmpty: vazio, filterFn,
        });
        wireList({
          containerId: "doc-list", itemSel: ".doc-item-list", size: 6,
          pagerId: "doc-pager-list", infoId: "doc-info-list", label: "documentos",
          onEmpty: vazio, filterFn,
        });
        wireFilters("doc-view", (f) => {
          document.getElementById("doc-grid").classList.toggle("hidden", f !== "grid");
          document.getElementById("doc-grid-footer").classList.toggle("hidden", f !== "grid");
          document.getElementById("doc-list-wrap").classList.toggle("hidden", f !== "lista");
        });
      },
    };
  }
  function docCardList(d) {
    const fileIcon = d.icone === "W"
      ? `<div class="doc-icon bg-blue-50 text-blue-600 dark:bg-blue-500/10 !w-10 !h-10 text-[10px]">W</div>`
      : `<div class="doc-icon bg-red-50 text-red-600 dark:bg-red-500/10 !w-10 !h-10 text-[10px]">PDF</div>`;
    const acao = !d.download
      ? `<span class="tag-lock text-xs">${icon("lock","w-3.5 h-3.5")} Só visualização</span>`
      : App.can("download")
        ? `<button data-action="download-doc" data-id="${d.id}" class="btn-wine-soft text-xs px-3 py-1.5 flex items-center gap-1">${icon("download","w-3.5 h-3.5")} Baixar</button>`
        : `<span class="tag-lock text-xs">${icon("lock","w-3.5 h-3.5")} Sem permissão</span>`;
    return `<div class="flex items-center gap-4 p-4 doc-item-list" data-tipo="${esc(d.tipo)}">
      ${fileIcon}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap"><h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(d.titulo)}</h3>${badge(d.cor==="red"?"red":d.cor==="amber"?"amber":d.cor==="blue"?"blue":"green", esc(d.tipo))}</div>
        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(d.desc)}</p>
      </div>
      <span class="text-xs text-slate-400 hidden sm:block w-16 shrink-0">${esc(d.tamanho)}</span>
      <span class="text-xs text-slate-400 hidden md:block w-28 shrink-0">${d.data}</span>
      <div class="flex items-center gap-2 shrink-0">
        <a href="${d.download ? `#/documentos/${d.id}` : `#/documentos/${d.id}/restrito`}" class="btn-outline text-xs px-3 py-1.5">Ver</a>${acao}
      </div>
    </div>`;
  }
  function docCard(d) {
    const fileIcon = d.icone === "W"
      ? `<div class="doc-icon bg-blue-50 text-blue-600 dark:bg-blue-500/10">W</div>`
      : `<div class="doc-icon bg-red-50 text-red-600 dark:bg-red-500/10">PDF</div>`;
    const acao = !d.download
      ? `<span class="tag-lock text-xs">${icon("lock","w-3.5 h-3.5")} Somente visualização</span>`
      : App.can("download")
        ? `<button data-action="download-doc" data-id="${d.id}" class="btn-wine-soft text-xs px-4 py-2 flex items-center gap-1">${icon("download","w-3.5 h-3.5")} Baixar</button>`
        : `<span class="tag-lock text-xs">${icon("lock","w-3.5 h-3.5")} Sem permissão</span>`;
    return `<div class="card p-5 flex flex-col doc-item" data-tipo="${esc(d.tipo)}">
      <div class="flex items-center justify-between mb-3">${badge(d.cor==="red"?"red":d.cor==="amber"?"amber":d.cor==="blue"?"blue":"green", esc(d.tipo))}<span class="text-xs text-slate-400">${d.data}</span></div>
      <div class="flex gap-3 mb-3">${fileIcon}<div><h3 class="font-bold text-slate-800 dark:text-slate-100 leading-snug">${esc(d.titulo)}</h3></div></div>
      <p class="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-4">${esc(d.desc)}</p>
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span class="text-xs text-slate-400">${esc(d.tamanho)}</span>
        <div class="flex items-center gap-2"><a href="${d.download ? `#/documentos/${d.id}` : `#/documentos/${d.id}/restrito`}" class="btn-outline text-xs px-4 py-2">Visualizar</a>${acao}</div>
      </div>
    </div>`;
  }

  Object.assign(Pages, { documentos });
})();
