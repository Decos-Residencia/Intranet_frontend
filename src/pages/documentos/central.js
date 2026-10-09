/* =========================================================================
   Tela: Central de Documentos & POPs
   Rota: #/documentos
   Fonte: GET /documentos (o backend já entrega só o que o usuário pode ver: documentos gerais e do
   seu setor, ativos). Categorias e contagens vêm dos próprios dados; nada é fictício.
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc } = UI;
  const { wireList } = Lib;

  const ICONES = { pdf: ["PDF", "bg-red-50 text-red-600 dark:bg-red-500/10"], doc: ["W", "bg-blue-50 text-blue-600 dark:bg-blue-500/10"], docx: ["W", "bg-blue-50 text-blue-600 dark:bg-blue-500/10"], xls: ["X", "bg-green-50 text-green-600 dark:bg-green-500/10"], xlsx: ["X", "bg-green-50 text-green-600 dark:bg-green-500/10"] };
  const iconeArquivo = (ext, cls = "") => { const [t, c] = ICONES[ext] || ["DOC", "bg-slate-100 text-slate-600"]; return `<div class="doc-icon ${c} ${cls}">${t}</div>`; };
  const corBadge = (c) => (c === "red" ? "red" : c === "amber" ? "amber" : c === "green" ? "green" : "blue");

  function documentos() {
    const docs = App.documentosAll();
    const categorias = [...new Set(docs.map((d) => d.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    // Documento restrito a um setor = somente visualização (tela restrita, sem baixar); os demais podem ser baixados.
    const cards = docs.map((d) => {
      const somenteVer = !!d.setorId;
      const acao = somenteVer
        ? `<span class="tag-lock text-xs">${icon("lock", "w-3.5 h-3.5")} Somente visualização</span>`
        : App.can("download")
          ? `<button data-action="download-doc" data-id="${esc(d.id)}" class="btn-wine-soft text-xs px-4 py-2 flex items-center gap-1">${icon("download", "w-3.5 h-3.5")} Baixar</button>`
          : `<span class="tag-lock text-xs">${icon("lock", "w-3.5 h-3.5")} Sem permissão</span>`;
      return `
      <div class="card p-5 flex flex-col doc-item" data-tipo="${esc(d.tipo)}" data-busca="${esc((d.titulo + " " + d.desc + " " + d.tipo + " " + d.arquivo).toLowerCase())}">
        <div class="flex items-center justify-between mb-3">${badge(corBadge(d.cor), esc(d.tipo || "Documento"))}<span class="text-xs text-slate-400">${esc(d.atualizado)}</span></div>
        <div class="flex gap-3 mb-3">${iconeArquivo(d.ext)}<div><h3 class="font-bold text-slate-800 dark:text-slate-100 leading-snug">${esc(d.titulo)}</h3></div></div>
        <p class="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-4">${esc(d.desc || "Sem descrição.")}</p>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs text-slate-400">${esc(d.tamanho)}</span>
          <div class="flex items-center gap-2"><a href="#/documentos/${esc(d.id)}${somenteVer ? "/restrito" : ""}" class="btn-outline text-xs px-4 py-2">Visualizar</a>${acao}</div>
        </div>
      </div>`;
    }).join("");
    return {
      title: "Central de Documentos & POPs",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs" }])}
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap" data-filter-group="doc">
          ${[["all", "Todos"], ...categorias.map((c) => [c, c])].map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${esc(k)}">${esc(l)}</button>`).join("")}
        </div>
        <div class="search-box w-64"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
          <input id="doc-busca" placeholder="Buscar documento..." maxlength="200" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
      </div>
      <div id="doc-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${cards}</div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-6 flex-wrap gap-3">
        <span id="doc-info"></span><div class="flex gap-1.5" id="doc-pager"></div>
      </div>`,
      init() {
        wireList({
          containerId: "doc-grid", itemSel: ".doc-item", size: 9, pagerId: "doc-pager", infoId: "doc-info", label: "documentos",
          filterGroup: "doc", controls: ["#doc-busca"], onEmpty: docs.length ? "Nenhum documento encontrado." : "Nenhum documento disponível para você.",
          filterFn: (el, f) => {
            const q = (document.getElementById("doc-busca")?.value || "").trim().toLowerCase();
            return (f === "all" || el.dataset.tipo === f) && (!q || el.dataset.busca.includes(q));
          },
        });
      },
    };
  }

  Object.assign(Pages, { documentos });
  Object.assign(UI, { iconeArquivoDoc: iconeArquivo });
})();
