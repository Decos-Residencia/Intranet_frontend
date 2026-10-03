/* =========================================================================
   Tela: Criar / Editar Notícia
   Rota: #/admin/noticias/nova · #/admin/noticias/:id/editar
   Persistido no backend (POST/PUT /avisos): título, conteúdo e categoria
   (categoria = tipo, ou "urgente" quando a prioridade é Urgente).
   BACKEND FUTURO (não salvos nem simulados): rascunho, agendamento, imagem
   de destaque e prioridade "Relevante".
   ========================================================================= */
(function () {
  const { badge, breadcrumb, esc } = UI;
  const { opts, TIPOS_NOTICIA } = AdminUI;
  const CATEGORIA_DE_TIPO = { "Comunicado": "comunicado", "Evento": "evento", "Promoção": "promocao", "Notícia": "noticia" };

  function adminNoticiaNova(id) {
    const n = id ? App.findItem("noticias", id) : null;
    if (id && !n) return App.missingPage("Notícia não encontrada", "Esta notícia não existe ou foi removida.", "#/admin/noticias", "Voltar às notícias");
    const prio = n?.prioridade === "urgente" ? "urgente" : "normal";
    const autor = App.state.user.nome;
    return {
      title: n ? "Editar Notícia" : "Criar Notícia",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Notícias",route:"#/admin/noticias"},{label: n ? "Editar" : "Nova notícia"}])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${n ? "Editar Notícia" : "Criar Notícia Institucional"}</h2></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form class="lg:col-span-2 space-y-5" id="form-noticia" data-id="${esc(n?.id || "")}" data-action="prevent">
          <div><label class="field-label" for="nt-titulo">TÍTULO DA NOTÍCIA *</label><input class="field-input" id="nt-titulo" maxlength="140" placeholder="Digite o título da notícia..." value="${esc(n?.titulo || "")}"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="field-label" for="nt-tipo">CATEGORIA</label><select id="nt-tipo" class="field-input">${opts(TIPOS_NOTICIA, n?.tipo || "Comunicado")}</select></div>
          </div>
          <div><label class="field-label">NÍVEL DE PRIORIDADE</label>
            <div class="grid grid-cols-2 gap-3" data-filter-group="prio">
              <button type="button" class="prio-opt ${prio === "normal" ? "prio-active" : ""}" data-filter="normal">✓ Normal</button>
              <button type="button" class="prio-opt prio-danger ${prio === "urgente" ? "prio-active" : ""}" data-filter="urgente">🔥 Urgente</button>
            </div>
          </div>
          <div><label class="field-label" for="nt-corpo">CONTEÚDO DA NOTÍCIA *</label>
            <textarea class="field-input" id="nt-corpo" rows="8" placeholder="Escreva o comunicado. Cada linha em branco separa um parágrafo.">${esc(n?.corpo || "")}</textarea>
            <div class="field-hint" id="nt-contador"></div>
          </div>
          <div class="flex justify-end gap-3 pt-2 flex-wrap">
            <a href="#/admin/noticias" class="btn-outline px-6 py-2.5">Cancelar</a>
            <button type="button" data-action="save-noticia" data-status="Publicado" class="btn-crimson px-6 py-2.5">${n ? "Salvar e publicar" : "Publicar Notícia"}</button>
          </div>
        </form>
        <aside class="space-y-4">
          <div class="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">PRÉVIA EM TEMPO REAL NO MURAL <span class="text-crimson flex items-center gap-1">● Visualização Ativa</span></div>
          <div class="card overflow-hidden ring-1 ring-crimson/30">
            <div class="p-5">
              <div class="flex items-center justify-between mb-2"><div class="flex gap-2" id="pv-badges"></div><span class="text-xs text-slate-400">Hoje, Agora mesmo</span></div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2" id="pv-titulo"></h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-3" id="pv-corpo"></p>
              <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${UI.foto(autor)}${esc(UI.iniciais(autor))}</span> ${esc(autor)}</span><span class="text-sm font-bold text-crimson">Ver completo ›</span></div>
            </div>
          </div>
          <div class="card p-5 ring-1 ring-crimson/20">
            <div class="font-bold text-crimson mb-1">Diretrizes de Publicação Decós</div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Avisos marcados como <b>Urgente</b> aparecem com destaque vermelho no mural e no início de todos os colaboradores.</p>
            <p class="text-xs text-slate-400 mt-3">Rascunho, agendamento, imagem de destaque e prioridade "Relevante" ainda não são salvos pelo servidor (recursos futuros). A notícia é publicada imediatamente.</p>
          </div>
        </aside>
      </div>`,
      init() {
        const $ = (i) => document.getElementById(i);
        const prioAtual = () => document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal";
        const preview = () => {
          $("pv-titulo").textContent = $("nt-titulo").value || "Título da notícia";
          const c = $("nt-corpo").value;
          $("pv-corpo").textContent = c ? (c.length > 150 ? c.slice(0, 150) + "…" : c) : "O texto da notícia aparece aqui.";
          $("pv-badges").innerHTML = (prioAtual() === "urgente" ? badge("red", "🔥 URGENTE") + " " : "") + badge("blue", esc($("nt-tipo").value.toUpperCase()));
          $("nt-contador").textContent = `${c.length} caracteres`;
        };
        document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((x) => x.classList.remove("prio-active"));
          b.classList.add("prio-active"); preview();
        }));
        ["nt-titulo", "nt-corpo", "nt-tipo"].forEach((i) => $(i).addEventListener("input", preview));
        preview();
      },
    };
  }

  async function submitNoticia() {
    const f = document.getElementById("form-noticia");
    if (!f) return;
    const titulo = document.getElementById("nt-titulo").value.trim();
    const corpo = document.getElementById("nt-corpo").value.trim();
    if (titulo.length < 5) { App.toast("Informe um título com pelo menos 5 caracteres"); document.getElementById("nt-titulo").focus(); return; }
    if (corpo.length < 10) { App.toast("Escreva o conteúdo da notícia antes de publicar"); document.getElementById("nt-corpo").focus(); return; }
    const urgente = (document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal") === "urgente";
    const payload = {
      titulo, conteudo: corpo,
      categoria: urgente ? "urgente" : CATEGORIA_DE_TIPO[document.getElementById("nt-tipo").value] || "comunicado",
    };
    const antigo = f.dataset.id ? App.findItem("noticias", f.dataset.id) : null;
    const botoes = document.querySelectorAll('[data-action="save-noticia"]');
    botoes.forEach((b) => { b.disabled = true; });
    try {
      if (antigo?.apiId) await Services.avisos.update(antigo.apiId, payload);
      else await Services.avisos.create(payload);
      App.logAudit(antigo ? "editou" : "publicou", "Notícia: " + titulo, "noticia");
      await App.loadApiData();
      App.toast("Notícia publicada no mural!");
      setTimeout(() => App.go("#/admin/noticias"), 500);
    } finally {
      botoes.forEach((b) => { b.disabled = false; });
    }
  }

  Object.assign(PagesAdmin, { adminNoticiaNova, submitNoticia });
})();
