/* =========================================================================
   Tela: Gerenciar Documentos
   Rota: #/admin/documentos
   ========================================================================= */
(function () {
  const { icon, badge, esc, kv } = UI;
  const { wireList } = Lib;
  const { statCard, statusBadge, corDoc, acoes, filtro, sel, TIPOS_DOC, permBadge } = AdminUI;

  function adminDocumentos() {
    const s = DB.stats.documentos;
    const lista = App.state.docsAdm;
    const pend = lista.filter((d) => d.status === "Em Revisão" || d.status === "Rascunho").length;
    const rows = lista.map((d) => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-tipo="${esc(d.tipo)}" data-status="${esc(d.status)}" data-perm="${esc(d.permissao)}">
        <td class="py-3.5 pl-4"><div class="flex items-center gap-2 mb-1">${badge(corDoc(d.cor), d.tipo)}<span class="text-xs text-slate-400">Atualizado em ${esc(d.quando)}</span></div>
          <div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm">${esc(d.titulo)}</div></td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${esc(d.autor)}</td>
        <td>${statusBadge(d.status)}</td>
        <td>${permBadge(d.permissao)}</td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${esc(d.tamanho)}</td>
        <td>${acoes("preview-doc", d.id, `#/admin/documentos/${d.id}/editar`, "Documento: " + d.titulo, "documento", "docsAdm")}</td>
      </tr>`).join("");

    return {
      title: "Central de Documentos & POPs",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciamento de Documentos & POPs</h2></div>
        <div class="flex gap-2 flex-wrap">
          <a href="#/documentos" class="btn-outline px-5 py-2.5 flex items-center gap-2">${icon("eye","w-4 h-4")} Ver central pública</a>
          <a href="#/admin/documentos/novo" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus","w-4 h-4")} Adicionar Documento</a>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        ${statCard("TOTAL DE DOCUMENTOS", s.total + lista.filter((d) => d.own).length, lista.length + " no painel", "file-text")}
        ${statCard("PROTOCOLOS ATIVOS", s.protocolos, "SCIH e Qualidade", "file-text")}
        ${statCard("DOWNLOADS REALIZADOS", s.downloads, "Mês atual", "trending-up")}
        ${statCard("PENDÊNCIAS DE REVISÃO", String(pend).padStart(2, "0"), pend ? "Ação Necessária" : "Tudo em dia", "alert-triangle", pend > 0)}
      </div>
      <div class="card p-5 mb-5">
        <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-slate-800 dark:text-slate-100">Filtrar Documentação</h3></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${filtro("fd-tipo", "CATEGORIA", TIPOS_DOC.map((t) => ({ value: t.value, label: t.value })))}
          ${filtro("fd-status", "STATUS", ["Publicado", "Em Revisão", "Rascunho"])}
          ${filtro("fd-perm", "PERMISSÃO", [{ value: "download", label: "Download Disponível" }, { value: "view", label: "Somente Visualização" }])}
        </div>
      </div>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <th class="py-3 pl-4">DOCUMENTO</th><th>AUTOR / DEP.</th><th>STATUS</th><th>PERMISSÃO</th><th>TAMANHO</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
          <tbody id="doc-rows">${rows}</tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="docr-info">Exibindo documentos</span>
        <div class="flex gap-1.5" id="docr-pager"></div>
      </div>`,
      init() {
        wireList({ containerId: "doc-rows", itemSel: "tr", size: 5, pagerId: "docr-pager", infoId: "docr-info", label: "documentos", crimson: true,
          controls: ["#fd-tipo", "#fd-status", "#fd-perm"], onEmpty: "Nenhum documento com esses filtros.",
          filterFn: (el) => (!sel("fd-tipo") || el.dataset.tipo === sel("fd-tipo")) && (!sel("fd-status") || el.dataset.status === sel("fd-status")) && (!sel("fd-perm") || el.dataset.perm === sel("fd-perm")) });
      },
    };
  }

  function previewDocumento(id) {
    const d = App.findItem("docsAdm", id);
    if (!d) return;
    const publico = d.own && d.status === "Publicado";
    App.openPanel("Detalhes do documento", `
      <div class="flex gap-2 flex-wrap mb-3">${badge(corDoc(d.cor), d.tipo)} ${statusBadge(d.status)}</div>
      <h3 class="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-3">${esc(d.titulo)}</h3>
      ${d.desc ? `<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${esc(d.desc)}</p>` : ""}
      <div class="space-y-2 text-sm mb-4">${kv("Autor / Dep.", esc(d.autor))}${kv("Setor", esc(d.setor || "—"))}${kv("Versão", esc(d.versao || "—"))}${kv("Arquivo", esc(d.arquivo || "—"))}${kv("Tamanho", esc(d.tamanho))}${kv("Atualizado", esc(d.quando))}</div>
      <div class="mb-6">${permBadge(d.permissao)}</div>
      <div class="flex gap-2">
        <a href="#/admin/documentos/${d.id}/editar" class="btn-crimson flex-1 py-2.5 text-center">Editar</a>
        ${publico ? `<a href="${d.permissao === "download" ? `#/documentos/${d.id}` : `#/documentos/${d.id}/restrito`}" class="btn-outline flex-1 py-2.5 text-center">Ver na central</a>` : ""}
      </div>`);
  }

  Object.assign(PagesAdmin, { adminDocumentos, previewDocumento });
})();
