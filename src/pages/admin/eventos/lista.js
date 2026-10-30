/* =========================================================================
   Tela: Gerenciar Eventos (ADMIN)
   Rota: #/admin/eventos
   Fonte: GET /eventos (todos os estados; busca, categoria, status e paginação no servidor) e GET /eventos/resumo.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const STATUS = [["", "Todos"], ["PUBLICADO", "Publicados"], ["EM_REVISAO", "Em revisão"], ["RASCUNHO", "Rascunhos"], ["CANCELADO", "Cancelados"]];
  const ROTULO = { PUBLICADO: ["green", "Publicado"], RASCUNHO: ["gray", "Rascunho"], CANCELADO: ["red", "Cancelado"], EM_REVISAO: ["amber", "Em revisão"] };
  const POR_PAGINA = 20;

  function linha(e) {
    const [tom, nome] = ROTULO[e.status];
    const botao = (st, rot) => `<button class="btn-outline text-xs px-2.5 py-1.5" data-action="evento-status" data-id="${e.id}" data-status="${st}">${rot}</button>`;
    const principal = (App.can("approve")
      ? { RASCUNHO: botao("PUBLICADO", "Publicar"), PUBLICADO: botao("CANCELADO", "Cancelar evento"), CANCELADO: botao("PUBLICADO", "Reativar"),
          EM_REVISAO: `<a href="#/admin/revisao" class="btn-outline text-xs px-2.5 py-1.5">Revisar</a>` }
      : { RASCUNHO: botao("EM_REVISAO", "Enviar p/ revisão"), PUBLICADO: botao("CANCELADO", "Cancelar evento") })[e.status] || "";
    const vagas = e.vagas ? `${e.inscritos}/${e.vagas}` : `${e.inscritos} (sem limite)`;
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${e.id}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm">${esc(e.titulo)}</div>
        <div class="text-xs text-slate-400">${esc(e.categoria)} • ${esc(UI.fmtDataHora(e.inicio))} • ${esc(e.local)}</div></td>
      <td>${badge(tom, nome)}${e.encerrado && e.status === "PUBLICADO" ? `<div class="mt-1">${badge("gray", "Encerrado")}</div>` : ""}</td>
      <td class="text-sm text-slate-600 dark:text-slate-300 font-semibold">${esc(vagas)}</td>
      <td><div class="flex items-center gap-1.5 justify-end pr-4 flex-wrap">
        ${principal}
        <button class="act-btn" data-action="evento-inscritos" data-id="${e.id}" data-titulo="${esc(e.titulo)}" title="Ver inscritos">${icon("users", "w-4 h-4")}</button>
        <a href="#/eventos/${e.id}" class="act-btn" title="Ver como colaborador">${icon("eye", "w-4 h-4")}</a>
        <a href="#/admin/eventos/${e.id}/editar" class="act-btn" title="Editar">${icon("edit", "w-4 h-4")}</a>
        ${App.can("delete_forever") ? `<button class="act-btn act-btn-danger" data-action="evento-excluir" data-id="${e.id}" data-alvo="${esc(e.titulo)}" title="Excluir definitivamente" aria-label="Excluir definitivamente ${esc(e.titulo)}">${icon("trash", "w-4 h-4")}</button>` : ""}
      </div></td></tr>`;
  }

  function adminEventos() {
    const estado = { q: "", categoria: "", status: "", page: 1 };

    async function resumo() {
      const box = document.getElementById("ev-stats"), sel = document.getElementById("ev-adm-cat");
      try {
        const r = await Services.eventos.resumo();
        if (!document.getElementById("ev-stats")) return;
        box.innerHTML = [
          AdminUI.statCard("PRÓXIMOS EVENTOS", r.proximos, "publicados e ainda por vir", "calendar"),
          AdminUI.statCard("PUBLICADOS", r.publicados, `${r.total} no total`, "megaphone"),
          AdminUI.statCard("RASCUNHOS", r.rascunhos, `${r.cancelados} cancelados`, "edit"),
          AdminUI.statCard("INSCRIÇÕES", r.inscricoes, "em todos os eventos", "users"),
        ].join("");
        const atual = sel.value;
        sel.innerHTML = `<option value="">Categoria: todas</option>` + r.categorias.map((c) => `<option value="${esc(c.categoria)}">${esc(c.categoria)} (${c.total})</option>`).join("");
        sel.value = r.categorias.some((c) => c.categoria === atual) ? atual : "";
      } catch (_) { if (box) box.innerHTML = ""; }
    }

    async function carregar() {
      const corpo = document.getElementById("ev-rows"), info = document.getElementById("ev-info"), pager = document.getElementById("ev-pager");
      if (!corpo) return;
      try {
        const r = await Services.eventos.list({ page: estado.page, page_size: POR_PAGINA, q: estado.q, categoria: estado.categoria, status: estado.status });
        if (!document.getElementById("ev-rows")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.categoria || estado.status;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="4" class="py-10 text-center text-slate-400">${filtrado ? "Nenhum evento encontrado para este filtro." : "Nenhum evento cadastrado ainda."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1 ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("ev-rows")) corpo.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-slate-400">Não foi possível carregar os eventos. ${esc(err.message || "")}</td></tr>`;
      }
    }

    return {
      title: "Gerenciar Eventos",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciamento de Eventos & Treinamentos</h2></div>
        <a href="#/admin/eventos/novo" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus", "w-4 h-4")} Novo Evento</a>
      </div>
      <div id="ev-stats" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6"></div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="ev-adm">${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}</div>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-56"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
            <input id="ev-busca" placeholder="Buscar título ou local..." maxlength="200" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="ev-adm-cat" class="select-field" aria-label="Filtrar por categoria"><option value="">Categoria: todas</option></select>
        </div>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th class="py-3 pl-4">EVENTO</th><th>STATUS</th><th>INSCRITOS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="ev-rows"><tr><td colspan="4" class="py-10 text-center text-slate-400">Carregando…</td></tr></tbody></table></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3"><span id="ev-info"></span><div class="flex gap-1.5 items-center" id="ev-pager"></div></div>`,
      init() {
        document.querySelectorAll('[data-filter-group="ev-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="ev-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.status = btn.dataset.filter; estado.page = 1; carregar();
        }));
        document.getElementById("ev-adm-cat").addEventListener("change", (e) => { estado.categoria = e.target.value; estado.page = 1; carregar(); });
        let t = 0;
        document.getElementById("ev-busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300); });
        resumo(); carregar();
      },
    };
  }

  // Painel com os inscritos reais do evento. A partir do início, o gestor confirma a presença
  // (evidência de treinamento; turma de tema obrigatório tira a pessoa da lista de pendentes).
  async function inscritosEvento(id, titulo) {
    let lista, evento;
    try { [lista, evento] = await Promise.all([Services.eventos.inscritos(id), Services.eventos.get(id)]); }
    catch (err) { App.toast(err.message || "Não foi possível carregar os inscritos."); return; }
    const comecou = new Date(evento.inicio) <= new Date();
    const presentes = lista.filter((i) => i.presente).length;
    const linhaInscrito = (i) => `<div class="p-3 flex items-center justify-between gap-3"><div class="min-w-0">
        <div class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(i.nome)}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(i.setor || "—")} · ${esc(i.email)}</div></div>
        ${comecou
          ? `<label class="presenca-opt"><input type="checkbox" data-presenca="${i.usuario_id}" ${i.presente ? "checked" : ""}><span>Presente</span></label>`
          : `<span class="text-xs text-slate-500 dark:text-slate-400 shrink-0">${esc(UI.fmtDataHora(i.inscrito_em))}</span>`}</div>`;
    App.openPanel(`Inscritos — ${esc(titulo)}`, lista.length
      ? `<div class="flex items-center justify-between gap-2 flex-wrap mb-3"><div class="text-sm text-slate-500 dark:text-slate-400" id="insc-resumo">${lista.length} ${lista.length === 1 ? "inscrito" : "inscritos"}${comecou ? ` · ${presentes} presente${presentes === 1 ? "" : "s"}` : ""}</div>
           <div class="flex gap-2"><button type="button" class="btn-outline text-xs px-3" data-insc-csv="${id}">${icon("download", "w-3.5 h-3.5")} Exportar CSV</button>
           <button type="button" class="btn-outline text-xs px-3" data-insc-email="${id}">${icon("megaphone", "w-3.5 h-3.5")} Enviar por e-mail</button></div></div>
         ${comecou
           ? `<div class="flex items-center justify-between gap-2 flex-wrap mb-2"><button type="button" class="btn-outline text-xs px-3" data-presenca-todos>${icon("check-check", "w-3.5 h-3.5")} Marcar todos presentes</button>
              <button type="button" class="btn-wine text-xs px-4" data-presenca-salvar>Salvar presença</button></div>`
           : `<p class="text-xs text-slate-500 dark:text-slate-400 mb-2">A presença pode ser confirmada a partir do início do evento (${esc(UI.fmtDataHora(evento.inicio))}).</p>`}
         <div class="card divide-y divide-slate-50 dark:divide-slate-800">${lista.map(linhaInscrito).join("")}</div>`
      : `<div class="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Ninguém se inscreveu ainda.</div>`);
    const painel = document.querySelector("#side-panel .panel-content");
    painel?.querySelector("[data-presenca-todos]")?.addEventListener("click", () => {
      painel.querySelectorAll("[data-presenca]").forEach((c) => { c.checked = true; });
    });
    painel?.querySelector("[data-presenca-salvar]")?.addEventListener("click", async (ev) => {
      const botao = ev.currentTarget; // depois do await, currentTarget já é null
      const caixas = [...painel.querySelectorAll("[data-presenca]")];
      const sim = caixas.filter((c) => c.checked).map((c) => Number(c.dataset.presenca));
      const nao = caixas.filter((c) => !c.checked).map((c) => Number(c.dataset.presenca));
      botao.disabled = true;
      try {
        const nova = await Services.treinamentos.presencas(id, sim, nao);
        const total = nova.filter((i) => i.presente).length;
        const resumo = painel.querySelector("#insc-resumo");
        if (resumo) resumo.textContent = `${nova.length} ${nova.length === 1 ? "inscrito" : "inscritos"} · ${total} presente${total === 1 ? "" : "s"}`;
        App.toast("Presença salva");
      } catch (err) { App.toast(err.message || "Não foi possível salvar a presença."); }
      botao.disabled = false;
    });
    painel?.querySelector("[data-insc-csv]")?.addEventListener("click", async () => {
      try {
        const csv = await Services.eventos.inscritosCsv(id);
        // O BOM faz o Excel reconhecer os acentos (o navegador o remove ao ler o texto).
        App.downloadFile(`inscritos-evento-${id}.csv`, "\ufeff" + String(csv).replace(/^\ufeff/, ""), "text/csv;charset=utf-8");
        App.toast("Lista de inscritos exportada");
      } catch (err) { App.toast(err.message || "Não foi possível exportar."); }
    });
    painel?.querySelector("[data-insc-email]")?.addEventListener("click", async (ev) => {
      const botao = ev.currentTarget;
      botao.disabled = true;
      try { await Services.eventos.enviarInscritos(id); App.toast(`Lista enviada para ${App.state.user.email}`); }
      catch (err) { App.toast(err.message || "Não foi possível enviar o e-mail."); }
      botao.disabled = false;
    });
  }

  Object.assign(PagesAdmin, { adminEventos, inscritosEvento });
})();
