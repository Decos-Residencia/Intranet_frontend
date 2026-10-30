/* =========================================================================
   Tela: Gerenciar Documentos (ADMIN)
   Rota: #/admin/documentos
   Fonte: GET /documentos (busca, categoria, setor, status e paginação no servidor) e GET /documentos/resumo
   (totais reais). Os arquivos ficam no Supabase Storage privado; ver/baixar usa URL assinada de 60 s.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const { statCard } = AdminUI;

  const STATUS = [["", "Todos"], ["true", "Ativos"], ["false", "Inativos"]];
  const POR_PAGINA = 20;
  const fmtHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const quando = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : fmtHora.format(d); };
  const bytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);
  const ext = (nome) => (String(nome).split(".").pop() || "").toLowerCase();

  // Validade (revisão do POP): o texto diz o prazo; a cor só reforça.
  function diasAte(iso) {
    const [a, m, dd] = iso.split("-").map(Number);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    return Math.round((new Date(a, m - 1, dd) - hoje) / 86400000);
  }
  function seloValidade(iso, dias = diasAte(iso)) {
    if (dias <= 0) return badge("red", dias === 0 ? "Revisão vence hoje" : `Revisão vencida há ${-dias} ${dias === -1 ? "dia" : "dias"}`);
    if (dias <= 30) return badge("amber", `Revisar em ${dias} ${dias === 1 ? "dia" : "dias"}`);
    return badge("gray", `Revisar até ${iso.split("-").reverse().join("/")}`);
  }

  async function carregarValidades() {
    const box = document.getElementById("doc-validades");
    if (!box) return;
    try {
      const itens = await Services.documentos.validades(60);
      if (!document.contains(box)) return;
      if (!itens.length) { box.innerHTML = ""; return; }
      box.innerHTML = `<section class="card p-5 mb-6" aria-labelledby="doc-validades-h">
        <h3 id="doc-validades-h" class="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">${icon("clock", "w-5 h-5 text-wine")} Revisões a vencer</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Vencidas e as que vencem nos próximos 60 dias. O responsável recebe alerta faltando 30 e 7 dias e no vencimento.</p>
        <ul class="space-y-2">${itens.map((d) => `<li class="flex items-center gap-3 flex-wrap">
          ${seloValidade(d.revisar_em, d.dias_restantes)}
          <a href="#/admin/documentos/${d.id}/editar" class="font-semibold text-slate-800 dark:text-slate-100 hover:underline min-w-0 truncate">${esc(d.titulo)}</a>
          <span class="text-xs text-slate-500 dark:text-slate-400">${esc(d.categoria)} · v${esc(d.versao)} · responsável: ${esc(d.responsavel || "quem gerencia documentos")}</span></li>`).join("")}</ul></section>`;
    } catch (_) { box.innerHTML = ""; }
  }

  function linha(d) {
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${d.ativo ? "" : "opacity-70"}" data-id="${d.id}">
      <td class="py-3.5 pl-4"><div class="flex items-center gap-2 mb-1 flex-wrap">${badge("blue", esc(d.categoria))}${d.vigente ? "" : badge("gray", "Sem versão vigente")}<span class="text-xs text-slate-500 dark:text-slate-400">v${esc(d.versao)}${d.total_versoes > 1 ? ` (${d.total_versoes} versões)` : ""} • atualizado em ${esc(quando(d.atualizado_em))}</span>${d.revisar_em ? seloValidade(d.revisar_em) : ""}</div>
        <div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-sm">${esc(d.titulo)}</div>
        <div class="text-xs text-slate-400 truncate max-w-sm">${esc(d.arquivo_nome)}</div></td>
      <td class="text-sm text-slate-500 dark:text-slate-400">${esc(d.enviado_por || "—")}</td>
      <td>${d.ativo ? badge("green", "Ativo") : badge("gray", "Inativo")}</td>
      <td class="text-sm text-slate-500 dark:text-slate-400">${d.setor ? `${icon("lock", "w-3.5 h-3.5 inline -mt-0.5")} ${esc(d.setor)}` : "Geral"}</td>
      <td class="text-sm text-slate-500 dark:text-slate-400">${esc(ext(d.arquivo_nome).toUpperCase())} · ${esc(bytes(d.tamanho_bytes))}</td>
      <td><div class="flex items-center gap-1.5 justify-end pr-4 flex-wrap">
        <button class="btn-outline text-xs px-2.5 py-1.5" data-action="toggle-doc" data-id="${d.id}" data-ativo="${d.ativo ? "false" : "true"}">${d.ativo ? "Desativar" : "Ativar"}</button>
        <button class="act-btn" data-action="open-doc-url" data-id="${d.id}" title="Abrir arquivo">${icon("eye", "w-4 h-4")}</button>
        <button class="act-btn" data-action="download-doc" data-id="${d.id}" title="Baixar">${icon("download", "w-4 h-4")}</button>
        <a href="#/admin/documentos/${d.id}/editar" class="act-btn" title="Editar / substituir arquivo">${icon("edit", "w-4 h-4")}</a>
        ${App.can("delete_forever") ? `<button class="act-btn act-btn-danger" data-action="delete-doc" data-id="${d.id}" data-alvo="${esc(d.titulo)}" title="Excluir definitivamente" aria-label="Excluir definitivamente ${esc(d.titulo)}">${icon("trash", "w-4 h-4")}</button>` : ""}
      </div></td>
    </tr>`;
  }

  function adminDocumentos() {
    const estado = { q: "", categoria: "", setor_id: "", ativo: "", page: 1 };

    async function carregarResumo() {
      const box = document.getElementById("doc-stats"), sel = document.getElementById("doc-cat");
      try {
        const r = await Services.documentos.resumo();
        if (!document.getElementById("doc-stats")) return;
        box.innerHTML = [
          statCard("DOCUMENTOS", r.total, `${r.ativos} ativos • ${r.inativos} inativos`, "file-text"),
          statCard("RESTRITOS A SETOR", r.restritos, `${r.total - r.restritos} gerais`, "lock"),
          statCard("CATEGORIAS", r.categorias.length, "em uso", "trending-up"),
          statCard("ESPAÇO NO STORAGE", bytes(r.tamanho_total_bytes), "soma dos arquivos", "download"),
        ].join("");
        const atual = sel.value;
        sel.innerHTML = `<option value="">Categoria: todas</option>` + r.categorias.map((c) => `<option value="${esc(c.categoria)}">${esc(c.categoria)} (${c.total})</option>`).join("");
        sel.value = r.categorias.some((c) => c.categoria === atual) ? atual : "";
      } catch (_) { if (box) box.innerHTML = ""; }
    }

    async function carregar() {
      const corpo = document.getElementById("doc-rows"), info = document.getElementById("doc-info"), pager = document.getElementById("doc-pager");
      if (!corpo) return;
      try {
        // O gestor vê também os documentos que só têm versões antigas.
        const r = await Services.documentos.list({ page: estado.page, page_size: POR_PAGINA, q: estado.q, categoria: estado.categoria, setor_id: estado.setor_id, ativo: estado.ativo, incluir_antigas: true });
        if (!document.getElementById("doc-rows")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.categoria || estado.setor_id || estado.ativo;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="6" class="py-10 text-center text-slate-400">${filtrado ? "Nenhum documento encontrado para este filtro." : "Nenhum documento cadastrado ainda."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1
          ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("doc-rows")) corpo.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400">Não foi possível carregar os documentos. ${esc(err.message || "")}</td></tr>`;
      }
    }

    const setores = App.setoresAll();
    return {
      title: "Central de Documentos & POPs",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciamento de Documentos & POPs</h2></div>
        <div class="flex gap-2 flex-wrap">
          <a href="#/documentos" class="btn-outline px-5 py-2.5 flex items-center gap-2">${icon("eye", "w-4 h-4")} Ver central</a>
          <a href="#/admin/documentos/novo" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus", "w-4 h-4")} Adicionar Documento</a>
        </div>
      </div>
      <div id="doc-stats" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6"></div>
      <div id="doc-validades"></div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="doc-adm">
          ${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}
        </div>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-56"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
            <input id="doc-busca" placeholder="Buscar título, arquivo..." maxlength="200" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="doc-cat" class="select-field" aria-label="Filtrar por categoria"><option value="">Categoria: todas</option></select>
          <select id="doc-setor" class="select-field" aria-label="Filtrar por setor"><option value="">Setor: todos</option>${setores.map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("")}</select>
        </div>
      </div>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <th class="py-3 pl-4">DOCUMENTO</th><th>ENVIADO POR</th><th>STATUS</th><th>ACESSO</th><th>ARQUIVO</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
          <tbody id="doc-rows"><tr><td colspan="6" class="py-10 text-center text-slate-400">Carregando…</td></tr></tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="doc-info"></span><div class="flex gap-1.5 items-center" id="doc-pager"></div>
      </div>`,
      init() {
        document.querySelectorAll('[data-filter-group="doc-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="doc-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.ativo = btn.dataset.filter; estado.page = 1; carregar();
        }));
        document.getElementById("doc-cat").addEventListener("change", (e) => { estado.categoria = e.target.value; estado.page = 1; carregar(); });
        document.getElementById("doc-setor").addEventListener("change", (e) => { estado.setor_id = e.target.value; estado.page = 1; carregar(); });
        let t = 0;
        document.getElementById("doc-busca").addEventListener("input", (e) => {
          clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300);
        });
        carregarResumo(); carregarValidades(); carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminDocumentos });
})();
