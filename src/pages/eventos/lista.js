/* =========================================================================
   Tela: Eventos
   Rota: #/eventos
   Fonte: GET /eventos?de=&ate= (mês exibido). Calendário e lista usam datas reais, no fuso do navegador.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  // Mês exibido (persiste enquanto a página está aberta; começa no mês atual).
  const hoje = new Date();
  let ref = { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  let carregamento = 0;

  const inicioDoMes = (r) => new Date(r.ano, r.mes, 1);
  const fimDoMes = (r) => new Date(r.ano, r.mes + 1, 1);
  const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function cartao(e) {
    return `<a href="#/eventos/${e.id}" class="card block p-5 flex gap-4 hover:shadow-md transition-shadow ev-item ${e.cancelado ? "opacity-70" : ""}" data-tag="${esc(e.tag)}">
      <div class="date-chip-lg"><span class="text-2xl font-extrabold leading-none">${e.dia}</span><span class="text-[11px] font-bold">${e.mes}</span></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap"><span class="tag-outline">${esc(e.tag)}</span>
          ${e.inscrito ? badge("green", "✓ INSCRITO") : ""}${e.cancelado ? badge("red", "CANCELADO") : e.encerrado ? badge("gray", "ENCERRADO") : ""}
          <h3 class="font-bold text-slate-800 dark:text-slate-100">${esc(e.titulo)}</h3></div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(e.desc)}</p>
        <div class="flex gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span class="flex items-center gap-1">${icon("clock", "w-3.5 h-3.5")} ${esc(e.horario)}</span>
          <span class="flex items-center gap-1">${icon("map-pin", "w-3.5 h-3.5")} ${esc(e.local)}</span>
        </div>
      </div>
    </a>`;
  }

  // Grade do mês (semana começando na segunda) com os eventos reais de cada dia.
  function grade(eventos) {
    const primeiro = inicioDoMes(ref), dias = new Date(ref.ano, ref.mes + 1, 0).getDate();
    const vazios = (primeiro.getDay() + 6) % 7;
    const porDia = {};
    eventos.forEach((e) => { for (let d = new Date(Math.max(e.ini, primeiro)); d < fimDoMes(ref) && d <= e.fim; d.setDate(d.getDate() + 1)) (porDia[d.getDate()] ||= []).push(e); });
    const celulas = [...Array(vazios).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
    return { porDia, celulas };
  }

  function montar(eventos) {
    const { porDia, celulas } = grade(eventos);
    const semana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const isHoje = (d) => d && mesmoDia(new Date(ref.ano, ref.mes, d), new Date());
    const mini = celulas.map((d) => (d === null ? `<div></div>`
      : porDia[d] ? `<a href="#/eventos/${porDia[d][0].id}" class="cal-day cal-day-on" title="${esc(porDia[d][0].titulo)}">${d}</a>`
      : `<div class="cal-day ${isHoje(d) ? "font-extrabold text-wine" : ""}">${d}</div>`)).join("");
    const mes = `<div class="card p-4 md:p-5">
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">${semana.map((d) => `<div>${d}</div>`).join("")}</div>
      <div class="month-grid">${celulas.map((d) => d === null ? `<div class="month-cell is-muted"></div>`
        : `<div class="month-cell ${porDia[d] ? "has-event" : ""}"><span class="month-cell-num ${isHoje(d) ? "text-wine font-extrabold" : ""}">${d}</span>
          ${(porDia[d] || []).slice(0, 2).map((e) => `<a href="#/eventos/${e.id}" class="month-cell-tag" title="${esc(e.titulo)}">${esc(e.titulo.slice(0, 14))}${e.titulo.length > 14 ? "…" : ""}</a>`).join("")}</div>`).join("")}</div></div>`;
    return { mini, mes };
  }

  function eventos() {
    const rotulo = UI.fmtMesAno(inicioDoMes(ref));
    return {
      title: "Eventos e Treinamentos",
      html: `
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1" data-filter-group="ev-view">
          <button class="chip chip-active" data-filter="lista">Visualização Lista</button>
          <button class="chip" data-filter="mes">Mês completo</button>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn-outline px-3 py-2" id="ev-prev" title="Mês anterior">${icon("chevron-left", "w-4 h-4")}</button>
          <span class="font-bold text-slate-800 dark:text-slate-100 w-40 text-center" id="ev-mes-label">${esc(rotulo)}</span>
          <button class="btn-outline px-3 py-2" id="ev-next" title="Próximo mês">${icon("chevron-right", "w-4 h-4")}</button>
          <button class="btn-outline px-3 py-2 text-xs" id="ev-hoje">Hoje</button>
          <select id="ev-cat" class="select-field"><option value="">Categoria: Todas</option></select>
        </div>
      </div>
      <div id="ev-lista-view" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-4" id="ev-lista"><div class="card p-10 text-center text-slate-400">Carregando…</div></div>
        <div class="card p-5">
          <h3 class="text-xs font-bold tracking-widest text-slate-400 mb-3">MINI CALENDÁRIO</h3>
          <div class="mb-3"><span class="font-bold text-slate-800 dark:text-slate-100" id="ev-mini-mes">${esc(rotulo)}</span></div>
          <div class="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 mb-1">${["S", "T", "Q", "Q", "S", "S", "D"].map((d) => `<div>${d}</div>`).join("")}</div>
          <div class="grid grid-cols-7 gap-1 text-center text-sm" id="ev-mini"></div>
        </div>
      </div>
      <div id="ev-mes-view" class="hidden"></div>`,
      init() {
        let dados = [];
        const filtrar = () => {
          const c = document.getElementById("ev-cat")?.value || "";
          const vis = dados.filter((e) => !c || e.tag === c);
          const lista = document.getElementById("ev-lista");
          if (!lista) return;
          lista.innerHTML = vis.length ? vis.map(cartao).join("") : `<div class="card p-10 text-center text-slate-400">${dados.length ? "Nenhum evento nesta categoria." : "Nenhum evento neste mês."}</div>`;
          const g = montar(vis);
          document.getElementById("ev-mini").innerHTML = g.mini;
          document.getElementById("ev-mes-view").innerHTML = g.mes;
        };
        const carregar = async () => {
          const eu = ++carregamento;
          const rot = UI.fmtMesAno(inicioDoMes(ref));
          document.getElementById("ev-mes-label").textContent = rot; document.getElementById("ev-mini-mes").textContent = rot;
          try {
            const r = await Services.eventos.list({ de: inicioDoMes(ref).toISOString(), ate: fimDoMes(ref).toISOString(), page_size: 100 });
            if (eu !== carregamento || !document.getElementById("ev-lista")) return;
            dados = r.items.map(App.eventoView);
            const cats = [...new Set(dados.map((e) => e.tag))].sort();
            const sel = document.getElementById("ev-cat"), atual = sel.value;
            sel.innerHTML = `<option value="">Categoria: Todas</option>${cats.map((t) => `<option ${t === atual ? "selected" : ""}>${esc(t)}</option>`).join("")}`;
            filtrar();
          } catch (err) {
            const l = document.getElementById("ev-lista");
            if (l) l.innerHTML = `<div class="card p-10 text-center text-slate-400">Não foi possível carregar os eventos. ${esc(err.message || "")}</div>`;
          }
        };
        const mover = (d) => { ref = { ano: ref.ano, mes: ref.mes + d }; const n = new Date(ref.ano, ref.mes, 1); ref = { ano: n.getFullYear(), mes: n.getMonth() }; carregar(); };
        document.getElementById("ev-prev").addEventListener("click", () => mover(-1));
        document.getElementById("ev-next").addEventListener("click", () => mover(1));
        document.getElementById("ev-hoje").addEventListener("click", () => { const n = new Date(); ref = { ano: n.getFullYear(), mes: n.getMonth() }; carregar(); });
        document.getElementById("ev-cat").addEventListener("change", filtrar);
        Lib.wireFilters("ev-view", (f) => {
          document.getElementById("ev-lista-view").classList.toggle("hidden", f !== "lista");
          document.getElementById("ev-mes-view").classList.toggle("hidden", f !== "mes");
        });
        carregar();
      },
    };
  }

  Object.assign(Pages, { eventos });
})();
