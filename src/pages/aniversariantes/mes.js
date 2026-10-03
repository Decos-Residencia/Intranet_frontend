/* =========================================================================
   Tela: Aniversariantes do Mês
   Rota: #/aniversariantes
   Fonte: GET /usuarios (campo `aniversario` {dia, mes}) — sem ano de nascimento.
   ========================================================================= */
(function () {
  const { icon, iniciais, foto, parabensBtn, esc } = UI;
  const { wireList } = Lib;

  const nomeMes = (m) => {
    const n = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, m - 1, 1));
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  function aniversariantes() {
    const atual = App.hoje().mes;
    // 4 chips: dois meses antes, o atual e o seguinte (com virada de ano).
    const meses = [-2, -1, 0, 1].map((d) => ((atual - 1 + d + 12) % 12) + 1);
    const todos = App.aniversariantesAll().sort((a, b) => a.dia - b.dia);
    const setoresU = [...new Set(todos.map((p) => p.setor))].sort();
    const cards = todos.map((p) => `
      <div class="card p-6 text-center flex flex-col items-center ani-card" data-mes="${p.mes}" data-setor="${esc(p.setor)}" data-busca="${esc((p.nome + " " + p.cargo).toLowerCase())}">
        <div class="avatar-birthday mx-auto mb-3">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="font-bold text-slate-800 dark:text-slate-100">${esc(p.nome)}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(p.cargo)}</div>
        <span class="tag-outline mb-3 inline-block">${esc(p.setor)}</span>
        <div class="birthday-pill mx-auto w-max mb-4">dia ${p.dia}</div>
        ${parabensBtn(p, "btn-wine-soft text-xs px-4 py-2 mt-auto flex items-center gap-1.5")}
      </div>`).join("");
    const opt = (arr) => arr.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    return {
      title: "Aniversariantes",
      html: `
      <div class="banner-wine mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-extrabold text-white">Parabéns aos Aniversariantes de ${nomeMes(atual)}! 🎉</h2>
          <p class="text-white/80 text-sm mt-1">Desejamos muita saúde, felicidade e sucesso a todos os profissionais que completam mais um ciclo de vida.</p>
        </div>
        <a href="#/aniversariantes/hoje" class="btn-white shrink-0">${icon("gift","w-4 h-4")} Aniversariante do dia</a>
      </div>
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap" data-filter-group="mes">
          ${meses.map((m)=>`<button class="chip ${m===atual?"chip-active":""}" data-filter="${m}">${nomeMes(m)}</button>`).join("")}
        </div>
        <div class="flex gap-2 items-center">
          <div class="search-box w-52"><span>${icon("search","w-4 h-4 text-slate-400")}</span>
            <input id="ani-busca" placeholder="Buscar por nome..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="ani-setor" class="select-field"><option value="">Setor: Todos</option>${opt(setoresU)}</select>
        </div>
      </div>
      <div id="ani-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">${cards}</div>`,
      init() {
        wireList({
          containerId: "ani-grid", itemSel: ".ani-card", size: 8,
          label: "aniversariantes", filterGroup: "mes", initialFilter: String(atual),
          controls: ["#ani-busca", "#ani-setor"],
          onEmpty: "Nenhum aniversariante para este mês/setor.",
          filterFn: (el, mes) => {
            const s = document.getElementById("ani-setor")?.value || "";
            const q = (document.getElementById("ani-busca")?.value || "").trim().toLowerCase();
            return el.dataset.mes === mes && (!s || el.dataset.setor === s) && (!q || el.dataset.busca.includes(q));
          },
        });
      },
    };
  }

  Object.assign(Pages, { aniversariantes });
})();
