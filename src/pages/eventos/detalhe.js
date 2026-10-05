/* =========================================================================
   Tela: Detalhe do Evento
   Rota: #/eventos/:id
   Fonte: GET /eventos/{id}. Vagas, inscritos e "inscrito" são do servidor; inscrever/cancelar são reais.
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc } = UI;

  const infoRow = (ic, label, value) => `<div class="flex gap-3"><span class="text-wine mt-0.5">${icon(ic, "w-5 h-5")}</span>
    <div><div class="text-[10px] font-bold tracking-wider text-slate-400">${label}</div><div class="font-semibold text-slate-800 dark:text-slate-100">${esc(value)}</div></div></div>`;

  function acao(e) {
    if (e.cancelado) return `<div class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-bold">Evento cancelado</div>`;
    if (e.inscrito && !e.encerrado && e.ini > new Date()) return `<div class="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2">${icon("check", "w-4 h-4")} Você está inscrito</div>
      <button data-action="cancelar-inscricao" data-id="${e.id}" class="btn-outline w-full mt-2 py-2.5">Cancelar inscrição</button>`;
    if (e.inscrito) return `<div class="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2">${icon("check", "w-4 h-4")} Você estava inscrito</div>`;
    if (e.encerrado || e.ini <= new Date()) return `<button class="btn-outline w-full mt-4 py-3 opacity-60 cursor-not-allowed" disabled>Inscrições encerradas</button>`;
    if (!App.can("interact")) return `<button class="btn-outline w-full mt-4 py-3 opacity-60 cursor-not-allowed flex items-center justify-center gap-2" disabled>${icon("lock", "w-4 h-4")} Inscrição indisponível</button>`;
    if (!e.aberto) return `<button class="btn-outline w-full mt-4 py-3 opacity-60 cursor-not-allowed" disabled>Vagas esgotadas</button>`;
    return `<button data-action="inscrever-evento" data-id="${e.id}" class="btn-wine w-full mt-4 py-3">${e.vagas ? "Inscrever-se" : "Confirmar presença"}</button>`;
  }

  function corpo(e, outros) {
    const pct = e.vagas ? Math.round((e.inscritos / e.vagas) * 100) : 0;
    const vagas = e.vagas
      ? `<div class="flex items-center justify-between text-xs mb-2"><span class="font-bold tracking-wider text-slate-400">VAGAS PREENCHIDAS</span><span class="font-bold text-slate-800 dark:text-slate-100">${e.inscritos}/${e.vagas}</span></div>
         <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
         <div class="text-xs ${e.livres ? "text-green-600 dark:text-green-400" : "text-red-500"} mt-2 flex items-center gap-1">${icon(e.livres ? "check" : "x", "w-3.5 h-3.5")} ${e.livres} ${e.livres === 1 ? "vaga disponível" : "vagas disponíveis"}</div>`
      : `<div class="text-xs text-slate-500 dark:text-slate-400">Evento aberto, sem limite de vagas${e.inscritos ? ` · ${e.inscritos} ${e.inscritos === 1 ? "inscrito" : "inscritos"}` : ""}.</div>`;
    const lista = outros.map((o) => `<a href="#/eventos/${o.id}" class="card block p-4"><div class="flex items-center justify-between mb-1"><span class="tag-outline">${esc(o.tag)}</span><span class="text-xs text-slate-400">${o.data}</span></div>
      <div class="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1 truncate">${esc(o.titulo)}</div>
      <div class="text-xs text-slate-400 flex items-center gap-1">${icon("map-pin", "w-3 h-3")} ${esc(o.local)}</div></a>`).join("");
    return `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Eventos", route: "#/eventos" }, { label: esc(e.titulo.slice(0, 18)) }])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="card overflow-hidden">
            <div class="event-photo h-56"></div>
            <div class="p-6 flex gap-4">
              <div class="date-chip-lg"><span class="text-2xl font-extrabold leading-none">${e.dia}</span><span class="text-[11px] font-bold">${e.mes}</span></div>
              <div><div class="flex items-center gap-2 mb-1 flex-wrap"><span class="tag-outline">${esc(e.tag)}</span><span class="text-sm text-slate-400">${esc(e.dataLonga)}</span>
                ${e.inscrito ? badge("green", "✓ INSCRITO") : ""}${e.cancelado ? badge("red", "CANCELADO") : e.encerrado ? badge("gray", "ENCERRADO") : ""}</div>
              <h1 class="text-xl font-extrabold text-slate-800 dark:text-slate-100">${esc(e.titulo)}</h1></div>
            </div>
          </div>
          <div class="card p-6">
            <h2 class="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Descrição</h2>
            <div class="prose-decos space-y-4">${(e.longa.length ? e.longa : [e.desc]).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
          </div>
          ${outros.length ? `<div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">Outros Eventos</h3><div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${lista}</div></div>` : ""}
        </div>
        <aside class="card p-6">
          <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações Gerais</h3>
          <div class="space-y-4 text-sm">
            ${infoRow("calendar", "DATA", e.dataLonga)}${infoRow("clock", "HORÁRIO", e.horario)}${infoRow("map-pin", "LOCAL", e.local)}${infoRow("shield", "ORGANIZADOR", e.organizador)}
          </div>
          <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            ${vagas}${acao(e)}
            <button data-action="add-agenda" data-id="${e.id}" class="btn-outline w-full mt-2 py-2.5 flex items-center justify-center gap-2">${icon("calendar", "w-4 h-4")} Adicionar à agenda</button>
          </div>
        </aside>
      </div>`;
  }

  function eventoDetalhe(id) {
    return {
      title: "Detalhes do Evento",
      html: `<div id="ev-detalhe"><div class="min-h-[40vh] flex items-center justify-center text-slate-400">Carregando evento…</div></div>`,
      async init() {
        const alvo = () => document.getElementById("ev-detalhe");
        try {
          const e = App.eventoView(await Services.eventos.get(id));
          let outros = [];
          try {
            const r = await Services.eventos.list({ de: new Date().toISOString(), status: "PUBLICADO", page_size: 4 });
            outros = r.items.filter((x) => x.id !== e.id).slice(0, 3).map(App.eventoView);
          } catch (_) { /* a lista de outros eventos é opcional */ }
          if (alvo()) alvo().innerHTML = corpo(e, outros);
        } catch (err) {
          if (alvo()) alvo().innerHTML = `<div class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8"><div class="text-5xl mb-3">🗂️</div>
            <h2 class="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">Evento não encontrado</h2><p class="text-slate-500 dark:text-slate-400 mb-6">${esc(err.status === 404 ? "Este evento não existe ou ainda não foi publicado." : err.message || "")}</p><a href="#/eventos" class="btn-wine px-6 py-2.5">Voltar aos eventos</a></div>`;
        }
      },
    };
  }

  Object.assign(Pages, { eventoDetalhe });
})();
