/* =========================================================================
   Tela: Minha agenda (Comunicação)
   Rota: #/agenda   (#/agenda/AAAA-MM-DD abre um dia específico)
   Um dia por vez: as tarefas que a pessoa anota (texto, horário opcional) e os eventos em que
   está inscrita naquele dia. Criar, editar, concluir, reordenar e excluir — tudo salvo na conta
   (GET/POST/PUT/DELETE /agenda). Só o dono vê a própria agenda.
   ========================================================================= */
(function () {
  const { icon, esc } = UI;

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
  const somarDias = (s, n) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const titulo = (s) => {
    const t = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(deIso(s));
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const hhmm = (h) => (h ? h.slice(0, 5) : "");
  const LEMBRETES = [["", "Sem lembrete"], ["0", "Na hora"], ["10", "10 min antes"], ["30", "30 min antes"]];
  const rotuloLembrete = (m) => ({ 0: "na hora", 10: "10 min antes", 30: "30 min antes" })[m];
  const opcoesLembrete = (atual) => LEMBRETES.map(([v, l]) => `<option value="${v}" ${String(atual ?? "") === v ? "selected" : ""}>${l}</option>`).join("");

  function itemTarefa(t, i, total) {
    return `<li class="agenda-item abre-mouse ${t.feito ? "agenda-feito" : ""}" data-id="${t.id}">
      <label class="agenda-check"><input type="checkbox" data-ag-feito="${t.id}" ${t.feito ? "checked" : ""} aria-label="Concluir: ${esc(t.texto)}"><span aria-hidden="true">${icon("check", "w-4 h-4")}</span></label>
      <div class="min-w-0 flex-1">
        <div class="agenda-texto abre-linha" title="${esc(t.texto)}">${esc(t.texto)}</div>
        ${t.hora ? `<div class="text-xs text-slate-500 dark:text-slate-400">${icon("clock", "w-3.5 h-3.5 inline -mt-0.5")} ${hhmm(t.hora)}${t.lembrete_min != null ? ` · <span class="agenda-lembrete">${icon("bell", "w-3.5 h-3.5 inline -mt-0.5")} lembrete ${rotuloLembrete(t.lembrete_min)}</span>` : ""}</div>` : ""}
      </div>
      <div class="flex gap-1 shrink-0">
        <button type="button" class="act-btn" data-ag-mover="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Subir ${esc(t.texto)}">${icon("chevron-up", "w-4 h-4")}</button>
        <button type="button" class="act-btn" data-ag-mover="${i}" data-dir="1" ${i === total - 1 ? "disabled" : ""} aria-label="Descer ${esc(t.texto)}">${icon("chevron-down", "w-4 h-4")}</button>
        <button type="button" class="act-btn" data-ag-editar="${t.id}" aria-label="Editar ${esc(t.texto)}">${icon("edit", "w-4 h-4")}</button>
        <button type="button" class="act-btn act-btn-danger" data-ag-excluir="${t.id}" aria-label="Excluir ${esc(t.texto)}">${icon("trash", "w-4 h-4")}</button>
      </div>
    </li>`;
  }

  function agenda(diaParam) {
    const hoje = iso(new Date());
    let dia = /^\d{4}-\d{2}-\d{2}$/.test(diaParam || "") ? diaParam : hoje;
    return {
      title: "Minha agenda",
      html: `
      <div class="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Comunicação • Só você vê a sua agenda</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Minha agenda</h2></div>
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="btn-outline px-3" id="ag-ant" aria-label="Dia anterior">${icon("chevron-left", "w-4 h-4")}</button>
          <button type="button" class="btn-outline px-4" id="ag-hoje">Hoje</button>
          <button type="button" class="btn-outline px-3" id="ag-prox" aria-label="Próximo dia">${icon("chevron-right", "w-4 h-4")}</button>
          <label class="sr-only" for="ag-data">Ir para a data</label><input id="ag-data" type="date" class="field-input w-auto" value="${dia}">
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section class="card p-6 lg:col-span-2" aria-labelledby="ag-titulo">
          <div class="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 id="ag-titulo" class="text-lg font-extrabold text-slate-800 dark:text-slate-100"></h3>
            <span id="ag-progresso" class="text-sm font-semibold text-slate-500 dark:text-slate-400" aria-live="polite"></span>
          </div>
          <form id="ag-form" class="agenda-form" novalidate>
            <label class="sr-only" for="ag-texto">Nova tarefa</label>
            <input id="ag-texto" class="field-input flex-1" maxlength="200" placeholder="O que você precisa fazer? (ex.: Revisar escala do plantão)" autocomplete="off">
            <label class="sr-only" for="ag-hora">Horário (opcional)</label>
            <input id="ag-hora" type="time" class="field-input w-auto">
            <label class="sr-only" for="ag-lembrete">Lembrete</label>
            <select id="ag-lembrete" class="field-input w-auto" disabled title="Defina um horário para usar o lembrete">${opcoesLembrete("")}</select>
            <button type="submit" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Adicionar</button>
          </form>
          <p id="ag-lembrete-dica" class="field-hint mt-1">O lembrete fica disponível depois de escolher um horário.</p>
          <p id="ag-erro" class="text-sm text-red-700 dark:text-red-300 mt-2 hidden" role="alert"></p>
          <ol id="ag-lista" class="space-y-2 mt-4"></ol>
        </section>
        <aside class="space-y-6">
          <section class="card p-6" aria-labelledby="ag-ev-h">
            <h3 id="ag-ev-h" class="font-extrabold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">${icon("calendar", "w-5 h-5 text-wine")} Meus eventos do dia</h3>
            <div id="ag-eventos" class="space-y-2"></div>
            <a href="#/eventos" class="text-sm font-bold text-wine inline-block mt-3">Ver agenda de eventos</a>
          </section>
          <section class="card p-6">
            <h3 class="font-extrabold text-slate-800 dark:text-slate-100 mb-2">Dicas</h3>
            <div id="ag-alertas" class="mb-3"></div>
            <ul class="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
              <li>Com lembrete, você recebe um aviso no sino na hora escolhida.</li>
              <li>Tarefas com horário entram na ordem do dia; as sem horário ficam no topo.</li>
              <li>Use as setas para mudar a ordem como preferir.</li>
              <li>Para mudar uma tarefa de dia, edite e escolha a nova data.</li>
            </ul>
          </section>
        </aside>
      </div>`,
      async init() {
        let tarefas = [];
        const $ = (id) => document.getElementById(id);
        const erro = (msg) => { const e = $("ag-erro"); e.textContent = msg || ""; e.classList.toggle("hidden", !msg); };

        function pintar() {
          const feitas = tarefas.filter((t) => t.feito).length;
          $("ag-titulo").textContent = dia === hoje ? `Hoje · ${titulo(dia)}` : titulo(dia);
          $("ag-progresso").textContent = tarefas.length ? `${feitas} de ${tarefas.length} concluídas` : "";
          $("ag-lista").innerHTML = tarefas.length ? tarefas.map((t, i) => itemTarefa(t, i, tarefas.length)).join("")
            : `<li class="agenda-vazia">${icon("calendar", "w-8 h-8")}<span>Nada anotado para este dia. Que tal começar pela tarefa mais importante?</span></li>`;
        }
        async function carregar() {
          $("ag-data").value = dia;
          history.replaceState(null, "", `#/agenda/${dia}`);
          try { tarefas = await Services.agenda.doDia(dia); } catch (err) { erro(err.message || "Não foi possível carregar a agenda."); tarefas = []; }
          pintar();
          // Eventos inscritos no dia (das minhas inscrições já carregadas).
          const meus = App.minhasInscricoes().filter((e) => iso(e.ini) === dia && !e.cancelado);
          $("ag-eventos").innerHTML = meus.length ? meus.map((e) => `<a href="#/eventos/${e.id}" class="ev-dia-item">
              <span class="font-bold text-sm text-slate-800 dark:text-slate-100">${esc(e.titulo)}</span>
              <span class="block text-xs text-slate-500 dark:text-slate-400">${esc(e.horario)} · ${esc(e.local)}</span></a>`).join("")
            : `<p class="text-sm text-slate-500 dark:text-slate-400">Nenhum evento inscrito neste dia.</p>`;
        }
        const irPara = (novo) => { dia = novo; erro(""); carregar(); };
        $("ag-ant").addEventListener("click", () => irPara(somarDias(dia, -1)));
        $("ag-prox").addEventListener("click", () => irPara(somarDias(dia, 1)));
        $("ag-hoje").addEventListener("click", () => irPara(hoje));
        $("ag-data").addEventListener("change", (e) => { if (e.target.value) irPara(e.target.value); });

        // Lembrete só com horário (a mesma regra do servidor).
        const sincronizarLembrete = (horaEl, selEl, dicaEl) => {
          const sem = !horaEl.value;
          selEl.disabled = sem;
          if (sem) selEl.value = "";
          selEl.title = sem ? "Defina um horário para usar o lembrete" : "";
          dicaEl?.classList.toggle("hidden", !sem);
        };
        $("ag-hora").addEventListener("input", () => sincronizarLembrete($("ag-hora"), $("ag-lembrete"), $("ag-lembrete-dica")));
        const pintarAlertas = () => App.botaoAlertasNavegador?.($("ag-alertas"));
        pintarAlertas();

        $("ag-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const texto = $("ag-texto").value.trim(), hora = $("ag-hora").value || null;
          const lembrete = $("ag-lembrete").value === "" ? null : Number($("ag-lembrete").value);
          if (!texto) { erro("Escreva a tarefa."); $("ag-texto").focus(); return; }
          try {
            await Services.agenda.criar({ data: dia, texto, hora, lembrete_min: hora ? lembrete : null });
            $("ag-texto").value = ""; $("ag-hora").value = ""; sincronizarLembrete($("ag-hora"), $("ag-lembrete"), $("ag-lembrete-dica")); erro("");
            App.agendarLembretes?.();
            tarefas = await Services.agenda.doDia(dia); pintar(); $("ag-texto").focus();
          } catch (err) { erro(err.message || "Não foi possível salvar."); }
        });

        $("ag-lista").addEventListener("change", async (e) => {
          const c = e.target.closest("[data-ag-feito]");
          if (!c) return;
          try { await Services.agenda.atualizar(c.dataset.agFeito, { feito: c.checked }); tarefas = await Services.agenda.doDia(dia); pintar(); }
          catch (err) { erro(err.message || "Não foi possível atualizar."); c.checked = !c.checked; }
        });
        $("ag-lista").addEventListener("click", async (e) => {
          const mover = e.target.closest("[data-ag-mover]"), editar = e.target.closest("[data-ag-editar]"), excluir = e.target.closest("[data-ag-excluir]");
          if (mover) {
            const i = Number(mover.dataset.agMover), j = i + Number(mover.dataset.dir);
            const ids = tarefas.map((t) => t.id); [ids[i], ids[j]] = [ids[j], ids[i]];
            try { tarefas = await Services.agenda.reordenar(dia, ids); pintar(); document.querySelector(`[data-ag-mover="${j}"][data-dir="${mover.dataset.dir}"]`)?.focus(); }
            catch (err) { erro(err.message || "Não foi possível reordenar."); }
          } else if (editar) {
            const t = tarefas.find((x) => x.id === Number(editar.dataset.agEditar));
            App.openPanel("Editar tarefa", `<form id="ag-ed" class="space-y-4" novalidate>
              <div><label class="field-label" for="ag-ed-texto">TAREFA</label><input id="ag-ed-texto" class="field-input" maxlength="200" value="${esc(t.texto)}"></div>
              <div class="grid grid-cols-2 gap-3"><div><label class="field-label" for="ag-ed-data">DIA</label><input id="ag-ed-data" type="date" class="field-input" value="${t.data}"></div>
              <div><label class="field-label" for="ag-ed-hora">HORÁRIO</label><input id="ag-ed-hora" type="time" class="field-input" value="${hhmm(t.hora)}"></div></div>
              <div><label class="field-label" for="ag-ed-lembrete">LEMBRETE</label><select id="ag-ed-lembrete" class="field-input">${opcoesLembrete(t.lembrete_min)}</select>
                <p id="ag-ed-dica" class="field-hint">Defina um horário para usar o lembrete.</p></div>
              <p id="ag-ed-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
              <button type="submit" class="btn-wine w-full py-3">Salvar</button></form>`);
            const edHora = document.getElementById("ag-ed-hora"), edSel = document.getElementById("ag-ed-lembrete"), edDica = document.getElementById("ag-ed-dica");
            sincronizarLembrete(edHora, edSel, edDica);
            if (t.lembrete_min != null && t.hora) edSel.value = String(t.lembrete_min);
            edHora.addEventListener("input", () => sincronizarLembrete(edHora, edSel, edDica));
            document.getElementById("ag-ed").addEventListener("submit", async (ev) => {
              ev.preventDefault();
              const texto = document.getElementById("ag-ed-texto").value.trim();
              const box = document.getElementById("ag-ed-erro");
              if (!texto) { box.textContent = "Escreva a tarefa."; box.classList.remove("hidden"); return; }
              try {
                const hora = edHora.value || null;
                await Services.agenda.atualizar(t.id, { texto, data: document.getElementById("ag-ed-data").value || t.data, hora,
                  lembrete_min: hora && edSel.value !== "" ? Number(edSel.value) : null });
                App.closePanel(); App.toast("Tarefa atualizada"); tarefas = await Services.agenda.doDia(dia); pintar(); App.agendarLembretes?.();
              } catch (err) { box.textContent = err.message || "Não foi possível salvar."; box.classList.remove("hidden"); }
            });
          } else if (excluir) {
            const t = tarefas.find((x) => x.id === Number(excluir.dataset.agExcluir));
            App.openConfirm("Excluir tarefa?", `"${esc(t.texto)}" sai da sua agenda.`, async () => {
              try { await Services.agenda.excluir(t.id); tarefas = await Services.agenda.doDia(dia); pintar(); }
              catch (err) { erro(err.message || "Não foi possível excluir."); }
            });
          }
        });
        carregar();
      },
    };
  }

  Object.assign(Pages, { agenda });
})();
