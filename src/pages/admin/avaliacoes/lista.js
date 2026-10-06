/* =========================================================================
   Tela: Avaliações de documentos (ADMIN)
   Rota: #/admin/avaliacoes
   Fonte: GET /avaliacoes-documentos (filtros e paginação no servidor) e /resumo.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const ROT = { PENDENTE: ["blue", "Pendente"], EM_ANALISE: ["amber", "Em análise"], APROVADO: ["green", "Aprovado"], REJEITADO: ["red", "Rejeitado"] };
  const STATUS = [["", "Todas"], ["PENDENTE", "Pendentes"], ["EM_ANALISE", "Em análise"], ["APROVADO", "Aprovadas"], ["REJEITADO", "Rejeitadas"]];
  const POR_PAGINA = 20;

  function linha(a) {
    const [tom, nome] = ROT[a.status];
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${a.id}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs">${esc(a.documento_titulo || "Documento removido")}</div>
        <div class="text-xs text-slate-400">${esc(a.documento_categoria || "")}${a.documento_ativo === false ? " · inativo" : ""}</div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${esc(a.avaliador_nome || "—")}<div class="text-xs text-slate-400">${esc(a.avaliador_setor || "")}</div></td>
      <td>${badge(tom, nome)}</td>
      <td class="text-xs text-slate-400">${esc(UI.fmtDataHora(a.data_solicitacao))}${a.data_avaliacao ? `<br>concluída ${esc(UI.fmtDataHora(a.data_avaliacao))}` : ""}</td>
      <td><div class="flex items-center gap-1.5 justify-end pr-4">
        <button class="act-btn" data-action="open-doc-url" data-id="${a.documento_id}" title="Abrir documento">${icon("eye", "w-4 h-4")}</button>
        <button class="act-btn" data-action="avaliacao-editar" data-id="${a.id}" title="Detalhes / reatribuir">${icon("edit", "w-4 h-4")}</button>
        <button class="act-btn act-btn-danger" data-action="avaliacao-excluir" data-id="${a.id}" data-alvo="${esc(a.documento_titulo || "esta avaliação")}" title="Excluir">${icon("trash", "w-4 h-4")}</button></div></td></tr>`;
  }

  function adminAvaliacoes() {
    const estado = { q: "", status: "", avaliador_id: "", documento_id: "", de: "", ate: "", page: 1 };
    const params = () => {
      const p = { page: estado.page, page_size: POR_PAGINA };
      ["q", "status", "avaliador_id", "documento_id"].forEach((k) => { if (estado[k]) p[k] = estado[k]; });
      if (estado.de) p.de = new Date(`${estado.de}T00:00:00`).toISOString();
      if (estado.ate) p.ate = new Date(new Date(`${estado.ate}T00:00:00`).getTime() + 86400000).toISOString();
      return p;
    };
    async function resumo() {
      const box = document.getElementById("av-stats");
      try {
        const r = await Services.avaliacoes.resumo();
        if (!document.getElementById("av-stats")) return;
        box.innerHTML = [
          AdminUI.statCard("PENDENTES", r.pendentes, "aguardando o avaliador", "help-circle"),
          AdminUI.statCard("EM ANÁLISE", r.em_analise, "em andamento", "edit"),
          AdminUI.statCard("APROVADAS", r.aprovadas, `${r.total} no total`, "check-check"),
          AdminUI.statCard("REJEITADAS", r.rejeitadas, "com observação", "alert-triangle"),
        ].join("");
      } catch (_) { if (box) box.innerHTML = ""; }
    }
    async function carregar() {
      const corpo = document.getElementById("av-rows"), info = document.getElementById("av-info"), pager = document.getElementById("av-pager");
      if (!corpo) return;
      try {
        const r = await Services.avaliacoes.list(params());
        if (!document.getElementById("av-rows")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.status || estado.avaliador_id || estado.documento_id || estado.de || estado.ate;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="5" class="py-10 text-center text-slate-400">${filtrado ? "Nenhuma avaliação encontrada para este filtro." : "Nenhuma avaliação designada ainda."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1 ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("av-rows")) corpo.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-400">Não foi possível carregar as avaliações. ${esc(err.message || "")}</td></tr>`;
      }
    }
    PagesAdmin.recarregarAvaliacoes = () => { resumo(); carregar(); };
    const docs = App.documentosAll().map((d) => `<option value="${d.id}">${esc(d.titulo)}</option>`).join("");
    const pessoas = App.state.api.usuariosRaw.map((u) => `<option value="${u.id}">${esc(u.nome)}</option>`).join("");
    return {
      title: "Avaliações de documentos",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Avaliações de Documentos</h2></div>
        <button class="btn-crimson px-5 py-2.5 flex items-center gap-2" data-action="avaliacao-nova">${icon("plus", "w-4 h-4")} Designar avaliação</button></div>
      <div id="av-stats" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6"></div>
      <div class="flex gap-2 flex-wrap mb-3" data-filter-group="av-adm">${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}</div>
      <div class="flex gap-2 items-center flex-wrap mb-4">
        <div class="search-box w-56"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
          <input id="av-busca" placeholder="Buscar documento ou avaliador..." maxlength="100" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
        <select id="av-doc" class="select-field"><option value="">Documento: todos</option>${docs}</select>
        <select id="av-pessoa" class="select-field"><option value="">Avaliador: todos</option>${pessoas}</select>
        <label class="text-xs text-slate-400 flex items-center gap-1">de <input id="av-de" type="date" class="field-input py-1.5"></label>
        <label class="text-xs text-slate-400 flex items-center gap-1">até <input id="av-ate" type="date" class="field-input py-1.5"></label></div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th class="py-3 pl-4">DOCUMENTO</th><th>AVALIADOR</th><th>STATUS</th><th>DATAS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="av-rows"><tr><td colspan="5" class="py-10 text-center text-slate-400">Carregando…</td></tr></tbody></table></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3"><span id="av-info"></span><div class="flex gap-1.5 items-center" id="av-pager"></div></div>`,
      init() {
        const filtro = (id, chave) => document.getElementById(id).addEventListener("change", (e) => { estado[chave] = e.target.value; estado.page = 1; carregar(); });
        document.querySelectorAll('[data-filter-group="av-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="av-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.status = btn.dataset.filter; estado.page = 1; carregar();
        }));
        filtro("av-doc", "documento_id"); filtro("av-pessoa", "avaliador_id"); filtro("av-de", "de"); filtro("av-ate", "ate");
        let t = 0;
        document.getElementById("av-busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300); });
        resumo(); carregar();
      },
    };
  }

  const fld = (label, html) => `<div><label class="field-label">${label}</label>${html}</div>`;
  const pessoasOpts = (sel) => App.state.api.usuariosRaw.map((u) => `<option value="${u.id}" ${u.id === sel ? "selected" : ""}>${esc(u.nome)}</option>`).join("");

  function novaAvaliacao() {
    const docs = App.documentosAll().filter((d) => d.ativo !== false);
    if (!docs.length) { App.toast("Não há documentos ativos para avaliar."); return; }
    App.openPanel("Designar avaliação", `<form data-form="avaliacao" data-id="" class="space-y-4">
      ${fld("DOCUMENTO", `<select name="documento_id" class="field-input">${docs.map((d) => `<option value="${d.id}">${esc(d.titulo)}</option>`).join("")}</select>`)}
      ${fld("AVALIADOR", `<select name="avaliador_id" class="field-input">${pessoasOpts()}</select>`)}
      ${fld("INSTRUÇÃO (OPCIONAL)", `<textarea name="observacao" class="field-input" rows="3" maxlength="5000" placeholder="O que precisa ser verificado?"></textarea>`)}
      <p class="text-xs text-slate-400">O avaliador precisa ter acesso ao documento (documentos de setor só podem ser avaliados por quem é do setor). Ele será notificado.</p>
      <button type="submit" class="btn-wine w-full py-3">Designar</button></form>`);
  }

  async function editarAvaliacao(id) {
    let a;
    try { a = await Services.avaliacoes.get(id); } catch (err) { App.toast(err.message || "Avaliação não encontrada."); return; }
    const so = (k, l) => `<option value="${k}" ${k === a.status ? "selected" : ""}>${l}</option>`;
    App.openPanel(`Avaliação: ${a.documento_titulo || "documento"}`, `<form data-form="avaliacao" data-id="${a.id}" class="space-y-4">
      <div class="text-sm text-slate-600 dark:text-slate-300"><b>Solicitada em:</b> ${esc(UI.fmtDataHora(a.data_solicitacao))}${a.data_avaliacao ? `<br><b>Concluída em:</b> ${esc(UI.fmtDataHora(a.data_avaliacao))}` : ""}</div>
      ${fld("AVALIADOR", `<select name="avaliador_id" class="field-input">${pessoasOpts(a.avaliador_id)}</select>`)}
      ${fld("STATUS", `<select name="status" class="field-input">${so("PENDENTE", "Pendente (reabrir)")}${so("EM_ANALISE", "Em análise")}${so("APROVADO", "Aprovado")}${so("REJEITADO", "Rejeitado")}</select>`)}
      ${fld("OBSERVAÇÃO", `<textarea name="observacao" class="field-input" rows="4" maxlength="5000">${esc(a.observacao || "")}</textarea>`)}
      <button type="submit" class="btn-wine w-full py-3">Salvar</button></form>`);
  }

  async function submitAvaliacao(f, v) {
    if (!f.dataset.id) {
      const corpo = { documento_id: Number(v.documento_id), avaliador_id: Number(v.avaliador_id) };
      if ((v.observacao || "").trim()) corpo.observacao = v.observacao.trim();
      await Services.avaliacoes.create(corpo);
      App.toast("Avaliação designada — o avaliador foi notificado");
    } else {
      const corpo = { avaliador_id: Number(v.avaliador_id), status: v.status };
      if ((v.observacao || "").trim()) corpo.observacao = v.observacao.trim();
      await Services.avaliacoes.update(f.dataset.id, corpo);
      App.toast("Avaliação atualizada");
    }
    if (PagesAdmin.recarregarAvaliacoes) PagesAdmin.recarregarAvaliacoes();
    return true;
  }

  Object.assign(PagesAdmin, { adminAvaliacoes, novaAvaliacao, editarAvaliacao, submitAvaliacao });
})();
