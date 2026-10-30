/* =========================================================================
   Tela: Mural de Avisos
   Rota: #/avisos
   ========================================================================= */
(function () {
  const { icon, badge, foto, esc, tone, catLabel, CAT_FILTRO } = UI;
  const { wireList } = Lib;

  function avisos() {
    // Em destaque primeiro; os de prazo vencido continuam no histórico, abaixo e com selo.
    const lista = App.avisosAll();
    const todos = [...lista.filter((a) => a.emDestaque), ...lista.filter((a) => !a.emDestaque)];
    const urgente = todos.find((a) => a.categoria === "urgente" && a.emDestaque);
    const rest = todos.filter((a) => a !== urgente);
    const foraDestaque = (a) => a.emDestaque ? "" : badge("gray", "Fora do destaque");

    // Alerta urgente em destaque: só o que o aviso tem de verdade (título, texto, autor, data).
    // Avisos não têm foto no cadastro, então o lado visual é um painel da marca, sem imagem fixa.
    const urgenteCard = urgente ? `<a href="#/avisos/${urgente.id}" class="card block overflow-hidden ring-2 ring-red-400/70 dark:ring-red-500/40 aviso-item" data-cat="urgente">
      <div class="urgent-feature">
        <div class="p-6 md:p-7 flex flex-col justify-center order-2 md:order-1">
          <div class="flex items-center gap-2 mb-3 flex-wrap">${badge("red","🔥 URGENTE")} ${UI.estadoLeitura(urgente.lido)}</div>
          <h3 class="text-xl font-extrabold text-wine mb-2">${esc(urgente.titulo)}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${esc(urgente.resumo)}</p>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(urgente.autor)}${esc(urgente.autorSigla)}</span> Publicado por: ${esc(urgente.autor)}</span>
            <span class="text-sm font-bold text-wine flex items-center gap-1">${esc(urgente.cta)} ${icon("chevron-right","w-4 h-4")}</span>
          </div>
        </div>
        <div class="urgent-feature-marca order-1 md:order-2" aria-hidden="true">
          ${icon("alert-triangle", "w-16 h-16")}
          <span class="text-sm font-bold flex items-center gap-1">${icon("clock","w-4 h-4")} ${esc(urgente.data)}</span>
        </div>
      </div></a>` : "";

    // Notícia em destaque: a mais recente em destaque (sem foto: avisos não têm imagem no cadastro).
    const noticia = rest.find((a) => a.categoria === "noticia" && a.emDestaque);
    const noticiaCard = noticia ? `<a href="#/avisos/${noticia.id}" class="card block p-6 aviso-item noticia-destaque abre-mouse" data-cat="noticia" style="--abre-altura:4.4em">
        <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2">${badge("teal","NOTÍCIA EM DESTAQUE")} ${UI.estadoLeitura(noticia.lido)}</div><span class="text-xs text-slate-500 dark:text-slate-400">${esc(noticia.data)}</span></div>
        <h3 class="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-2">${esc(noticia.titulo)}</h3>
        <p class="abre-texto text-sm text-slate-600 dark:text-slate-300 mb-3 whitespace-pre-line">${esc((noticia.conteudo || [noticia.resumo]).join("\n\n"))}</p>
        <div class="flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(noticia.autor)}${esc(noticia.autorSigla)}</span> Publicado por: ${esc(noticia.autor)}</span>
        <span class="text-sm font-bold text-wine flex items-center gap-1">${noticia.cta} ${icon("chevron-right","w-4 h-4")}</span></div>
      </a>` : "";

    const outros = rest.filter((a) => a !== noticia).map((a) => `
      <a href="#/avisos/${a.id}" class="card block p-6 aviso-item abre-mouse" data-cat="${a.categoria}" style="--abre-altura:4.4em">
        <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2 flex-wrap">${badge(tone(a.categoria),catLabel(a.categoria))} ${a.extra?badge("red-soft","★ "+catLabel(a.extra).toUpperCase()):""} ${UI.estadoLeitura(a.lido)} ${foraDestaque(a)}</div><span class="text-xs text-slate-400">${esc(a.data)}</span></div>
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2">${esc(a.titulo)}</h3>
        <p class="abre-texto text-sm text-slate-500 dark:text-slate-400 mb-3 whitespace-pre-line">${esc((a.conteudo || [a.resumo]).join("\n\n"))}</p>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(a.autor)}${esc(a.autorSigla)}</span> Publicado por: ${esc(a.autor)}</span>
        <span class="text-sm font-bold text-wine flex items-center gap-1">${a.cta} ${icon("chevron-right","w-4 h-4")}</span></div>
      </a>`).join('<div class="h-4"></div>');

    return {
      title: "Mural de Avisos",
      html: `
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Comunicados e Avisos Oficiais</h2></div>
        <span class="pill-soft">${todos.length} ${todos.length === 1 ? "comunicado publicado" : "comunicados publicados"}</span>
      </div>
      <div class="flex gap-2 flex-wrap mb-5" data-filter-group="avisos">
        ${Object.keys(CAT_FILTRO).map((f,i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${f}">${f}</button>`).join("")}
      </div>
      <div class="space-y-4" id="avisos-list">
        ${urgenteCard}${noticiaCard}${outros}
      </div>
      <div class="flex items-center justify-between text-sm text-slate-400 mt-6 flex-wrap gap-3">
        <span id="avisos-info">Exibindo comunicados</span>
        <div class="flex gap-1.5" id="avisos-pager"></div>
      </div>`,
      init() {
        const map = CAT_FILTRO;
        wireList({
          containerId: "avisos-list", itemSel: ".aviso-item", size: 6,
          pagerId: "avisos-pager", infoId: "avisos-info", label: "comunicados",
          filterGroup: "avisos", onEmpty: todos.length ? "Nenhum comunicado nesta categoria." : "Nenhum aviso encontrado.",
          filterFn: (el, f) => { const cat = map[f] || "all"; return cat === "all" || el.dataset.cat === cat; },
        });
      },
    };
  }

  Object.assign(Pages, { avisos });
})();
