/* =========================================================================
   Tela: Chamados (ADMIN)
   Rota: #/admin/chamados
   Fonte: GET /chamados (filtros, busca e paginação no servidor) e GET /chamados/resumo.
   Relatos anônimos aparecem sem solicitante: o servidor não grava quem enviou.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const STATUS = [["", "Todos"], ["ABERTO", "Abertos"], ["EM_ANALISE", "Em análise"], ["CONCLUIDO", "Concluídos"]];
  const ROT_STATUS = { ABERTO: ["blue", "Aberto"], EM_ANALISE: ["amber", "Em análise"], CONCLUIDO: ["green", "Concluído"] };
  const ROT_PRIO = { BAIXA: ["gray", "Baixa"], MEDIA: ["amber", "Média"], ALTA: ["red", "Alta"] };
  const ROT_TIPO = { TI: "TI", EVENTO_ADVERSO: "Evento adverso", GERAL: "Geral" };
  const POR_PAGINA = 20;

  const quando = (iso) => UI.fmtDataHora(iso);

  function linha(c) {
    const [ts, ns] = ROT_STATUS[c.status], [tp, np] = ROT_PRIO[c.prioridade];
    const quem = c.anonimo ? `<span class="text-slate-400 italic">Anônimo</span>` : esc(c.solicitante_nome || "—");
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${c.id}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(c.protocolo)} <span class="font-normal text-slate-400">· ${esc(ROT_TIPO[c.tipo])}</span></div>
        <div class="text-xs text-slate-400 truncate max-w-sm">${esc(c.categoria)} · ${esc(c.local)}</div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${quem}</td>
      <td>${badge(tp, np)}</td><td>${badge(ts, ns)}</td>
      <td class="text-xs text-slate-400">${esc(quando(c.criado_em))}</td>
      <td class="text-right pr-4"><button class="btn-outline text-xs px-3 py-1.5" data-action="chamado-abrir" data-id="${c.id}">Abrir</button></td></tr>`;
  }

  function adminChamados() {
    const estado = { q: "", tipo: "", prioridade: "", status: "", page: 1 };

    async function resumo() {
      const box = document.getElementById("ch-stats");
      try {
        const r = await Services.chamados.resumo();
        if (!document.getElementById("ch-stats")) return;
        box.innerHTML = [
          AdminUI.statCard("ABERTOS", r.abertos, "aguardando atendimento", "help-circle"),
          AdminUI.statCard("EM ANÁLISE", r.em_analise, "sendo tratados", "edit"),
          AdminUI.statCard("ALTA PRIORIDADE", r.alta_prioridade_pendentes, "pendentes", "alert-triangle", r.alta_prioridade_pendentes > 0),
          AdminUI.statCard("CONCLUÍDOS", r.concluidos, `${r.total} no total`, "check-check"),
        ].join("");
      } catch (_) { if (box) box.innerHTML = ""; }
    }

    async function carregar() {
      const corpo = document.getElementById("ch-rows"), info = document.getElementById("ch-info"), pager = document.getElementById("ch-pager");
      if (!corpo) return;
      try {
        const r = await Services.chamados.list({ page: estado.page, page_size: POR_PAGINA, q: estado.q, tipo: estado.tipo, prioridade: estado.prioridade, status: estado.status });
        if (!document.getElementById("ch-rows")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.tipo || estado.prioridade || estado.status;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="6" class="py-10 text-center text-slate-400">${filtrado ? "Nenhum chamado encontrado para este filtro." : "Nenhum chamado aberto ainda."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1 ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("ch-rows")) corpo.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400">Não foi possível carregar os chamados. ${esc(err.message || "")}</td></tr>`;
      }
    }
    PagesAdmin.recarregarChamados = () => { resumo(); carregar(); };

    const sel = (id, rotulo, opcoes) => `<select id="${id}" class="select-field"><option value="">${rotulo}</option>${opcoes.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>`;
    return {
      title: "Chamados",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Chamados & Relatos</h2></div>
      <div id="ch-stats" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6"></div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="ch-adm">${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}</div>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-56"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
            <input id="ch-busca" placeholder="Buscar protocolo, local..." maxlength="100" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          ${sel("ch-tipo", "Tipo: todos", Object.entries(ROT_TIPO))}
          ${sel("ch-prio", "Prioridade: todas", Object.entries(ROT_PRIO).map(([k, v]) => [k, v[1]]))}
        </div>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th class="py-3 pl-4">CHAMADO</th><th>SOLICITANTE</th><th>PRIORIDADE</th><th>STATUS</th><th>ABERTO EM</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="ch-rows"><tr><td colspan="6" class="py-10 text-center text-slate-400">Carregando…</td></tr></tbody></table></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3"><span id="ch-info"></span><div class="flex gap-1.5 items-center" id="ch-pager"></div></div>`,
      init() {
        document.querySelectorAll('[data-filter-group="ch-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="ch-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.status = btn.dataset.filter; estado.page = 1; carregar();
        }));
        document.getElementById("ch-tipo").addEventListener("change", (e) => { estado.tipo = e.target.value; estado.page = 1; carregar(); });
        document.getElementById("ch-prio").addEventListener("change", (e) => { estado.prioridade = e.target.value; estado.page = 1; carregar(); });
        let t = 0;
        document.getElementById("ch-busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300); });
        resumo(); carregar();
      },
    };
  }

  // Painel com o chamado completo e o formulário de atendimento.
  async function abrirChamado(id) {
    let c;
    try { c = await Services.chamados.get(id); } catch (err) { App.toast(err.message || "Não foi possível abrir o chamado."); return; }
    const opts = (obj, atual) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === atual ? "selected" : ""}>${Array.isArray(v) ? v[1] : v}</option>`).join("");
    const quem = c.anonimo ? "Anônimo (o servidor não registrou quem enviou)" : esc(c.solicitante_nome || "—");
    App.openPanel(`${c.protocolo} · ${ROT_TIPO[c.tipo]}`, `<form data-form="chamado-admin" data-id="${c.id}" class="space-y-4">
      <div class="text-sm space-y-1 text-slate-600 dark:text-slate-300">
        <div><b>Solicitante:</b> ${quem}</div><div><b>Categoria:</b> ${esc(c.categoria)}</div>
        <div><b>Local:</b> ${esc(c.local)}</div><div><b>Aberto em:</b> ${esc(quando(c.criado_em))}</div>
        ${c.responsavel_nome ? `<div><b>Atendido por:</b> ${esc(c.responsavel_nome)}</div>` : ""}</div>
      <div><label class="field-label">DESCRIÇÃO</label><div class="card p-3 text-sm whitespace-pre-line text-slate-700 dark:text-slate-200">${esc(c.descricao)}</div></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="field-label">STATUS</label><select name="status" class="field-input">${opts(ROT_STATUS, c.status)}</select></div>
        <div><label class="field-label">PRIORIDADE</label><select name="prioridade" class="field-input">${opts(ROT_PRIO, c.prioridade)}</select></div></div>
      <div><label class="field-label">RESPOSTA ${c.anonimo ? "(interna: o relato é anônimo)" : "AO SOLICITANTE"}</label>
        <textarea name="resposta_admin" class="field-input" rows="4" maxlength="5000" placeholder="Opcional">${esc(c.resposta_admin || "")}</textarea></div>
      <button type="submit" class="btn-wine w-full py-3">Salvar atendimento</button></form>`);
  }

  async function submitChamadoAdmin(f, v) {
    const corpo = { status: v.status, prioridade: v.prioridade };
    if ((v.resposta_admin || "").trim()) corpo.resposta_admin = v.resposta_admin.trim();
    await Services.chamados.update(f.dataset.id, corpo);
    App.toast("Chamado atualizado");
    if (PagesAdmin.recarregarChamados) PagesAdmin.recarregarChamados();
    return true;
  }

  Object.assign(PagesAdmin, { adminChamados, abrirChamado, submitChamadoAdmin });
})();
