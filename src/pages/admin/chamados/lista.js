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
  // "há 5 min", "há 3 h", "há 2 dias": ajuda a ver de relance o que está esperando há mais tempo.
  function haQuanto(iso) {
    const min = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    return `há ${d} dia${d > 1 ? "s" : ""}`;
  }
  const avatar = (nome, cls) => `<span class="avatar-soft ${cls}">${UI.foto(nome)}${esc(UI.iniciais(nome))}</span>`;

  function linha(c) {
    const [ts, ns] = ROT_STATUS[c.status], [tp, np] = ROT_PRIO[c.prioridade];
    const quem = c.anonimo ? `<span class="text-slate-400 italic">Anônimo</span>`
      : !c.solicitante_nome ? "—"
      : `<div class="flex items-center gap-2.5">${avatar(c.solicitante_nome, "w-8 h-8 text-[11px] shrink-0")}<div class="min-w-0">
          <div class="font-semibold text-slate-700 dark:text-slate-200 truncate">${esc(c.solicitante_nome)}</div>
          <div class="text-xs text-slate-400 truncate">${esc(c.solicitante_setor || "Sem setor")}${c.solicitante_ramal ? ` · ramal ${esc(c.solicitante_ramal)}` : ""}</div></div></div>`;
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${c.id}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(c.protocolo)} <span class="font-normal text-slate-400">· ${esc(ROT_TIPO[c.tipo])}</span></div>
        <div class="text-xs text-slate-400 truncate max-w-sm">${esc(c.categoria)} · ${esc(c.local)}</div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${quem}</td>
      <td>${badge(tp, np)}</td><td>${badge(ts, ns)}</td>
      <td class="text-xs"><div class="text-slate-600 dark:text-slate-300">${esc(quando(c.criado_em))}</div><div class="text-slate-400">${haQuanto(c.criado_em)}</div></td>
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

    const sel = (id, rotulo, opcoes) => `<select id="${id}" class="select-field" aria-label="${rotulo.split(":")[0]}"><option value="">${rotulo}</option>${opcoes.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>`;
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
    const [ts, ns] = ROT_STATUS[c.status], [tp, np] = ROT_PRIO[c.prioridade];
    const contato = (rotulo, valor, href) => valor ? `<div class="ch-contato"><dt>${rotulo}</dt><dd>${href ? `<a href="${href}" class="text-wine dark:text-pink-300 underline">${esc(valor)}</a>` : esc(valor)}</dd></div>` : "";
    const solicitante = c.anonimo
      ? `<div class="ch-quem ch-quem-anonimo">${icon("lock", "w-5 h-5")}<div><div class="font-bold">Relato anônimo</div><div class="text-xs">O sistema não registrou quem enviou. A resposta fica só como registro interno.</div></div></div>`
      : `<div class="ch-quem">${avatar(c.solicitante_nome || "?", "w-11 h-11 text-sm shrink-0")}<div class="min-w-0 flex-1">
          <div class="font-bold text-slate-800 dark:text-slate-100">${esc(c.solicitante_nome || "—")}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${esc([c.solicitante_cargo, c.solicitante_setor].filter(Boolean).join(" · ") || "Sem setor")}</div>
          <dl class="mt-2 space-y-1">${contato("E-mail", c.solicitante_email, c.solicitante_email ? `mailto:${encodeURIComponent(c.solicitante_email)}?subject=${encodeURIComponent(`Chamado ${c.protocolo}`)}` : "")}${contato("Ramal", c.solicitante_ramal)}</dl></div></div>`;
    const marco = (rotulo, iso, extra = "") => iso ? `<li><span class="ch-marco-ponto" aria-hidden="true"></span><div><div class="font-semibold text-slate-700 dark:text-slate-200">${rotulo}${extra}</div><div class="text-xs text-slate-500 dark:text-slate-400">${esc(quando(iso))} · ${haQuanto(iso)}</div></div></li>` : "";
    App.openPanel(`${c.protocolo} · ${ROT_TIPO[c.tipo]}`, `<form data-form="chamado-admin" data-id="${c.id}" class="space-y-4">
      <div class="flex gap-2 flex-wrap">${badge(ts, ns)} ${badge(tp, `Prioridade ${np.toLowerCase()}`)}</div>
      <section aria-label="Quem abriu"><div class="field-label">QUEM ABRIU</div>${solicitante}</section>
      <div class="text-sm space-y-1 text-slate-600 dark:text-slate-300">
        <div><b>Categoria:</b> ${esc(c.categoria)}</div><div><b>Local:</b> ${esc(c.local)}</div></div>
      <section aria-label="Linha do tempo"><div class="field-label">LINHA DO TEMPO</div><ol class="ch-marcos">
        ${marco("Aberto", c.criado_em)}
        ${c.atualizado_em && c.atualizado_em !== c.criado_em ? marco("Última atualização", c.atualizado_em, c.responsavel_nome ? ` por ${esc(c.responsavel_nome)}` : "") : ""}
        ${marco("Concluído", c.concluido_em)}</ol></section>
      <div><label class="field-label">DESCRIÇÃO</label><div class="card p-3 text-sm whitespace-pre-line text-slate-700 dark:text-slate-200">${esc(c.descricao)}</div></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="field-label" for="ch-f-status">STATUS</label><select id="ch-f-status" name="status" class="field-input">${opts(ROT_STATUS, c.status)}</select></div>
        <div><label class="field-label" for="ch-f-prio">PRIORIDADE</label><select id="ch-f-prio" name="prioridade" class="field-input">${opts(ROT_PRIO, c.prioridade)}</select></div></div>
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
