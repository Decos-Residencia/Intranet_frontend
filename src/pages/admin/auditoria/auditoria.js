/* =========================================================================
   Tela: Auditoria (somente ADMIN)
   Rota: #/admin/auditoria
   Fonte: GET /auditoria. O log é gravado pelo BACKEND, na mesma transação de cada operação
   administrativa (nunca pelo navegador) e é imutável.
   ========================================================================= */
(function () {
  const { icon, esc } = UI;

  const FILTROS = [["all", "Todas"], ["aviso", "Notícias"], ["documento", "Documentos"], ["usuario", "Usuários"], ["setor", "Setores"], ["faq", "FAQ"], ["avaliacao", "Avaliações"], ["solicitacao", "Solicitações"], ["evento", "Eventos"]];
  const TIPO_ICONE = { aviso: "megaphone", documento: "file-text", usuario: "user-cog", setor: "users", faq: "help-circle", avaliacao: "check-check", solicitacao: "user-cog", evento: "calendar" };
  const POR_PAGINA = 20;
  const quando = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const fmtQuando = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : quando.format(d); };

  function linhaHtml(l) {
    return `<div class="audit-row flex gap-3 p-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span class="notif-icon">${icon(TIPO_ICONE[l.entidade] || "file-text", "w-5 h-5")}</span>
      <div class="flex-1"><div class="text-sm text-slate-700 dark:text-slate-200">
        <b class="text-slate-900 dark:text-white">${esc(l.usuario_nome || "Sistema")}</b> · <span class="text-wine font-semibold">${esc(l.descricao)}</span></div>
        <div class="text-xs text-slate-400 mt-0.5">${esc(fmtQuando(l.criado_em))}</div></div>
    </div>`;
  }

  function adminAuditoria() {
    const estado = { entidade: "all", q: "", page: 1 };
    let ultimoFiltro = null;

    const params = (extra = {}) => ({ ...(estado.entidade !== "all" ? { entidade: estado.entidade } : {}), ...(estado.q ? { q: estado.q } : {}), ...extra });

    async function carregar() {
      const lista = document.getElementById("audit-list"), info = document.getElementById("audit-info"), pager = document.getElementById("audit-pager");
      if (!lista) return;
      lista.innerHTML = `<div class="p-10 text-center text-slate-400">Carregando…</div>`;
      try {
        const r = await Services.auditoria.list(params({ page: estado.page, page_size: POR_PAGINA }));
        ultimoFiltro = JSON.stringify(params());
        if (!document.getElementById("audit-list")) return; // saiu da tela durante o carregamento
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        lista.innerHTML = r.items.length ? r.items.map(linhaHtml).join("")
          : `<div class="p-10 text-center text-slate-400">${estado.entidade === "all" && !estado.q ? "Nenhuma ação registrada ainda." : "Nenhuma ação encontrada para este filtro."}</div>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total} registros`;
        pager.innerHTML = paginas > 1
          ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>`
          : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => {
          estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar();
        }));
      } catch (err) {
        if (document.getElementById("audit-list")) lista.innerHTML = `<div class="p-10 text-center text-slate-400">Não foi possível carregar a auditoria. ${esc(err.message || "")}</div>`;
      }
    }

    return {
      title: "Log de Auditoria",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Log de Auditoria</h2></div>
        <button data-action="export-audit" class="btn-outline px-4 py-2 text-sm flex items-center gap-2">${icon("download","w-4 h-4")} Exportar CSV</button>
      </div>
      <div class="card ring-1 ring-wine/10 mb-4 p-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        ${icon("shield","w-5 h-5 text-wine")} Registro das criações, edições, exclusões, promoções, desativações e redefinições de senha feitas por administradores. As senhas nunca são registradas.
      </div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="audit">
          ${FILTROS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}
        </div>
        <div class="search-box w-56"><span>${icon("search","w-4 h-4 text-slate-400")}</span>
          <input id="audit-busca" placeholder="Buscar na descrição..." maxlength="100" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
      </div>
      <div class="card" id="audit-list"><div class="p-10 text-center text-slate-400">Carregando…</div></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="audit-info"></span><div class="flex gap-1.5 items-center" id="audit-pager"></div>
      </div>`,
      init() {
        document.querySelectorAll('[data-filter-group="audit"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="audit"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.entidade = btn.dataset.filter; estado.page = 1; carregar();
        }));
        let t = 0;
        document.getElementById("audit-busca").addEventListener("input", (e) => {
          clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300);
        });
        // O botão "Exportar CSV" (ação global) lê o filtro atual daqui.
        PagesAdmin.__auditoriaFiltro = () => params();
        carregar();
      },
    };
  }

  // Exporta TODOS os registros do filtro atual (busca todas as páginas no servidor).
  async function exportarAuditoria() {
    try {
      const filtro = PagesAdmin.__auditoriaFiltro ? PagesAdmin.__auditoriaFiltro() : {};
      const todos = await Services.listAll(Services.auditoria.list, filtro);
      const cel = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const linhas = [["Quando", "Autor", "Ação", "Entidade", "ID", "Descrição"], ...todos.map((l) => [fmtQuando(l.criado_em), l.usuario_nome || "Sistema", l.acao, l.entidade, l.entidade_id ?? "", l.descricao])];
      // BOM para o Excel abrir os acentos corretamente
      App.downloadFile("auditoria-intranet-decos.csv", "﻿" + linhas.map((r) => r.map(cel).join(";")).join("\r\n"), "text/csv;charset=utf-8");
      App.toast(`${todos.length} registros exportados`);
    } catch (err) { App.toast(err.message || "Não foi possível exportar a auditoria."); }
  }

  Object.assign(PagesAdmin, { adminAuditoria, exportarAuditoria });
})();
