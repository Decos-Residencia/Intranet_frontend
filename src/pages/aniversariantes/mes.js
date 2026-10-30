/* =========================================================================
   Tela: Aniversariantes do Mês
   Rota: #/aniversariantes
   Fonte: GET /aniversariantes (só usuários ativos, sem ano de nascimento).
   Mostra só o mês corrente, ordenado por dia; filtros por setor e por nome.
   ========================================================================= */
(function () {
  const { icon, iniciais, foto, parabensBtn, esc } = UI;
  const { wireList } = Lib;

  const nomeMes = (m) => {
    const n = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, m - 1, 1));
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  function aniversariantes() {
    const { mes: atual, dia: hoje } = App.hoje();
    const todos = App.aniversariantesAll().filter((p) => p.mes === atual).sort((a, b) => a.dia - b.dia);
    const setoresU = [...new Set(todos.map((p) => p.setor))].sort();
    const cards = todos.map((p) => `
      <div class="card p-6 text-center flex flex-col items-center ani-card" data-setor="${esc(p.setor)}" data-busca="${esc((p.nome + " " + p.cargo).toLowerCase())}">
        <div class="avatar-birthday mx-auto mb-3">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="font-bold text-slate-800 dark:text-slate-100">${esc(p.nome)}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(p.cargo)}</div>
        <span class="tag-outline mb-3 inline-block">${esc(p.setor)}</span>
        <div class="birthday-pill ${p.dia === hoje ? "birthday-pill-hoje" : ""} mx-auto w-max mb-4">${p.dia === hoje ? "hoje" : `dia ${p.dia}`}</div>
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
        <h3 class="font-extrabold text-lg text-slate-800 dark:text-slate-100">${nomeMes(atual)} · ${todos.length} ${todos.length === 1 ? "aniversariante" : "aniversariantes"}</h3>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-52"><span>${icon("search","w-4 h-4 text-slate-400")}</span>
            <input id="ani-busca" type="search" aria-label="Buscar por nome ou cargo" placeholder="Buscar por nome..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="ani-setor" class="select-field" aria-label="Filtrar por setor"><option value="">Setor: Todos</option>${opt(setoresU)}</select>
        </div>
      </div>
      <div id="ani-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">${cards}</div>
      <div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mt-4 flex-wrap gap-3"><span id="ani-info" aria-live="polite"></span><div class="flex gap-1.5" id="ani-pager"></div></div>`,
      init() {
        wireList({
          containerId: "ani-grid", itemSel: ".ani-card", size: 12, pagerId: "ani-pager", infoId: "ani-info",
          label: "aniversariantes", controls: ["#ani-busca", "#ani-setor"],
          onEmpty: todos.length ? "Nenhum aniversariante deste setor ou nome neste mês." : "Nenhum aniversariante neste mês.",
          filterFn: (el) => {
            const s = document.getElementById("ani-setor")?.value || "";
            const q = (document.getElementById("ani-busca")?.value || "").trim().toLowerCase();
            return (!s || el.dataset.setor === s) && (!q || el.dataset.busca.includes(q));
          },
        });
      },
    };
  }

  Object.assign(Pages, { aniversariantes });
})();
