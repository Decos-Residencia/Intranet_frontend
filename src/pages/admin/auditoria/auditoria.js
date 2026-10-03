/* =========================================================================
   Tela: Auditoria (RH: próprias · Admin: todas)
   Rota: #/admin/auditoria
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const { wireList } = Lib;

  function adminAuditoria() {
    const soMinhas = !App.can("audit_all");
    const seed = DB.auditoria.concat();
    const proprios = App.state.auditLog || [];
    let logs = [...proprios, ...seed];
    if (soMinhas) logs = logs.filter((l) => l.autor === App.state.user?.nome);

    const tipoIcon = { noticia: "megaphone", documento: "file-text", usuario: "user-cog", setor: "users" };
    const roleTag = (r) => badge(r === "admin" ? "red" : "amber", (DB.roles[r]?.curto) || String(r || "").toUpperCase());
    ultimosLogs = logs;
    const rows = logs.map((l) => `
      <div class="audit-row flex gap-3 p-4 border-b border-slate-50 dark:border-slate-800 last:border-0" data-tipo="${l.tipo}">
        <span class="notif-icon">${icon(tipoIcon[l.tipo] || "file-text","w-5 h-5")}</span>
        <div class="flex-1"><div class="text-sm text-slate-700 dark:text-slate-200">
          <b class="text-slate-900 dark:text-white">${esc(l.autor)}</b> ${esc(l.acao)} <span class="text-wine font-semibold">${esc(l.alvo)}</span></div>
          <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">${l.quando} ${roleTag(l.autorRole)}</div></div>
      </div>`).join("");

    return {
      title: soMinhas ? "Minha Auditoria" : "Log de Auditoria",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • ${soMinhas ? "Editor-Gestor" : "Administração"}</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${soMinhas ? "Minhas Ações (Auditoria)" : "Log de Auditoria Global"}</h2></div>
        <button data-action="export-audit" class="btn-outline px-4 py-2 text-sm flex items-center gap-2">${icon("download","w-4 h-4")} Exportar CSV</button>
      </div>
      <div class="card ring-1 ring-wine/10 mb-4 p-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        ${icon("shield","w-5 h-5 text-wine")} ${soMinhas
          ? "Você vê apenas as ações que <b>você</b> realizou. Administradores visualizam o log completo do sistema."
          : "Registro completo de criações, edições e exclusões de todos os editores e administradores."}
      </div>
      <div class="flex gap-2 flex-wrap mb-4" data-filter-group="audit">
        ${[["all","Todas"],["noticia","Notícias"],["documento","Documentos"],["usuario","Usuários"],["setor","Setores"]].map(([k,l],i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${k}">${l}</button>`).join("")}
      </div>
      <div class="card" id="audit-list">${rows || `<div class="p-10 text-center text-slate-400">Nenhuma ação registrada ainda.</div>`}</div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="audit-info"></span><div class="flex gap-1.5" id="audit-pager"></div>
      </div>`,
      init() {
        wireList({ containerId: "audit-list", itemSel: ".audit-row", size: 10, pagerId: "audit-pager", infoId: "audit-info", label: "registros",
          filterGroup: "audit", onEmpty: "Nenhuma ação deste tipo.", filterFn: (el, f) => f === "all" || el.dataset.tipo === f });
      },
    };
  }

  let ultimosLogs = [];
  function exportarAuditoria() {
    const cel = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = [["Quando", "Autor", "Papel", "Ação", "Alvo", "Tipo"], ...ultimosLogs.map((l) => [l.quando, l.autor, DB.roles[l.autorRole]?.label || l.autorRole, l.acao, l.alvo, l.tipo])];
    // BOM para o Excel abrir os acentos corretamente
    App.downloadFile("auditoria-intranet-decos.csv", "\ufeff" + linhas.map((r) => r.map(cel).join(";")).join("\r\n"), "text/csv;charset=utf-8");
    App.toast(`${ultimosLogs.length} registros exportados`);
  }

  Object.assign(PagesAdmin, { adminAuditoria, exportarAuditoria });
})();
