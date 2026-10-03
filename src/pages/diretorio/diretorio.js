/* =========================================================================
   Tela: Diretório & Ramais
   Rota: #/diretorio
   ========================================================================= */
(function () {
  const { icon, breadcrumb, iniciais, foto, esc } = UI;
  const { wireList } = Lib;

  function diretorio() {
    const ramais = App.ramaisAll();
    const setoresU = [...new Set(ramais.map((r) => r.setor))].sort();
    const andaresU = [...new Set(ramais.map((r) => r.andar))];
    const rows = ramais.map((r) => `
      <tr class="dir-row border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          data-setor="${esc(r.setor)}" data-andar="${esc(r.andar)}" data-busca="${esc((r.nome + " " + r.cargo + " " + r.ramal).toLowerCase())}">
        <td class="py-3 pl-4"><div class="avatar-soft w-8 h-8 text-[10px]">${foto(r.nome)}${esc(iniciais(r.nome))}</div></td>
        <td class="py-3 font-bold text-slate-800 dark:text-slate-100">${esc(r.nome)}</td>
        <td class="py-3 text-slate-500 dark:text-slate-400">${esc(r.cargo)}</td>
        <td class="py-3 text-slate-500 dark:text-slate-400">${esc(r.setor)}</td>
        <td class="py-3 text-slate-500 dark:text-slate-400">${esc(r.andar)}</td>
        <td class="py-3"><a href="mailto:${esc(r.email)}" class="text-slate-500 dark:text-slate-400 hover:text-wine hover:underline">${esc(r.email)}</a></td>
        <td class="py-3 pr-4"><button data-action="copy-ramal" data-ramal="${esc(r.ramal)}" data-nome="${esc(r.nome)}" class="ramal-btn" title="Copiar ramal">${esc(r.ramal)}</button></td>
      </tr>`).join("");
    const opt = (arr) => arr.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    return {
      title: "Diretório de Colaboradores & Ramais",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Diretório & Ramais"}])}
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap items-center">
          <div class="search-box w-56"><span>${icon("search","w-4 h-4 text-slate-400")}</span>
            <input id="dir-busca" type="text" placeholder="Buscar por nome ou ramal..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="dir-setor" class="select-field"><option value="">Setor: Todos</option>${opt(setoresU)}</select>
          <select id="dir-andar" class="select-field"><option value="">Andar: Todos</option>${opt(andaresU)}</select>
        </div>
        <span class="font-bold text-wine text-sm">${ramais.length} colaboradores · clique no ramal para copiar</span>
      </div>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th class="py-3 pl-4">Foto</th><th>Nome Completo</th><th>Cargo</th><th>Setor</th><th>Andar</th><th>E-mail Corporativo</th><th class="pr-4">Ramal</th>
          </tr></thead>
          <tbody id="dir-rows">${rows}</tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="dir-info">Exibindo colaboradores</span>
        <div class="flex gap-1.5" id="dir-pager"></div>
      </div>`,
      init() {
        wireList({
          containerId: "dir-rows", itemSel: ".dir-row", size: 5,
          pagerId: "dir-pager", infoId: "dir-info", label: "colaboradores",
          controls: ["#dir-busca", "#dir-setor", "#dir-andar"],
          onEmpty: ramais.length ? "Nenhum colaborador com esses filtros." : "Nenhum colaborador encontrado.",
          filterFn: (el) => {
            const s = document.getElementById("dir-setor")?.value || "";
            const an = document.getElementById("dir-andar")?.value || "";
            const q = (document.getElementById("dir-busca")?.value || "").trim().toLowerCase();
            return (!s || el.dataset.setor === s) && (!an || el.dataset.andar === an) && (!q || el.dataset.busca.includes(q));
          },
        });
      },
    };
  }

  Object.assign(Pages, { diretorio });
})();
