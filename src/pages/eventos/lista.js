/* =========================================================================
   Tela: Eventos
   Rota: #/eventos
   ========================================================================= */
(function () {
  const { icon, badge } = UI;
  const { wireFilters, wireList } = Lib;

  function eventos() {
    const inscrito = (e) => App.state.inscricoes.includes(e.id);
    const lista = DB.eventos.map((e) => `
      <a href="#/eventos/${e.id}" class="card block p-5 flex gap-4 hover:shadow-md transition-shadow ev-item" data-tag="${e.tag}">
        <div class="date-chip-lg"><span class="text-2xl font-extrabold leading-none">${e.dia}</span><span class="text-[11px] font-bold">${e.mes}</span></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap"><span class="tag-outline">${e.tag}</span>${inscrito(e) ? badge("green","✓ INSCRITO") : ""}<h3 class="font-bold text-slate-800 dark:text-slate-100">${e.titulo}</h3></div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">${e.desc}</p>
          <div class="flex gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span class="flex items-center gap-1">${icon("clock","w-3.5 h-3.5")} ${e.horario}</span>
            <span class="flex items-center gap-1">${icon("map-pin","w-3.5 h-3.5")} ${e.local}</span>
          </div>
        </div>
      </a>`).join("");

    const dias = [31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27];
    const marcados = [8,12,18,22,25];
    const calendario = dias.map((d,i)=>{
      const on = marcados.includes(d);
      const muted = d===31;
      const ev = on && DB.eventos.find((e) => +e.dia === d);
      return ev ? `<a href="#/eventos/${ev.id}" class="cal-day cal-day-on" title="${ev.titulo}">${d}</a>`
        : `<div class="cal-day ${muted?"opacity-30":""}">${d}</div>`;
    }).join("");

    // Grade do mês completo: cada dia com evento mostra a etiqueta do evento
    // dentro da própria célula — visão de calendário de verdade, não só uma
    // lista com um mini-calendário decorativo do lado.
    const porDia = {};
    DB.eventos.forEach((e) => { (porDia[+e.dia] ||= []).push(e); });
    const semanaLbl = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    const mesCompleto = `
      <div class="card p-4 md:p-5">
        <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">${semanaLbl.map(d=>`<div>${d}</div>`).join("")}</div>
        <div class="month-grid">
          ${dias.map((d) => {
            const muted = d === 31;
            const evs = muted ? [] : (porDia[d] || []);
            return `<div class="month-cell ${muted?"is-muted":""} ${evs.length?"has-event":""}">
              <span class="month-cell-num">${d}</span>
              ${evs.slice(0,2).map((e)=>`<a href="#/eventos/${e.id}" class="month-cell-tag" title="${e.titulo}">${e.titulo.slice(0,14)}${e.titulo.length>14?"…":""}</a>`).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>`;

    return {
      title: "Eventos e Treinamentos",
      html: `
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1" data-filter-group="ev-view">
          <button class="chip chip-active" data-filter="lista">Visualização Lista</button>
          <button class="chip" data-filter="mes">Mês completo</button>
        </div>
        <select id="ev-cat" class="select-field"><option value="">Categoria: Todas</option>${[...new Set(DB.eventos.map((e) => e.tag))].map((t) => `<option>${t}</option>`).join("")}</select>
      </div>
      <div id="ev-lista-view" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-4" id="ev-lista">${lista}</div>
        <div class="card p-5">
          <h3 class="text-xs font-bold tracking-widest text-slate-400 mb-3">MINI CALENDÁRIO</h3>
          <div class="mb-3"><span class="font-bold text-slate-800 dark:text-slate-100">Setembro 2026</span></div>
          <div class="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 mb-1">${["S","T","Q","Q","S","S","D"].map(d=>`<div>${d}</div>`).join("")}</div>
          <div class="grid grid-cols-7 gap-1 text-center text-sm">${calendario}</div>
        </div>
      </div>
      <div id="ev-mes-view" class="hidden">${mesCompleto}</div>`,
      init() {
        wireList({
          containerId: "ev-lista", itemSel: ".ev-item", size: 99, label: "eventos", controls: ["#ev-cat"],
          onEmpty: "Nenhum evento nesta categoria.",
          filterFn: (el) => { const c = document.getElementById("ev-cat")?.value; return !c || el.dataset.tag === c; },
        });
        wireFilters("ev-view", (f) => {
          document.getElementById("ev-lista-view").classList.toggle("hidden", f !== "lista");
          document.getElementById("ev-mes-view").classList.toggle("hidden", f !== "mes");
        });
      },
    };
  }

  Object.assign(Pages, { eventos });
})();
