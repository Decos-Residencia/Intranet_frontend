/* =========================================================================
   Tela: Detalhe do Evento
   Rota: #/eventos/:id
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb } = UI;

  function eventoDetalhe(id) {
    const e = DB.eventos.find((x) => String(x.id) === String(id)) || DB.eventos[0];
    const inscrito = App.state.inscricoes.includes(e.id);
    const temVagas = /^\d+\/\d+$/.test(e.vagas || "");
    const [preenchidas, total] = temVagas ? e.vagas.split("/").map(Number) : [0, 0];
    const ocupadas = preenchidas + (inscrito ? 1 : 0);
    const livres = Math.max(0, total - ocupadas);
    const pct = total ? Math.round((ocupadas / total) * 100) : 0;
    const MESES = { SET: "Setembro", OUT: "Outubro", AGO: "Agosto" };
    let acaoInscricao;
    if (!App.can("interact")) acaoInscricao = `<button class="btn-outline w-full mt-4 py-3 opacity-60 cursor-not-allowed flex items-center justify-center gap-2">${icon("lock","w-4 h-4")} Inscrição indisponível (Leitura)</button>`;
    else if (inscrito) acaoInscricao = `<div class="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold flex items-center gap-2">${icon("check","w-4 h-4")} Você está inscrito</div>
        <button data-action="toggle-inscricao" data-id="${e.id}" class="btn-outline w-full mt-2 py-2.5">Cancelar inscrição</button>`;
    else if (temVagas && !livres) acaoInscricao = `<button class="btn-outline w-full mt-4 py-3 opacity-60 cursor-not-allowed">Vagas esgotadas</button>`;
    else acaoInscricao = `<button data-action="toggle-inscricao" data-id="${e.id}" class="btn-wine w-full mt-4 py-3">${temVagas ? "Inscrever-se no Treinamento" : "Confirmar presença"}</button>`;
    const outros = DB.eventos.filter((x) => x.id !== e.id).slice(0, 3).map((o) => `
      <a href="#/eventos/${o.id}" class="card block p-4"><div class="flex items-center justify-between mb-1"><span class="tag-outline">${o.tag}</span><span class="text-xs text-slate-400">${o.dia} ${o.mes} 2026</span></div>
      <div class="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1 truncate">${o.titulo}</div>
      <div class="text-xs text-slate-400 flex items-center gap-1">${icon("map-pin","w-3 h-3")} ${o.local}</div></a>`).join("");

    return {
      title: "Detalhes do Evento",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Eventos",route:"#/eventos"},{label:e.titulo.slice(0,18)}])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="card overflow-hidden">
            <div class="event-photo h-56"></div>
            <div class="p-6 flex gap-4">
              <div class="date-chip-lg"><span class="text-2xl font-extrabold leading-none">${e.dia}</span><span class="text-[11px] font-bold">${e.mes}</span></div>
              <div><div class="flex items-center gap-2 mb-1"><span class="tag-outline">${e.tag}</span><span class="text-sm text-slate-400">${MESES[e.mes] || e.mes} 2026</span>${inscrito ? badge("green","✓ INSCRITO") : ""}</div>
              <h1 class="text-xl font-extrabold text-slate-800 dark:text-slate-100">${e.titulo}</h1></div>
            </div>
          </div>
          <div class="card p-6">
            <h2 class="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Descrição do Treinamento</h2>
            <div class="prose-decos space-y-4">${(e.longa||[e.desc]).map((p)=>`<p>${p}</p>`).join("")}</div>
          </div>
          <div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">Outros Eventos e Cursos</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${outros}</div></div>
        </div>
        <aside class="card p-6">
          <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações Gerais</h3>
          <div class="space-y-4 text-sm">
            ${infoRow("calendar","DATA",`${e.dia} de ${MESES[e.mes] || e.mes} de 2026`)}
            ${infoRow("clock","HORÁRIO",e.horario.replace("-","às"))}
            ${infoRow("map-pin","LOCAL",e.local)}
            ${infoRow("shield","ORGANIZADOR",e.organizador)}
          </div>
          <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            ${temVagas ? `
            <div class="flex items-center justify-between text-xs mb-2"><span class="font-bold tracking-wider text-slate-400">VAGAS PREENCHIDAS</span><span class="font-bold text-slate-800 dark:text-slate-100">${ocupadas}/${total}</span></div>
            <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
            <div class="text-xs ${livres ? "text-green-600 dark:text-green-400" : "text-red-500"} mt-2 flex items-center gap-1">${icon(livres ? "check" : "x","w-3.5 h-3.5")} ${livres} vagas disponíveis para inscrição</div>`
            : `<div class="text-xs text-slate-500 dark:text-slate-400">Evento aberto, sem limite de vagas.</div>`}
            ${acaoInscricao}
            <button data-action="add-agenda" data-id="${e.id}" class="btn-outline w-full mt-2 py-2.5 flex items-center justify-center gap-2">${icon("calendar","w-4 h-4")} Adicionar à agenda</button>
          </div>
        </aside>
      </div>`,
    };
  }
  function infoRow(ic, label, value) {
    return `<div class="flex gap-3"><span class="text-wine mt-0.5">${icon(ic,"w-5 h-5")}</span>
      <div><div class="text-[10px] font-bold tracking-wider text-slate-400">${label}</div><div class="font-semibold text-slate-800 dark:text-slate-100">${value}</div></div></div>`;
  }

  Object.assign(Pages, { eventoDetalhe });
})();
