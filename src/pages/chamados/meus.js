/* =========================================================================
   Tela: Meus chamados (quem pode interagir)
   Rota: #/chamados
   Fonte: GET /chamados/meus — só os identificados. Relatos anônimos nunca guardam quem
   enviou, então não aparecem aqui (nem para a própria pessoa).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const STATUS = { ABERTO: ["blue", "Aberto"], EM_ANALISE: ["amber", "Em análise"], CONCLUIDO: ["green", "Concluído"] };
  const TIPO = { TI: "Chamado de TI", EVENTO_ADVERSO: "Evento adverso", GERAL: "Chamado geral" };
  const PRIO = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };
  const FILTROS = [["", "Todos"], ["ABERTO", "Abertos"], ["EM_ANALISE", "Em análise"], ["CONCLUIDO", "Concluídos"]];

  function item(c) {
    const [tom, rotulo] = STATUS[c.status] || ["gray", c.status];
    return `<li class="card p-5 ch-item" data-status="${c.status}">
      <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div class="min-w-0">
          <div class="text-xs font-bold text-slate-500 dark:text-slate-400">${esc(TIPO[c.tipo] || c.tipo)} · ${esc(c.protocolo)}</div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">${esc(c.categoria)}</h3>
        </div>
        ${badge(tom, rotulo)}
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">${esc(c.descricao)}</p>
      <dl class="flex gap-x-5 gap-y-1 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-3">
        <div><dt class="inline font-bold">Local:</dt> <dd class="inline">${esc(c.local)}</dd></div>
        <div><dt class="inline font-bold">Prioridade:</dt> <dd class="inline">${esc(PRIO[c.prioridade] || c.prioridade)}</dd></div>
        <div><dt class="inline font-bold">Aberto em:</dt> <dd class="inline">${esc(UI.fmtDataHora(c.criado_em))}</dd></div>
        ${c.concluido_em ? `<div><dt class="inline font-bold">Concluído em:</dt> <dd class="inline">${esc(UI.fmtDataHora(c.concluido_em))}</dd></div>` : ""}
      </dl>
      ${c.resposta_admin ? `<div class="ch-resposta mt-3"><div class="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1">${icon("check-check", "w-4 h-4 inline")} Resposta da equipe</div>
        <p class="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">${esc(c.resposta_admin)}</p></div>` : ""}
    </li>`;
  }

  function meusChamados() {
    return {
      title: "Meus chamados",
      html: `
      <div class="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Atendimento</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Meus chamados</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Acompanhe os chamados que você abriu. Relatos enviados como anônimos não aparecem aqui, para preservar o anonimato.</p></div>
        <button type="button" data-action="open-chamado" data-tipo="geral" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Abrir chamado</button>
      </div>
      <div class="flex gap-2 flex-wrap mb-4" role="group" aria-label="Filtrar por status" data-filter-group="meus-ch">
        ${FILTROS.map(([v, l], i) => `<button type="button" class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${v}" aria-pressed="${i === 0}">${l}</button>`).join("")}
      </div>
      <ul id="ch-lista" class="space-y-3" aria-live="polite"><li class="text-sm text-slate-500 dark:text-slate-400 py-6">Carregando…</li></ul>`,
      async init() {
        const lista = document.getElementById("ch-lista");
        let itens = [];
        try {
          itens = await Services.listAll(Services.chamados.meus);
          App.state.api.chamados = itens;
        } catch (err) {
          if (lista && document.contains(lista)) lista.innerHTML = `<li class="card p-6 text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar seus chamados. ${esc(err.message || "")}</li>`;
          return;
        }
        if (!document.contains(lista)) return;
        const pinta = (status) => {
          const vis = status ? itens.filter((c) => c.status === status) : itens;
          lista.innerHTML = vis.length ? vis.map(item).join("")
            : `<li class="card p-8 text-center"><div class="font-bold text-slate-800 dark:text-slate-100 mb-1">${itens.length ? "Nenhum chamado com este status." : "Você ainda não abriu chamados."}</div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Precisa de ajuda da TI ou quer relatar algo? Use "Abrir chamado".</p></li>`;
        };
        pinta("");
        Lib.wireFilters("meus-ch", (f) => {
          document.querySelectorAll('[data-filter-group="meus-ch"] [data-filter]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
          pinta(f);
        });
      },
    };
  }

  Object.assign(Pages, { meusChamados });
})();
