/* =========================================================================
   Tela: Gerenciar Notícias (ADMIN)
   Rota: #/admin/noticias
   Fonte: GET /avisos (todos os estados; busca, categoria, status e paginação no servidor)
   e GET /avisos/resumo (totais reais). "Leituras" = usuários únicos que abriram o aviso.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const { statCard, statusBadge, prioBadge, TIPOS_NOTICIA } = AdminUI;

  const STATUS = [["", "Todos"], ["PUBLICADO", "Publicados"], ["AGENDADO", "Agendados"], ["RASCUNHO", "Rascunhos"], ["ARQUIVADO", "Arquivados"]];
  const ROTULO = { PUBLICADO: "Publicado", AGENDADO: "Agendado", RASCUNHO: "Rascunho", ARQUIVADO: "Arquivado" };
  const CATEGORIAS = [["", "Categoria: todas"], ["comunicado", "Comunicado"], ["evento", "Evento"], ["promocao", "Promoção"], ["noticia", "Notícia"], ["urgente", "Urgente"]];
  const POR_PAGINA = 20;
  const fmtHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const quando = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : fmtHora.format(d); };

  const rotuloCat = (c) => (DB.categorias[c]?.label || c);

  function linha(a) {
    const urgente = a.categoria === "urgente";
    const datas = a.status === "AGENDADO" ? `Publica em ${quando(a.publicar_em)}`
      : a.status === "PUBLICADO" ? `Publicado em ${quando(a.data_publicacao)}`
      : a.status === "ARQUIVADO" ? `Criado em ${quando(a.criado_em)}` : `Criado em ${quando(a.criado_em)}`;
    const autor = App.nomeDoUsuario(a.autor_id) || "—";
    const btn = (acao, rotulo, extra = "") => `<button class="btn-outline text-xs px-2.5 py-1.5" data-action="aviso-status" data-id="${a.id}" data-status="${acao}" ${extra}>${rotulo}</button>`;
    const principais = {
      PUBLICADO: btn("ARQUIVADO", "Arquivar"),
      AGENDADO: btn("PUBLICADO", "Publicar agora") + btn("RASCUNHO", "Cancelar agend."),
      RASCUNHO: btn("PUBLICADO", "Publicar"),
      ARQUIVADO: btn("PUBLICADO", "Republicar"),
    }[a.status];
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40" data-id="${a.id}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs">${esc(a.titulo)}</div>
        <div class="text-xs text-slate-400">${esc(rotuloCat(a.categoria))} • ${esc(datas)}</div></td>
      <td class="text-sm text-slate-500 dark:text-slate-400">${esc(autor)}</td>
      <td>${statusBadge(ROTULO[a.status])}${a.status === "AGENDADO" ? `<div class="text-[11px] text-slate-400 mt-1">${esc(quando(a.publicar_em))}</div>` : ""}</td>
      <td>${prioBadge(urgente ? "urgente" : "normal")}</td>
      <td class="text-sm font-semibold text-slate-600 dark:text-slate-300" title="Usuários únicos que abriram o aviso">${a.leituras ?? 0}</td>
      <td><div class="flex items-center gap-1.5 justify-end pr-4 flex-wrap">
        ${principais}
        <button class="act-btn" data-action="preview-noticia" data-id="${a.id}" title="Visualizar">${icon("eye", "w-4 h-4")}</button>
        <a href="#/admin/noticias/${a.id}/editar" class="act-btn" title="Editar">${icon("edit", "w-4 h-4")}</a>
        <button class="act-btn act-btn-danger" data-action="delete-aviso" data-id="${a.id}" data-alvo="${esc(a.titulo)}" title="Excluir">${icon("trash", "w-4 h-4")}</button>
      </div></td>
    </tr>`;
  }

  function adminNoticias() {
    const estado = { q: "", categoria: "", status: "", page: 1 };

    async function carregarResumo() {
      const box = document.getElementById("not-stats");
      try {
        const r = await Services.avisos.resumo();
        if (!document.getElementById("not-stats")) return;
        box.innerHTML = [
          statCard("PUBLICADOS", r.publicados, `${r.total} no total`, "megaphone"),
          statCard("AGENDADOS", r.agendados, "aguardando o horário", "clock"),
          statCard("RASCUNHOS", r.rascunhos, `${r.arquivados} arquivados`, "edit"),
          statCard("ALERTAS CRÍTICOS", String(r.urgentes_publicados).padStart(2, "0"), r.urgentes_publicados ? "Urgentes no mural" : "Nenhum ativo", "alert-triangle", r.urgentes_publicados > 0),
          statCard("LEITURAS", r.leituras, "usuários únicos por aviso, somados", "eye"),
        ].join("");
      } catch (_) { if (box) box.innerHTML = ""; }
    }

    async function carregar() {
      const corpo = document.getElementById("not-rows"), info = document.getElementById("not-info"), pager = document.getElementById("not-pager");
      if (!corpo) return;
      try {
        const r = await Services.avisos.list({ page: estado.page, page_size: POR_PAGINA, q: estado.q, categoria: estado.categoria, status: estado.status });
        if (!document.getElementById("not-rows")) return;
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.q || estado.categoria || estado.status;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="6" class="py-10 text-center text-slate-400">${filtrado ? "Nenhum aviso encontrado para este filtro." : "Nenhum aviso cadastrado ainda."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1
          ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("not-rows")) corpo.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-400">Não foi possível carregar os avisos. ${esc(err.message || "")}</td></tr>`;
      }
    }

    return {
      title: "Painel de Notícias",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Gerenciamento de Comunicados & Notícias</h2></div>
        <a href="#/admin/noticias/nova" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus", "w-4 h-4")} Criar Notícia</a>
      </div>
      <div id="not-stats" class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"></div>
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div class="flex gap-2 flex-wrap" data-filter-group="not-adm">
          ${STATUS.map(([k, l], i) => `<button class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${k}">${l}</button>`).join("")}
        </div>
        <div class="flex gap-2 items-center flex-wrap">
          <div class="search-box w-60"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
            <input id="not-busca" placeholder="Buscar título ou conteúdo..." maxlength="200" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
          <select id="not-cat" class="select-field">${CATEGORIAS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>
        </div>
      </div>
      <div class="card overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <th class="py-3 pl-4">NOTÍCIA</th><th>AUTOR</th><th>STATUS</th><th>PRIORIDADE</th><th>LEITURAS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
          <tbody id="not-rows"><tr><td colspan="6" class="py-10 text-center text-slate-400">Carregando…</td></tr></tbody>
        </table>
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
        <span id="not-info"></span><div class="flex gap-1.5 items-center" id="not-pager"></div>
      </div>`,
      init() {
        document.querySelectorAll('[data-filter-group="not-adm"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="not-adm"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.status = btn.dataset.filter; estado.page = 1; carregar();
        }));
        document.getElementById("not-cat").addEventListener("change", (e) => { estado.categoria = e.target.value; estado.page = 1; carregar(); });
        let t = 0;
        document.getElementById("not-busca").addEventListener("input", (e) => {
          clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); estado.page = 1; carregar(); }, 300);
        });
        carregarResumo(); carregar();
      },
    };
  }

  async function previewNoticia(id) {
    let n;
    try { n = await Services.avisos.get(id); } catch (err) { App.toast(err.message || "Aviso não encontrado."); return; }
    const noMural = n.status === "PUBLICADO";
    const datas = n.status === "AGENDADO" ? `Publica em ${quando(n.publicar_em)}` : n.data_publicacao ? `Publicado em ${quando(n.data_publicacao)}` : `Criado em ${quando(n.criado_em)}`;
    App.openPanel("Pré-visualização", `
      <div class="flex gap-2 flex-wrap mb-3">${statusBadge(ROTULO[n.status])} ${prioBadge(n.categoria === "urgente" ? "urgente" : "normal")} ${badge("blue", esc(rotuloCat(n.categoria)).toUpperCase())}</div>
      <h3 class="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-2">${esc(n.titulo)}</h3>
      <div class="text-xs text-slate-400 mb-1">${esc(App.nomeDoUsuario(n.autor_id) || "—")} • ${esc(datas)}</div>
      <div class="text-xs text-slate-400 mb-4">Leituras (usuários únicos): <b>${n.leituras ?? 0}</b></div>
      <div class="prose-decos space-y-3 text-sm">${(n.conteudo || "Sem conteúdo cadastrado.").split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <div class="flex gap-2 mt-6">
        <a href="#/admin/noticias/${n.id}/editar" class="btn-crimson flex-1 py-2.5 text-center">Editar</a>
        ${noMural ? `<a href="#/avisos/${n.id}" class="btn-outline flex-1 py-2.5 text-center">Ver no mural</a>` : ""}
      </div>`);
  }

  Object.assign(PagesAdmin, { adminNoticias, previewNoticia });
})();
