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
    return `<a href="#/eventos/${e.id}" class="card block p-5 flex gap-4 abre-mouse ev-item ${e.cancelado ? "opacity-70" : ""}" data-tag="${esc(e.tag)}" data-ev-id="${e.id}">
      <div class="date-chip-lg"><span class="text-2xl font-extrabold leading-none">${e.dia}</span><span class="text-[11px] font-bold">${e.mes}</span></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap"><span class="tag-outline">${esc(e.tag)}</span>
          ${e.treinamento ? badge("blue", "TREINAMENTO") : ""}${e.visto ? "" : `<span class="badge badge-new">NOVO</span>`}
          ${e.inscrito ? badge("green", "✓ INSCRITO") : ""}${e.cancelado ? badge("red", "CANCELADO") : e.encerrado ? badge("gray", "ENCERRADO") : ""}
          <h3 class="font-bold text-slate-800 dark:text-slate-100">${esc(e.titulo)}</h3></div>
        <p class="abre-texto text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(e.desc)}</p>
        <div class="flex gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span class="flex items-center gap-1">${icon("clock", "w-3.5 h-3.5")} ${esc(e.horario)}</span>
          <span class="flex items-center gap-1">${icon("map-pin", "w-3.5 h-3.5")} ${esc(e.local)}</span>
          <span class="flex items-center gap-1 font-semibold ${e.vagas && !e.livres ? "text-red-600 dark:text-red-400" : ""}">${icon("users", "w-3.5 h-3.5")} ${esc(e.vagasTxt)}</span>
        </div>
      </div>
    </a>`;
  }

  // Camada institucional (feriados, campanhas, datas do hospital): sem inscrição, cor própria.
  const TIPO_INST = { FERIADO: "Feriado", CAMPANHA: "Campanha", COMEMORATIVA: "Data comemorativa", AUDITORIA: "Auditoria" };
  const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
  const isoDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const FAIXA_DIAS = 7; // períodos maiores viram faixa do mês (não pintam cada dia)
  const ddmm = (s) => s.split("-").reverse().slice(0, 2).join("/");
  const periodoTxt = (i) => (i.inicio === i.fim ? ddmm(i.inicio) : `${ddmm(i.inicio)} a ${ddmm(i.fim)}`);
  function separarInst(inst) {
    const primeiro = inicioDoMes(ref), ultimo = new Date(ref.ano, ref.mes + 1, 0);
    const porDia = {}, faixas = [];
    inst.forEach((i) => {
      const ini = deIso(i.inicio), fim = deIso(i.fim);
      if ((fim - ini) / 86400000 + 1 > FAIXA_DIAS) { faixas.push(i); return; }
      for (let d = new Date(Math.max(ini, primeiro)); d <= ultimo && d <= fim; d.setDate(d.getDate() + 1)) (porDia[d.getDate()] ||= []).push(i);
    });
    return { porDia, faixas };
  }
  const chipInst = (i) => `<span class="inst-faixa inst-${i.tipo.toLowerCase()}" title="${esc(i.descricao || "")}">${esc(i.titulo)} <small>${esc(periodoTxt(i))}</small></span>`;

  // Grade do mês (semana começando na segunda) com os eventos reais de cada dia.
  function grade(eventos) {
    const primeiro = inicioDoMes(ref), dias = new Date(ref.ano, ref.mes + 1, 0).getDate();
    const vazios = (primeiro.getDay() + 6) % 7;
    const porDia = {};
    eventos.forEach((e) => { for (let d = new Date(Math.max(e.ini, primeiro)); d < fimDoMes(ref) && d <= e.fim; d.setDate(d.getDate() + 1)) (porDia[d.getDate()] ||= []).push(e); });
    const celulas = [...Array(vazios).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
    return { porDia, celulas };
  }

  function montar(eventos, inst) {
    const { porDia, celulas } = grade(eventos);
    const { porDia: instDia, faixas } = separarInst(inst);
    const semana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const isHoje = (d) => d && mesmoDia(new Date(ref.ano, ref.mes, d), new Date());
    const rotuloDia = (d) => {
      const partes = [];
      if (porDia[d]) partes.push(`${porDia[d].length} ${porDia[d].length === 1 ? "evento" : "eventos"}`);
      if (instDia[d]) partes.push(instDia[d].map((i) => i.titulo).join(", "));
      return `Dia ${d}: ${partes.join("; ")}`;
    };
    const mini = celulas.map((d) => (d === null ? `<div></div>`
      : porDia[d] || instDia[d] ? `<button type="button" class="cal-day ${porDia[d] ? "cal-day-on" : "cal-day-inst"} ${porDia[d] && instDia[d] ? "cal-day-ambos" : ""}" data-dia="${d}" aria-label="${esc(rotuloDia(d))}" aria-controls="ev-dia">${d}</button>`
      : `<div class="cal-day ${isHoje(d) ? "font-extrabold text-wine" : ""}">${d}</div>`)).join("");
    const mes = `<div class="card p-4 md:p-5">
      ${faixas.length ? `<div class="flex flex-wrap gap-2 mb-3" aria-label="Campanhas do mês">${faixas.map(chipInst).join("")}</div>` : ""}
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">${semana.map((d) => `<div>${d}</div>`).join("")}</div>
      <div class="month-grid">${celulas.map((d) => d === null ? `<div class="month-cell is-muted"></div>`
        : `<div class="month-cell ${porDia[d] ? "has-event" : ""} ${instDia[d] ? "has-inst" : ""}"><span class="month-cell-num ${isHoje(d) ? "text-wine font-extrabold" : ""}">${d}</span>
          ${(instDia[d] || []).slice(0, 1).map((i) => `<span class="month-cell-inst inst-${i.tipo.toLowerCase()}" title="${esc(TIPO_INST[i.tipo])}: ${esc(i.titulo)}">${esc(i.titulo.slice(0, 14))}${i.titulo.length > 14 ? "…" : ""}</span>`).join("")}
          ${(porDia[d] || []).slice(0, instDia[d] ? 1 : 2).map((e) => `<a href="#/eventos/${e.id}" class="month-cell-tag" title="${esc(e.titulo)}">${esc(e.titulo.slice(0, 14))}${e.titulo.length > 14 ? "…" : ""}</a>`).join("")}</div>`).join("")}</div></div>`;
    return { mini, mes, porDia, instDia, faixas };
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
          <select id="ev-tipo" class="select-field" aria-label="Filtrar por tipo"><option value="">Tipo: Todos</option><option value="EVENTO">Eventos</option><option value="TREINAMENTO">Treinamentos</option></select>
          <select id="ev-cat" class="select-field" aria-label="Filtrar por categoria"><option value="">Categoria: Todas</option></select>
        </div>
      </div>
      <div id="ev-lista-view" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-4" id="ev-lista"><div class="card p-10 text-center text-slate-400">Carregando…</div></div>
        <div class="card p-4 ev-mini-card">
          <div class="flex items-baseline justify-between gap-2 mb-2">
            <h3 class="text-xs font-bold tracking-widest text-slate-400">MINI CALENDÁRIO</h3>
            <span class="text-sm font-bold text-slate-800 dark:text-slate-100" id="ev-mini-mes">${esc(rotulo)}</span></div>
          <div id="ev-faixas" class="flex flex-wrap gap-1.5 mb-2"></div>
          <div class="ev-mini-grade text-[11px] text-slate-400 mb-1" aria-hidden="true">${["S", "T", "Q", "Q", "S", "S", "D"].map((d) => `<div>${d}</div>`).join("")}</div>
          <div class="ev-mini-grade text-sm" id="ev-mini"></div>
          <div class="ev-legenda" aria-hidden="true"><span><i class="leg-evento"></i> Eventos</span><span><i class="leg-inst"></i> Institucional</span></div>
          <label class="ev-camada"><span class="switch"><input type="checkbox" id="ev-camada"><span aria-hidden="true"></span></span> Mostrar datas institucionais <small>(feriados, campanhas)</small></label>
          <div id="ev-dia" class="ev-dia mt-4" aria-live="polite"></div>
        </div>
      </div>
      <div id="ev-mes-view" class="hidden"></div>`,
      init() {
        let dados = [], porDia = {}, inst = [], instDia = {};
        const camada = document.getElementById("ev-camada");
        camada.checked = App.preferencia?.("camada_institucional") !== false;
        camada.addEventListener("change", () => {
          App.salvarPreferencias?.({ camada_institucional: camada.checked }).catch(() => {});
          filtrar();
        });
        const DICA = `<p class="text-xs text-slate-500 dark:text-slate-400">Passe o mouse num dia destacado ou num evento da lista para ver os detalhes aqui.</p>`;
        // Marca no mini calendário os dias do evento apontado na lista (ou limpa).
        const marcarDias = (dias) => document.querySelectorAll("#ev-mini [data-dia]").forEach((b) => b.classList.toggle("cal-day-foco", dias.includes(b.dataset.dia)));
        const mostrarDia = (d, soEvento = null) => {
          const alvo = document.getElementById("ev-dia");
          if (!alvo) return;
          const lista = (porDia[d] || []).filter((e) => !soEvento || e.id === soEvento);
          const datas = soEvento ? [] : instDia[d] || [];
          if (!d || (!lista.length && !datas.length)) { alvo.innerHTML = DICA; return; }
          const data = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(ref.ano, ref.mes, Number(d)));
          alvo.innerHTML = `<div class="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2">${esc(data.charAt(0).toUpperCase() + data.slice(1))}</div>
            ${datas.map((i) => `<div class="inst-card inst-${i.tipo.toLowerCase()}"><span class="ev-dia-tipo">${esc(TIPO_INST[i.tipo])}${i.inicio !== i.fim ? ` · ${esc(periodoTxt(i))}` : ""}</span>
              <span class="block font-bold text-slate-800 dark:text-slate-100">${esc(i.titulo)}</span>
              ${i.descricao ? `<span class="block text-xs text-slate-600 dark:text-slate-300 mt-0.5">${esc(i.descricao)}</span>` : ""}</div>`).join("")}
            <ul class="space-y-3 ${datas.length ? "mt-3" : ""}">${lista.map((e) => `<li><a href="#/eventos/${e.id}" class="ev-dia-card">
              <span class="ev-dia-foto" aria-hidden="true">${e.fotoDemo ? `<img src="${e.fotoDemo}" alt="" class="ev-slide-img is-loaded">` : e.temImagem ? `<img data-foto-evento="${e.id}" alt="" class="ev-slide-img">` : ""}${icon("calendar", "w-8 h-8")}</span>
              <span class="ev-dia-corpo">
                <span class="ev-dia-tipo">${e.treinamento ? "Treinamento" : "Evento"}${e.cancelado ? " · Cancelado" : ""}</span>
                <span class="block font-bold text-slate-800 dark:text-slate-100 leading-snug">${esc(e.titulo)}</span>
                <span class="block text-xs text-slate-600 dark:text-slate-300 mt-1">${icon("clock", "w-3.5 h-3.5 inline -mt-0.5")} ${esc(e.horario)}</span>
                <span class="block text-xs text-slate-600 dark:text-slate-300">${icon("map-pin", "w-3.5 h-3.5 inline -mt-0.5")} ${esc(e.local)}</span>
                <span class="block text-xs text-slate-600 dark:text-slate-300">${icon("users", "w-3.5 h-3.5 inline -mt-0.5")} ${esc(e.vagasTxt)}</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${esc(e.desc)}</span>
              </span></a></li>`).join("")}</ul>`;
          App.carregarFotosEventos(alvo);
        };
        const mini = document.getElementById("ev-mini");
        mini.addEventListener("mouseover", (ev) => { const b = ev.target.closest("[data-dia]"); if (b) mostrarDia(b.dataset.dia); });
        mini.addEventListener("focusin", (ev) => { const b = ev.target.closest("[data-dia]"); if (b) mostrarDia(b.dataset.dia); });
        mini.addEventListener("click", (ev) => { const b = ev.target.closest("[data-dia]"); if (b) mostrarDia(b.dataset.dia); });
        mini.addEventListener("mouseleave", () => { if (!mini.contains(document.activeElement)) mostrarDia(null); });
        // Passar o mouse (ou focar) um evento da lista também mostra onde ele cai no calendário.
        const listaEl = document.getElementById("ev-lista");
        let apontado = null;
        const apontar = (ev) => {
          const card = ev.target.closest("[data-ev-id]");
          const id = card ? Number(card.dataset.evId) : null;
          if (id === apontado) return;
          apontado = id;
          if (!id) { marcarDias([]); mostrarDia(null); return; }
          const dias = Object.keys(porDia).filter((d) => porDia[d].some((e) => e.id === id));
          marcarDias(dias);
          mostrarDia(dias[0] || null, id);
        };
        listaEl.addEventListener("mouseover", apontar);
        listaEl.addEventListener("focusin", apontar);
        listaEl.addEventListener("mouseleave", () => { if (!listaEl.contains(document.activeElement)) { apontado = null; marcarDias([]); mostrarDia(null); } });
        listaEl.addEventListener("focusout", (ev) => { if (!listaEl.contains(ev.relatedTarget)) { apontado = null; marcarDias([]); mostrarDia(null); } });
        const filtrar = () => {
          const c = document.getElementById("ev-cat")?.value || "";
          const t = document.getElementById("ev-tipo")?.value || "";
          const vis = dados.filter((e) => (!c || e.tag === c) && (!t || e.tipo === t));
          const lista = document.getElementById("ev-lista");
          if (!lista) return;
          lista.innerHTML = vis.length ? vis.map(cartao).join("") : `<div class="card p-10 text-center text-slate-500 dark:text-slate-400">${dados.length ? "Nenhum evento com esses filtros." : "Nenhum evento neste mês."}</div>`;
          const g = montar(vis, camada.checked ? inst : []);
          porDia = g.porDia; instDia = g.instDia;
          document.getElementById("ev-faixas").innerHTML = g.faixas.map(chipInst).join("");
          document.getElementById("ev-mini").innerHTML = g.mini;
          mostrarDia(null);
          document.getElementById("ev-mes-view").innerHTML = g.mes;
        };
        const carregar = async () => {
          const eu = ++carregamento;
          const rot = UI.fmtMesAno(inicioDoMes(ref));
          document.getElementById("ev-mes-label").textContent = rot; document.getElementById("ev-mini-mes").textContent = rot;
          try {
            const [r, datasInst] = await Promise.all([
              Services.eventos.list({ de: inicioDoMes(ref).toISOString(), ate: fimDoMes(ref).toISOString(), page_size: 100 }),
              Services.calendario.listar(isoDia(inicioDoMes(ref)), isoDia(new Date(ref.ano, ref.mes + 1, 0))).catch(() => []),
            ]);
            if (eu !== carregamento || !document.getElementById("ev-lista")) return;
            inst = datasInst;
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
        document.getElementById("ev-tipo").addEventListener("change", filtrar);
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
