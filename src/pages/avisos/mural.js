/* =========================================================================
   Tela: Mural de Avisos
   Rota: #/avisos
   ========================================================================= */
(function () {
  const { icon, badge, foto, esc, tone, catLabel, CAT_FILTRO } = UI;
  const { wireList } = Lib;

  function avisos() {
    const urgente = DB.avisos.find((a) => a.categoria === "urgente");
    const todos = App.avisosAll();
    const rest = todos.filter((a) => a !== urgente);

    // Alerta urgente "em destaque": a foto ocupa metade do cartão em vez do
    // rótulo de texto puro — usado só para o único item mais crítico do mural,
    // não vira padrão repetido (senão perde a força de ser "o" urgente).
    const urgenteCard = `<a href="#/avisos/${urgente.id}" class="card block overflow-hidden ring-2 ring-red-400/70 dark:ring-red-500/40 aviso-item" data-cat="urgente">
      <div class="urgent-feature">
        <div class="p-6 md:p-7 flex flex-col justify-center order-2 md:order-1">
          <div class="flex items-center gap-2 mb-3 flex-wrap">${badge("red","🔥 URGENTE")} ${badge("blue","COMUNICADO")}</div>
          <h3 class="text-xl font-extrabold text-wine mb-2">${urgente.titulo}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${urgente.resumo}</p>
          <div class="flex gap-2 mb-4 flex-wrap">${urgente.tags.map((t)=>`<span class="tag-outline">${t}</span>`).join("")}</div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(urgente.autor)}${urgente.autorSigla}</span> Publicado por: ${urgente.autor}</span>
            <span class="text-sm font-bold text-wine flex items-center gap-1">${urgente.cta} ${icon("chevron-right","w-4 h-4")}</span>
          </div>
        </div>
        <div class="urgent-feature-photo order-1 md:order-2" style="background-image:url('assets/img/news.png')">
          <span class="absolute top-4 right-4 z-10">${badge("light","AO VIVO")}</span>
          <span class="absolute bottom-4 left-4 z-10 text-white text-xs font-bold flex items-center gap-1">${icon("clock","w-3.5 h-3.5")} ${urgente.data}</span>
        </div>
      </div></a>`;

    const noticia = rest.find((a) => a.categoria === "noticia" && !a.own);
    const noticiaCard = `<a href="#/avisos/${noticia.id}" class="card block p-0 overflow-hidden md:flex aviso-item" data-cat="noticia">
      <div class="md:w-56 h-40 md:h-auto news-photo shrink-0"></div>
      <div class="p-6 flex-1">
        <div class="flex items-center justify-between mb-2"><div>${badge("teal","NOTÍCIA")}</div><span class="text-xs text-slate-400">${noticia.data}</span></div>
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2">${noticia.titulo}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${noticia.resumo}</p>
        <div class="flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(noticia.autor)}${noticia.autorSigla}</span> Publicado por: ${noticia.autor}</span>
        <span class="text-sm font-bold text-wine flex items-center gap-1">${noticia.cta} ${icon("chevron-right","w-4 h-4")}</span></div>
      </div></a>`;

    const outros = rest.filter((a) => a !== noticia).map((a) => `
      <a href="#/avisos/${a.id}" class="card block p-6 aviso-item" data-cat="${a.categoria}">
        <div class="flex items-center justify-between mb-2"><div class="flex gap-2">${badge(tone(a.categoria),catLabel(a.categoria))} ${a.extra?badge("red-soft","★ "+catLabel(a.extra).toUpperCase()):""}</div><span class="text-xs text-slate-400">${a.data}</span></div>
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2">${esc(a.titulo)}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${esc(a.resumo)}</p>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${foto(a.autor)}${a.autorSigla}</span> Publicado por: ${esc(a.autor)}</span>
        <span class="text-sm font-bold text-wine flex items-center gap-1">${a.cta} ${icon("chevron-right","w-4 h-4")}</span></div>
      </a>`).join('<div class="h-4"></div>');

    return {
      title: "Mural de Avisos",
      html: `
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Comunicados e Avisos Oficiais</h2></div>
        <span class="pill-soft">${todos.length} comunicados ativos nesta semana</span>
      </div>
      <div class="flex gap-2 flex-wrap mb-5" data-filter-group="avisos">
        ${["Todos","Comunicado","Promoção","Evento","Urgente"].map((f,i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${f}">${f}</button>`).join("")}
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
          containerId: "avisos-list", itemSel: ".aviso-item", size: 3,
          pagerId: "avisos-pager", infoId: "avisos-info", label: "comunicados",
          filterGroup: "avisos", onEmpty: "Nenhum comunicado nesta categoria.",
          filterFn: (el, f) => { const cat = map[f] || "all"; return cat === "all" || el.dataset.cat === cat; },
        });
      },
    };
  }

  Object.assign(Pages, { avisos });
})();
