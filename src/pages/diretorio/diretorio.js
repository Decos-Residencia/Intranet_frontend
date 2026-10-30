/* =========================================================================
   Tela: Diretório & Ramais
   Rota: #/diretorio
   Busca única (nome, cargo, setor ou número de ramal), ramal em destaque com botão de
   copiar e duas visões: Pessoas (tabela) e Por setor (ramal do setor + quem trabalha nele).
   ========================================================================= */
(function () {
  const { icon, breadcrumb, iniciais, foto, esc } = UI;
  const { wireList } = Lib;

  const normalizar = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function botaoRamal(ramal, nome, extra = "") {
    return `<button type="button" data-action="copy-ramal" data-ramal="${esc(ramal)}" data-nome="${esc(nome)}" class="ramal-btn ramal-btn-lg" aria-label="Copiar ramal ${esc(ramal)} de ${esc(nome)}">
      ${icon("copy", "w-3.5 h-3.5")} ${esc(ramal)}${extra}</button>`;
  }

  function diretorio() {
    const ramais = App.ramaisAll();
    const setores = App.setoresAll();
    const canManageRamais = App.can("manage_users");
    const setoresU = [...new Set(ramais.map((r) => r.setor))].sort();
    const andaresU = [...new Set(ramais.map((r) => r.andar))].filter((a) => a && a !== "—").sort();

    const ramalCell = (r) => {
      if (r.ramal && r.ramal !== "—") return botaoRamal(r.ramal, r.nome) + (r.ramalProprio ? "" : `<div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ramal do setor</div>`);
      return canManageRamais
        ? `<button type="button" data-action="open-usuario" data-id="${esc(r.id)}" class="ramal-btn ramal-btn-empty" title="Cadastrar ramal">${icon("plus", "w-3.5 h-3.5")} Cadastrar</button>`
        : `<span class="text-slate-500 dark:text-slate-400">Sem ramal</span>`;
    };
    const rows = ramais.map((r) => `
      <tr class="dir-row border-b border-slate-100 dark:border-slate-800"
          data-setor="${esc(r.setor)}" data-andar="${esc(r.andar)}" data-busca="${esc(normalizar([r.nome, r.cargo, r.setor, r.ramal].join(" ")))}">
        <td class="py-3 pl-4"><div class="flex items-center gap-3"><div class="avatar-soft w-9 h-9 text-[11px] shrink-0">${foto(r.nome)}${esc(iniciais(r.nome))}</div>
          <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(r.nome)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${esc(r.cargo)}</div></div></div></td>
        <td class="py-3">${ramalCell(r)}</td>
        <td class="py-3 text-slate-600 dark:text-slate-300">${esc(r.setor)}${r.andar && r.andar !== "—" ? `<div class="text-xs text-slate-500 dark:text-slate-400">${esc(r.andar)}</div>` : ""}</td>
        <td class="py-3 pr-4"><a href="mailto:${esc(r.email)}" class="text-slate-600 dark:text-slate-300 hover:text-wine hover:underline break-all">${esc(r.email)}</a></td>
      </tr>`).join("");

    const porSetor = setores.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((s) => {
      const pessoas = ramais.filter((r) => r.setorId === s.id);
      return `<section class="card p-5 dir-setor" data-busca="${esc(normalizar([s.nome, s.ramal, ...pessoas.map((p) => `${p.nome} ${p.cargo} ${p.ramal}`)].join(" ")))}" aria-label="${esc(s.nome)}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0"><h3 class="font-extrabold text-slate-800 dark:text-slate-100">${esc(s.nome)}</h3>
            <div class="text-xs text-slate-500 dark:text-slate-400">${pessoas.length} ${pessoas.length === 1 ? "pessoa" : "pessoas"}</div></div>
          ${s.ramal ? botaoRamal(s.ramal, s.nome) : canManageRamais ? `<button type="button" data-action="open-setor" data-id="${esc(s.id)}" class="ramal-btn ramal-btn-empty">${icon("plus", "w-3.5 h-3.5")} Ramal do setor</button>` : `<span class="text-xs text-slate-500 dark:text-slate-400">Sem ramal</span>`}
        </div>
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">${pessoas.map((p) => `
          <li class="flex items-center justify-between gap-3 py-2"><div class="min-w-0"><div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${esc(p.nome)}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(p.cargo)}</div></div>
            ${p.ramalProprio ? botaoRamal(p.ramal, p.nome) : ""}</li>`).join("") || `<li class="text-sm text-slate-500 dark:text-slate-400 py-2">Ninguém cadastrado neste setor.</li>`}</ul>
      </section>`;
    }).join("");

    const opt = (arr) => arr.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    return {
      title: "Diretório & Ramais",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Diretório & Ramais" }])}
      <div class="mb-5"><h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Diretório & Ramais</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Busque por nome, cargo, setor ou número do ramal. Clique no ramal para copiar.</p></div>
      <div class="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div class="search-box flex-1 min-w-[14rem]"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
          <input id="dir-busca" type="search" aria-label="Buscar por nome, cargo, setor ou ramal" placeholder="Nome, cargo, setor ou ramal (ex.: 2145)" class="bg-transparent outline-none flex-1 text-sm text-slate-700 dark:text-slate-200"></div>
        <select id="dir-setor" class="select-field" aria-label="Filtrar por setor"><option value="">Setor: Todos</option>${opt(setoresU)}</select>
        ${andaresU.length ? `<select id="dir-andar" class="select-field" aria-label="Filtrar por andar"><option value="">Andar: Todos</option>${opt(andaresU)}</select>` : ""}
        <div class="cfg-seg" role="group" aria-label="Forma de exibição">
          <label><input type="radio" name="dir-visao" value="pessoas" checked><span>${icon("users", "w-4 h-4 mr-1")}Pessoas</span></label>
          <label><input type="radio" name="dir-visao" value="setores"><span>${icon("user-cog", "w-4 h-4 mr-1")}Por setor</span></label>
        </div>
      </div>

      <div id="dir-pessoas">
        <div class="card overflow-x-auto">
          <table class="w-full text-sm text-left">
            <caption class="sr-only">Colaboradores e ramais</caption>
            <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th scope="col" class="py-3 pl-4">Colaborador</th><th scope="col">Ramal</th><th scope="col">Setor</th><th scope="col" class="pr-4">E-mail</th>
            </tr></thead>
            <tbody id="dir-rows">${rows}</tbody>
          </table>
        </div>
        <div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mt-4 flex-wrap gap-3">
          <span id="dir-info" aria-live="polite"></span><div class="flex gap-1.5" id="dir-pager"></div>
        </div>
      </div>
      <div id="dir-setores" class="hidden grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">${porSetor}</div>
      <p id="dir-setores-vazio" class="hidden text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Nenhum setor encontrado.</p>`,
      init() {
        const valor = (id) => document.getElementById(id)?.value || "";
        const termo = () => normalizar(valor("dir-busca").trim());
        wireList({
          containerId: "dir-rows", itemSel: ".dir-row", size: 15,
          pagerId: "dir-pager", infoId: "dir-info", label: "colaboradores",
          controls: ["#dir-busca", "#dir-setor", "#dir-andar"],
          onEmpty: ramais.length ? "Nenhum colaborador com esses filtros." : "Nenhum colaborador encontrado.",
          filterFn: (el) => {
            const s = valor("dir-setor"), an = valor("dir-andar"), q = termo();
            return (!s || el.dataset.setor === s) && (!an || el.dataset.andar === an) && (!q || el.dataset.busca.includes(q));
          },
        });
        const filtrarSetores = () => {
          const q = termo(), s = valor("dir-setor");
          let visiveis = 0;
          document.querySelectorAll(".dir-setor").forEach((el) => {
            const ok = (!q || el.dataset.busca.includes(q)) && (!s || el.getAttribute("aria-label") === s);
            el.classList.toggle("hidden", !ok); if (ok) visiveis++;
          });
          document.getElementById("dir-setores-vazio").classList.toggle("hidden", visiveis > 0 || document.getElementById("dir-setores").classList.contains("hidden"));
        };
        ["dir-busca", "dir-setor"].forEach((id) => document.getElementById(id)?.addEventListener("input", filtrarSetores));
        document.getElementById("dir-setor")?.addEventListener("change", filtrarSetores);
        document.querySelectorAll('input[name="dir-visao"]').forEach((r) => r.addEventListener("change", () => {
          const setoresVis = r.value === "setores" && r.checked;
          document.getElementById("dir-pessoas").classList.toggle("hidden", setoresVis);
          document.getElementById("dir-setores").classList.toggle("hidden", !setoresVis);
          const andar = document.getElementById("dir-andar"); if (andar) andar.disabled = setoresVis;
          filtrarSetores();
        }));
      },
    };
  }

  Object.assign(Pages, { diretorio });
})();
