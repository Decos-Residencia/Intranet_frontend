/* =========================================================================
   Tela: Gerenciar FAQ (somente ADMIN)
   Rota: #/admin/faqs
   Fonte: GET /faqs (busca, categoria, status e paginação no servidor) e GET /faqs/resumo
   (totais reais). Ativar/desativar = PUT {ativo}; excluir = DELETE (definitivo).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const STATUS = [["", "Todas"], ["true", "Ativas"], ["false", "Inativas"]];
  const POR_PAGINA = 20;
  const trecho = (t, n) => { const s = String(t || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

  function linha(f) {
    return `<div class="card p-5 faq-adm-row ${f.ativo ? "" : "opacity-70"}" data-id="${f.id}">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="font-bold text-slate-800 dark:text-slate-100">${esc(f.pergunta)}</span>
            ${badge("blue", esc(f.categoria))} ${f.ativo ? badge("green", "Ativa") : badge("gray", "Inativa")}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400">${esc(trecho(f.resposta, 220))}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button class="act-btn" data-action="edit-faq" data-id="${f.id}" title="Editar">${icon("edit", "w-4 h-4")}</button>
          <button class="btn-outline text-xs px-3 py-1.5" data-action="toggle-faq" data-id="${f.id}" data-ativo="${f.ativo ? "false" : "true"}">${f.ativo ? "Desativar" : "Ativar"}</button>
          <button class="act-btn act-btn-danger" data-action="delete-faq" data-id="${f.id}" data-pergunta="${esc(trecho(f.pergunta, 80))}" title="Excluir definitivamente">${icon("trash", "w-4 h-4")}</button>
        </div>
      </div>
    </div>`;
  }

  function adminFaqs() {
    const estado = { q: "", categoria: "", ativo: "", page: 1 };

    async function carregarResumo() {
      const box = document.getElementById("faq-stats"), sel = document.getElementById("faq-adm-cat");
      try {
        const r = await Services.faq.resumo();
        if (!document.getElementById("faq-stats")) return;
        const card = (n, l) => `<div class="card p-4 text-center"><div class="text-2xl font-extrabold text-wine">${n}</div><div class="text-xs text-slate-500 dark:text-slate-400">${l}</div></div>`;
        box.innerHTML = card(r.total, "Total de perguntas") + card(r.ativas, "Ativas") + card(r.inativas, "Inativas") + card(r.categorias.length, "Categorias");
        const atual = sel.value;
        sel.innerHTML = `<option value="">Categoria: todas</option>` + r.categorias.map((c) => `<option value="${esc(c.categoria)}">${esc(c.categoria)} (${c.total})</option>`).join("");
        sel.value = r.categorias.some((c) => c.categoria === atual) ? atual : "";
      } catch (err) { if (box) box.innerHTML = ""; }
    }

    async function carregar() {
      const lista = document.getElementById("faq-adm-list"), info = document.getElementById("faq-adm-info"), pager = document.getElementById("faq-adm-pager");
      if (!lista) return;
      try {
        const r = await Services.faq.list({ page: estado.page, page_size: POR_PAGINA, q: estado.q, categoria: estado.categoria, ativo: estado.ativo });
        if (!document.getElementById("faq-adm-list")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.categoria || estado.ativo;
        lista.innerHTML = r.items.length ? `<div class="space-y-3">${r.items.map(linha).join("")}</div>`
          : `<div class="card p-10 text-center text-slate-400">${filtrado ? "Nenhuma pergunta encontrada para este filtro." : "Nenhuma pergunta cadastrada ainda."}</div>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1
          ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("faq-adm-list")) lista.innerHTML = `<div class="card p-10 text-center text-slate-400">Não foi possível carregar as perguntas. ${esc(err.message || "")}</div>`;
      }
    }

    return {
      title: "Gerenciar FAQ",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciar FAQ</h2></div>
        <button data-action="open-faq-nova" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus", "w-4 h-4")} Nova pergunta</button>
      </div>
      <div id="faq-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5"></div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="faq-adm">
          ${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}
        </div>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-60"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
            <input id="faq-adm-busca" placeholder="Buscar pergunta ou resposta..." maxlength="200" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="faq-adm-cat" class="select-field"><option value="">Categoria: todas</option></select>
        </div>
      </div>
      <div id="faq-adm-list"><div class="card p-10 text-center text-slate-400">Carregando…</div></div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="faq-adm-info"></span><div class="flex gap-1.5 items-center" id="faq-adm-pager"></div>
      </div>`,
      init() {
        document.querySelectorAll('[data-filter-group="faq-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="faq-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.ativo = btn.dataset.filter; estado.page = 1; carregar();
        }));
        document.getElementById("faq-adm-cat").addEventListener("change", (e) => { estado.categoria = e.target.value; estado.page = 1; carregar(); });
        let t = 0;
        document.getElementById("faq-adm-busca").addEventListener("input", (e) => {
          clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300);
        });
        carregarResumo(); carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminFaqs });
})();
