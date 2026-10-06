/* =========================================================================
   Tela: Solicitações cadastrais (somente ADMIN)
   Rota: #/admin/solicitacoes
   Fonte: GET /solicitacoes-cadastrais (filtro e paginação no servidor).
   Aprovar atualiza o cadastro do colaborador na mesma transação; rejeitar exige o motivo.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const FILTROS = [["PENDENTE", "Pendentes"], ["APROVADA", "Aprovadas"], ["REJEITADA", "Rejeitadas"], ["", "Todas"]];
  const POR_PAGINA = 20;
  const quando = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const fmtQuando = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : quando.format(d); };

  function cartao(s) {
    const info = App.solicitacaoCampoInfo(s.campo), st = App.solicitacaoStatus[s.status] || { label: s.status, tone: "gray" };
    const botoes = s.status === "PENDENTE"
      ? `<div class="flex gap-2 shrink-0">
          <button class="btn-wine text-sm px-4 py-2 flex items-center gap-1.5" data-action="approve-solicitacao" data-id="${s.id}" data-nome="${esc(s.usuario_nome)}" data-campo="${esc(s.campo)}">${icon("check", "w-4 h-4")} Aprovar</button>
          <button class="btn-outline text-sm px-4 py-2" data-action="reject-solicitacao" data-id="${s.id}" data-nome="${esc(s.usuario_nome)}" data-campo="${esc(s.campo)}">Rejeitar</button>
        </div>`
      : `<div class="text-xs text-slate-400 text-right shrink-0">Analisada em ${esc(fmtQuando(s.analisado_em))}<br>por ${esc(s.analisado_por_nome || "—")}</div>`;
    return `<div class="card p-5 flex items-start justify-between gap-4 flex-wrap sol-card" data-status="${esc(s.status)}">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="font-bold text-slate-800 dark:text-slate-100">${esc(s.usuario_nome)}</span>
          <span class="text-sm text-slate-500 dark:text-slate-400">quer alterar <b>${esc(info.label)}</b></span>
          ${badge(st.tone, st.label)}
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-300">${esc(App.solicitacaoValor(s.campo, s.valor_atual))} <span class="text-wine font-bold">→</span> <b>${esc(App.solicitacaoValor(s.campo, s.valor_solicitado))}</b></div>
        ${s.justificativa ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Justificativa: ${esc(s.justificativa)}</div>` : ""}
        ${s.observacao_admin ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Observação do RH: ${esc(s.observacao_admin)}</div>` : ""}
        <div class="text-xs text-slate-400 mt-1">Pedido em ${esc(fmtQuando(s.criado_em))}</div>
      </div>
      ${botoes}
    </div>`;
  }

  function adminSolicitacoes() {
    const estado = { status: "PENDENTE", page: 1 };

    async function carregar() {
      const lista = document.getElementById("sol-list"), info = document.getElementById("sol-info"), pager = document.getElementById("sol-pager");
      if (!lista) return;
      lista.innerHTML = `<div class="card p-10 text-center text-slate-400">Carregando…</div>`;
      try {
        const r = await Services.cadastro.list({ ...(estado.status ? { status: estado.status } : {}), page: estado.page, page_size: POR_PAGINA });
        if (!document.getElementById("sol-list")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        lista.innerHTML = r.items.length ? `<div class="space-y-3">${r.items.map(cartao).join("")}</div>`
          : `<div class="card p-10 text-center text-slate-400">${estado.status === "PENDENTE" ? "Nenhuma solicitação aguardando análise." : "Nenhuma solicitação neste filtro."}</div>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1
          ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("sol-list")) lista.innerHTML = `<div class="card p-10 text-center text-slate-400">Não foi possível carregar as solicitações. ${esc(err.message || "")}</div>`;
      }
    }

    return {
      title: "Solicitações Cadastrais",
      html: `
      <div class="mb-6">
        <div class="text-sm text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Solicitações Cadastrais</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Pedidos dos colaboradores para alterar um campo do próprio cadastro. Aprovar aplica a mudança; o colaborador é notificado.</p>
      </div>
      <div class="flex gap-2 flex-wrap mb-4" data-filter-group="sol">
        ${FILTROS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}
      </div>
      <div id="sol-list"></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="sol-info"></span><div class="flex gap-1.5 items-center" id="sol-pager"></div>
      </div>`,
      init() {
        document.querySelectorAll('[data-filter-group="sol"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="sol"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.status = btn.dataset.filter; estado.page = 1; carregar();
        }));
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminSolicitacoes });
})();
