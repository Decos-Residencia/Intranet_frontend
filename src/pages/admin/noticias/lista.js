/* =========================================================================
   Tela: Gerenciar Notícias
   Rota: #/admin/noticias
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const { wireList } = Lib;
  const { statCard, statusBadge, prioBadge, acoes, filtro, sel, TIPOS_NOTICIA } = AdminUI;

  function adminNoticias() {
    const s = DB.stats.noticias;
    const lista = App.state.noticias;
    const publicadas = lista.filter((n) => n.status === "Publicado").length;
    const alertas = lista.filter((n) => n.status === "Publicado" && n.prioridade === "urgente").length;
    const rows = lista.map((n) => `
      <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-tipo="${esc(n.tipo)}" data-status="${esc(n.status)}" data-prio="${esc(n.prioridade)}">
        <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs">${esc(n.titulo)}</div>
          <div class="text-xs text-slate-400">${esc(n.tipo)} • ${esc(n.quando)}</div></td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${esc(n.autor)}</td>
        <td>${statusBadge(n.status)}</td>
        <td>${prioBadge(n.prioridade)}</td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${n.leituras || 0}</td>
        <td>${acoes("preview-noticia", n.id, `#/admin/noticias/${n.id}/editar`, "Notícia: " + n.titulo, "noticia", "noticias")}</td>
      </tr>`).join("");

    return {
      title: "Painel de Notícias",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciamento de Comunicados & Notícias</h2></div>
        <a href="#/admin/noticias/nova" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus","w-4 h-4")} Criar Notícia</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        ${statCard("NOTÍCIAS PUBLICADAS", publicadas, lista.length + " no painel", "megaphone")}
        ${statCard("VISUALIZAÇÕES TOTAIS (MÊS)", s.views, "↑ "+s.viewsDelta+" vs ago", "trending-up")}
        ${statCard("ALERTAS CRÍTICOS", String(alertas).padStart(2, "0"), alertas ? "Ação Imediata" : "Nenhum ativo", "alert-triangle", alertas > 0)}
      </div>
      <div class="card p-5 mb-5">
        <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-slate-800 dark:text-slate-100">Filtrar Notícias</h3>
        <span class="text-xs text-slate-400" id="not-count"></span></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${filtro("fn-tipo", "CATEGORIA", TIPOS_NOTICIA)}${filtro("fn-status", "STATUS", ["Publicado", "Agendado", "Rascunho"])}
          ${filtro("fn-prio", "PRIORIDADE", [{ value: "normal", label: "Normal" }, { value: "relevante", label: "Relevante" }, { value: "urgente", label: "Urgente" }])}
        </div>
      </div>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <th class="py-3 pl-4">NOTÍCIA</th><th>AUTOR</th><th>STATUS</th><th>PRIORIDADE</th><th>LEITURAS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
          <tbody id="not-rows">${rows}</tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="not-info">Exibindo comunicados</span>
        <div class="flex gap-1.5" id="not-pager"></div>
      </div>`,
      init() {
        wireList({ containerId: "not-rows", itemSel: "tr", size: 5, pagerId: "not-pager", infoId: "not-info", label: "comunicados", crimson: true,
          controls: ["#fn-tipo", "#fn-status", "#fn-prio"], onEmpty: "Nenhuma notícia com esses filtros.",
          filterFn: (el) => (!sel("fn-tipo") || el.dataset.tipo === sel("fn-tipo")) && (!sel("fn-status") || el.dataset.status === sel("fn-status")) && (!sel("fn-prio") || el.dataset.prio === sel("fn-prio")) });
      },
    };
  }

  function previewNoticia(id) {
    const n = App.findItem("noticias", id);
    if (!n) return;
    const noMural = n.own && n.status === "Publicado";
    App.openPanel("Pré-visualização", `
      <div class="flex gap-2 flex-wrap mb-3">${statusBadge(n.status)} ${prioBadge(n.prioridade)} ${badge("blue", esc(n.tipo).toUpperCase())}</div>
      <h3 class="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-2">${esc(n.titulo)}</h3>
      <div class="text-xs text-slate-400 mb-4">${esc(n.autor)} • ${esc(n.quando)} • ${n.leituras || 0} leituras</div>
      ${typeof n.imagem === "string" ? `<img src="${n.imagem}" alt="" class="w-full rounded-xl mb-4 max-h-48 object-cover">` : ""}
      <div class="prose-decos space-y-3 text-sm">${(n.corpo || "Sem conteúdo cadastrado.").split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <div class="flex gap-2 mt-6">
        <a href="#/admin/noticias/${n.id}/editar" class="btn-crimson flex-1 py-2.5 text-center">Editar</a>
        ${noMural ? `<a href="#/avisos/${n.id}" class="btn-outline flex-1 py-2.5 text-center">Ver no mural</a>` : ""}
      </div>`);
  }

  Object.assign(PagesAdmin, { adminNoticias, previewNoticia });
})();
