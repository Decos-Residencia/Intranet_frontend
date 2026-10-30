/* =========================================================================
   Tela: Calendário institucional (gestão de eventos)
   Rota: #/admin/calendario
   Datas sem inscrição: campanhas (Outubro Rosa, Novembro Azul), datas comemorativas, auditorias e
   feriados locais. Os feriados nacionais são calculados e aparecem só para consulta.
   ========================================================================= */
(function () {
  const { icon, esc, badge } = UI;
  const TIPOS = [["CAMPANHA", "Campanha"], ["COMEMORATIVA", "Data comemorativa"], ["AUDITORIA", "Auditoria / acreditação"], ["FERIADO", "Feriado local"]];
  const ROTULO = Object.fromEntries(TIPOS);
  const ddmmaa = (s) => s.split("-").reverse().join("/");
  const periodo = (i) => (i.inicio === i.fim ? ddmmaa(i.inicio) : `${ddmmaa(i.inicio)} a ${ddmmaa(i.fim)}`);

  function formulario(i) {
    return `<form id="inst-form" class="space-y-4" novalidate>
      <div><label class="field-label" for="inst-titulo">TÍTULO *</label><input id="inst-titulo" class="field-input" maxlength="150" value="${esc(i?.titulo || "")}" placeholder="Ex.: Novembro Azul"></div>
      <div><label class="field-label" for="inst-tipo">TIPO *</label><select id="inst-tipo" class="field-input">${TIPOS.map(([v, l]) => `<option value="${v}" ${i?.tipo === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="field-label" for="inst-inicio">INÍCIO *</label><input id="inst-inicio" type="date" class="field-input" value="${esc(i?.inicio || "")}"></div>
        <div><label class="field-label" for="inst-fim">FIM</label><input id="inst-fim" type="date" class="field-input" value="${esc(i && i.fim !== i.inicio ? i.fim : "")}"><p class="field-hint">Vazio = um dia só.</p></div>
      </div>
      <div><label class="field-label" for="inst-desc">DESCRIÇÃO</label><textarea id="inst-desc" class="field-input" rows="3" maxlength="1000">${esc(i?.descricao || "")}</textarea></div>
      <fieldset><legend class="field-label">QUEM VÊ</legend>
        <div class="flex gap-4 flex-wrap text-sm">
          <label class="flex items-center gap-2"><input type="radio" name="inst-publico" value="GERAL" ${(i?.publico || "GERAL") === "GERAL" ? "checked" : ""}> Todos, inclusive sem login</label>
          <label class="flex items-center gap-2"><input type="radio" name="inst-publico" value="INTERNO" ${i?.publico === "INTERNO" ? "checked" : ""}> Só colaboradores (interno)</label>
        </div><p class="field-hint">Datas de auditoria costumam ser internas.</p></fieldset>
      <p id="inst-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">${i ? "Salvar alterações" : "Cadastrar data"}</button></form>`;
  }

  function linha(i) {
    return `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="py-3 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(i.titulo)}</div>
        ${i.descricao && !i.calculado ? `<div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">${esc(i.descricao)}</div>` : ""}</td>
      <td class="text-sm">${esc(periodo(i))}</td>
      <td>${i.calculado ? badge("gray", "Feriado nacional") : badge(i.tipo === "AUDITORIA" ? "amber" : "teal", ROTULO[i.tipo] || i.tipo)}</td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${i.publico === "INTERNO" ? "Interno" : "Todos"}</td>
      <td class="text-right pr-4">${i.calculado ? `<span class="text-xs text-slate-500 dark:text-slate-400">Automático</span>` : `<div class="flex gap-1.5 justify-end">
        <button type="button" class="act-btn" data-inst-editar="${i.id}" aria-label="Editar ${esc(i.titulo)}">${icon("edit", "w-4 h-4")}</button>
        <button type="button" class="act-btn act-btn-danger" data-inst-excluir="${i.id}" aria-label="Excluir ${esc(i.titulo)}">${icon("trash", "w-4 h-4")}</button></div>`}</td></tr>`;
  }

  function adminCalendario() {
    let ano = new Date().getFullYear(), itens = [];
    async function carregar() {
      const corpo = document.getElementById("inst-rows");
      if (!corpo) return;
      document.getElementById("inst-ano").textContent = ano;
      try {
        itens = await Services.calendario.listar(`${ano}-01-01`, `${ano}-12-31`);
        if (!document.contains(corpo)) return;
        const mostrarFeriados = document.getElementById("inst-feriados").checked;
        const vis = itens.filter((i) => mostrarFeriados || !i.calculado);
        corpo.innerHTML = vis.length ? vis.map(linha).join("") : `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Nenhuma data cadastrada em ${ano}.</td></tr>`;
      } catch (err) { corpo.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar. ${esc(err.message || "")}</td></tr>`; }
    }
    function abrir(i) {
      App.openPanel(i ? "Editar data" : "Nova data institucional", formulario(i));
      const form = document.getElementById("inst-form"), erro = document.getElementById("inst-erro");
      document.getElementById("inst-titulo").focus();
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const v = (id) => document.getElementById(id).value.trim();
        const corpo = { titulo: v("inst-titulo"), tipo: v("inst-tipo"), inicio: v("inst-inicio"), fim: v("inst-fim") || v("inst-inicio"),
          descricao: v("inst-desc") || null, publico: form.querySelector('[name="inst-publico"]:checked').value };
        const falha = !corpo.titulo ? "Informe o título." : !corpo.inicio ? "Informe a data de início." : corpo.fim < corpo.inicio ? "O fim não pode ser antes do início." : "";
        if (falha) { erro.textContent = falha; erro.classList.remove("hidden"); return; }
        try {
          if (i) await Services.calendario.atualizar(i.id, corpo); else await Services.calendario.criar(corpo);
          App.closePanel(); App.toast(i ? "Data atualizada" : "Data cadastrada");
          ano = Number(corpo.inicio.slice(0, 4)); carregar();
        } catch (err) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); }
      });
    }
    return {
      title: "Calendário institucional",
      html: `
      <div class="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Gestão de eventos</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Calendário institucional</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Campanhas, datas comemorativas, auditorias e feriados locais aparecem numa camada própria do calendário de Eventos, sem inscrição. Os feriados nacionais entram sozinhos.</p></div>
        <button type="button" id="inst-nova" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Nova data</button>
      </div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex items-center gap-2">
          <button type="button" class="btn-outline px-3 py-2" id="inst-ant" aria-label="Ano anterior">${icon("chevron-left", "w-4 h-4")}</button>
          <span class="font-bold text-slate-800 dark:text-slate-100 w-16 text-center" id="inst-ano" aria-live="polite"></span>
          <button type="button" class="btn-outline px-3 py-2" id="inst-prox" aria-label="Próximo ano">${icon("chevron-right", "w-4 h-4")}</button>
        </div>
        <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" id="inst-feriados" checked> Mostrar feriados nacionais</label>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <th class="py-3 pl-4">DATA</th><th>PERÍODO</th><th>TIPO</th><th>QUEM VÊ</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="inst-rows"><tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>`,
      init() {
        document.getElementById("inst-nova").addEventListener("click", () => abrir(null));
        document.getElementById("inst-ant").addEventListener("click", () => { ano -= 1; carregar(); });
        document.getElementById("inst-prox").addEventListener("click", () => { ano += 1; carregar(); });
        document.getElementById("inst-feriados").addEventListener("change", carregar);
        document.getElementById("inst-rows").addEventListener("click", (ev) => {
          const b = ev.target.closest("button"); if (!b) return;
          const i = itens.find((x) => String(x.id) === (b.dataset.instEditar || b.dataset.instExcluir));
          if (!i) return;
          if (b.dataset.instEditar) abrir(i);
          else App.openConfirm("Excluir data?", `"${esc(i.titulo)}" sai do calendário institucional.`, async () => {
            try { await Services.calendario.excluir(i.id); App.toast("Data excluída"); carregar(); } catch (err) { App.toast(err.message); }
          });
        });
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminCalendario });
})();
