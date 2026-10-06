/* =========================================================================
   Tela: Início (Dashboard)
   Rota: #/dashboard
   ========================================================================= */
(function () {
  const { icon, badge, iniciais, foto, esc, tone, catLabel, CAT_FILTRO } = UI;
  const { wireList, wireQuickAccess, wireCarousel } = Lib;

  function avisoCard(a) {
    return `<a href="#/avisos/${a.id}" class="card block p-6 hover:shadow-md transition-shadow group dash-aviso" data-cat="${a.categoria}">
      <div class="flex items-center justify-between mb-3">
        <div class="flex gap-2">${badge(tone(a.categoria), catLabel(a.categoria))}</div>
        <span class="text-xs text-slate-400">${esc(a.dataCurta)}</span>
      </div>
      <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-wine transition-colors">${esc(a.titulo)}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">${esc(a.resumo)}</p>
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span class="avatar-mini">${foto(a.autor)}${esc(a.autorSigla)}</span> Publicado por: ${esc(a.autor)}
        </span>
        <span class="text-sm font-bold text-wine flex items-center gap-1">${esc(a.cta)} ${icon("chevron-right","w-4 h-4")}</span>
      </div>
    </a>`;
  }

  // ---------- números reais (GET /dashboard/resumo): carregando, erro ou valores do banco ----------
  const num = (n) => Number(n).toLocaleString("pt-BR");
  function cartaoNumero(rot, valor, sub, rota, tom) {
    const abre = rota === "notif" ? `<button type="button" data-notif-card class="card p-4 hover:shadow-md transition-shadow block text-left w-full" data-stat="${esc(rot)}">` : `<a href="${rota}" class="card p-4 hover:shadow-md transition-shadow block" data-stat="${esc(rot)}">`;
    return `${abre}
      <div class="text-xs font-bold text-slate-500 dark:text-slate-400">${esc(rot)}</div>
      <div class="text-3xl font-extrabold ${tom === "alerta" ? "text-wine" : "text-slate-800 dark:text-slate-100"} mt-1">${valor === null ? `<span class="animate-pulse text-slate-300">…</span>` : esc(num(valor))}</div>
      <div class="text-xs text-slate-400 mt-0.5">${esc(sub)}</div>${rota === "notif" ? "</button>" : "</a>"}`;
  }
  function cartoes(r) {
    const p = r ? r.pessoal : null, a = r ? r.admin : null, v = (f) => (r ? f() : null);
    const pessoais = [
      cartaoNumero("COMUNICADOS PUBLICADOS", v(() => p.avisos_publicados), "no mural", "#/avisos"),
      cartaoNumero("PRÓXIMOS EVENTOS", v(() => p.eventos_proximos), r ? `${p.minhas_inscricoes} inscrições suas` : "", "#/eventos"),
      cartaoNumero("DOCUMENTOS DISPONÍVEIS", v(() => p.documentos_disponiveis), "que você pode acessar", "#/documentos"),
      cartaoNumero("MINHAS AVALIAÇÕES", v(() => p.avaliacoes_pendentes), "pendentes", "#/avaliacoes", r && p.avaliacoes_pendentes ? "alerta" : ""),
      cartaoNumero("MEUS CHAMADOS", v(() => p.chamados_abertos), "em aberto", "#/perfil"),
      cartaoNumero("NOTIFICAÇÕES", v(() => p.notificacoes_nao_lidas), "não lidas", "notif", r && p.notificacoes_nao_lidas ? "alerta" : ""),
    ];
    const admin = !r || a ? [
      cartaoNumero("USUÁRIOS ATIVOS", v(() => a.usuarios_ativos), r ? `${a.usuarios_inativos} inativos · ${a.setores} setores` : "", "#/admin/usuarios"),
      cartaoNumero("CHAMADOS EM ABERTO", v(() => a.chamados.abertos + a.chamados.em_analise), r ? `${a.chamados.alta_prioridade_pendentes} de alta prioridade` : "", "#/admin/chamados", r && a.chamados.alta_prioridade_pendentes ? "alerta" : ""),
      cartaoNumero("AVALIAÇÕES PENDENTES", v(() => a.avaliacoes.pendentes + a.avaliacoes.em_analise), r ? `${a.avaliacoes.aprovadas + a.avaliacoes.rejeitadas} concluídas` : "", "#/admin/avaliacoes"),
      cartaoNumero("SOLICITAÇÕES CADASTRAIS", v(() => a.solicitacoes_pendentes), "aguardando análise", "#/admin/solicitacoes", r && a.solicitacoes_pendentes ? "alerta" : ""),
      cartaoNumero("AVISOS", v(() => a.avisos.publicados), r ? `${a.avisos.agendados} agendados · ${a.avisos.rascunhos} rascunhos · ${num(a.avisos.leituras)} leituras` : "", "#/admin/noticias"),
      cartaoNumero("INSCRIÇÕES EM EVENTOS", v(() => a.eventos.inscricoes), r ? `${a.eventos.proximos} eventos próximos` : "", "#/admin/eventos"),
    ] : [];
    return { pessoais: pessoais.join(""), admin: admin.join("") };
  }
  async function carregarNumeros() {
    const box = document.getElementById("dash-stats"); if (!box) return;
    const souAdmin = App.can("manage_users");
    const pinta = (r) => {
      const c = cartoes(r);
      box.setAttribute("aria-busy", r ? "false" : "true");
      box.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">${c.pessoais}</div>${souAdmin ? `<div class="text-xs font-bold text-slate-400 mt-4 mb-2">VISÃO ADMINISTRATIVA</div><div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">${c.admin}</div>` : ""}`;
    };
    if (!box.dataset.wired) { box.dataset.wired = "1"; box.addEventListener("click", (e) => { if (e.target.closest("[data-notif-card]")) App.openNotifPanel(); }); }
    pinta(null);
    try { const r = await Services.dashboard.resumo(); if (document.getElementById("dash-stats")) pinta(r); }
    catch (err) {
      if (!document.getElementById("dash-stats")) return;
      box.setAttribute("aria-busy", "false");
      box.innerHTML = `<div class="card p-4 flex items-center justify-between gap-3 flex-wrap"><span class="text-sm text-slate-500">Não foi possível carregar os números do painel. ${esc(err.message || "")}</span><button class="btn-outline text-xs px-3 py-1.5" id="dash-retry">Tentar novamente</button></div>`;
      document.getElementById("dash-retry").addEventListener("click", carregarNumeros);
    }
  }

  function dashboard() {
    const u = App.state.user;
    const souAniversariante = App.souAniversariante();
    const todosAvisos = App.avisosAll();
    const avisos = todosAvisos.map((a) => `<div class="dash-aviso-wrap" data-cat="${a.categoria}">${avisoCard(a)}</div>`).join("");
    const proximos = App.eventosProximos();
    const eventos = proximos.slice(0, 4).map((e) => `
      <a href="#/eventos/${e.id}" class="flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
        <div class="date-chip"><span class="date-chip-month">${e.mes}</span><span class="date-chip-day">${e.dia}</span></div>
        <div class="min-w-0"><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${esc(e.titulo.split(" - ")[0])}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(e.desc.length > 44 ? e.desc.slice(0, 44) + "..." : e.desc)}</div></div>
      </a>`).join("") || `<div class="text-sm text-slate-400 p-3">Nenhum evento programado.</div>`;
    const hojeRef = App.hoje();
    const mesNome = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, hojeRef.mes - 1, 1));
    const mesRotulo = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
    const doMes = App.aniversariantesAll().filter((p) => p.mes === hojeRef.mes).sort((a, b) => a.dia - b.dia).slice(0, 8);
    const aniversarios = (doMes.length ? doMes : []).map((p) => `
      <div class="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
        <div class="avatar-soft w-9 h-9 text-xs rounded-full flex items-center justify-center shrink-0">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="flex-1 min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(p.nome)}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(p.setor)}</div></div>
        <span class="birthday-pill">dia ${p.dia}</span>
      </div>`).join("") || `<div class="text-sm text-slate-400 py-3">Nenhum aniversariante neste mês.</div>`;

    const urgente = todosAvisos.find((a) => a.categoria === "urgente");
    const proxEvento = proximos[0];
    // 3 slides: a promoção de sempre, o aviso mais urgente do momento, e um
    // destaque leve (próximo evento) — "outras besteiras" que merecem um
    // segundo de atenção sem competir com o conteúdo principal da página.
    const slides = [
      { photo: "doctor", pos: "50% 12%", badge: "DOCUMENTOS & POPS", titulo: "Central de documentos e protocolos",
        texto: "Consulte os POPs, manuais e formulários vigentes em um só lugar.", cta: "Acessar central de documentos", href: "#/documentos" },
      ...(urgente ? [{ photo: "news", pos: "50% 28%", shape: "rect", badge: "🔥 URGENTE", titulo: esc(urgente.titulo.split(" - ")[0].slice(0,60)),
        texto: esc(urgente.resumo.slice(0,90) + "…"), cta: "Ver comunicado urgente", href: `#/avisos/${urgente.id}` }] : []),
      ...(proxEvento ? [{ photo: "doctor", pos: "50% 12%", badge: "PRÓXIMO EVENTO", titulo: esc(proxEvento.titulo),
        texto: esc(`${proxEvento.data} · ${proxEvento.local}`), cta: "Ver detalhes do evento", href: `#/eventos/${proxEvento.id}` }] : []),
    ];
    const slidesHtml = slides.map((s) => `
      <div class="carousel-slide">
        <div class="hero-banner">
          <div class="relative z-10 max-w-md">
            ${badge("light", s.badge)}
            <h3 class="text-2xl font-extrabold text-white mt-3 mb-1">${s.titulo}</h3>
            <p class="text-white/80 text-sm mb-5">${s.texto}</p>
            <a href="${s.href}" class="btn-white">${s.cta} ${icon("chevron-right","w-4 h-4")}</a>
          </div>
          <div class="hero-portrait ${s.shape === "rect" ? "is-rect" : ""} hidden sm:block"><img src="assets/img/${s.photo}.png" alt="" style="object-position:${s.pos}"></div>
        </div>
      </div>`).join("");
    const dotsHtml = slides.map((_, i) => `<button class="carousel-dot ${i===0?"active":""}" data-dot="${i}" aria-label="Slide ${i+1}"></button>`).join("");

    const qaTile = (it) => UI.qaLink(it, "qa-tile",
      `<span class="qa-icon">${icon(it.icon,"w-4 h-4")}</span><span class="qa-label">${it.titulo}</span>`, App.can("interact"));
    const acessosRapidos = DB.acessosRapidos.map(qaTile).join("");

    const header = souAniversariante ? `
      <div class="birthday-hero mb-6">
        <div class="birthday-hero-emoji" aria-hidden="true">🎉 🎈 🎂 🎊</div>
        <div class="birthday-hero-avatar mx-auto mb-4">${foto(u.nome)}${esc(iniciais(u.nome))}</div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-2">Feliz Aniversário, ${esc(u.nome.split(" ")[0])}! 🎉</h2>
        <p class="text-white/85 max-w-md mx-auto mb-6">Hoje é o seu dia! Toda a equipe do Hospital Decós deseja muita saúde, alegria e sucesso nesse novo ciclo.</p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <button data-action="celebrate" data-auto-confetti="1" data-msg="🎉 Feliz aniversário para você!" class="btn-white">${icon("party","w-4 h-4")} Comemorar</button>
          <a href="#/aniversariantes/hoje" class="btn-outline-white">Ver quem mais celebra hoje</a>
        </div>
      </div>`
      : `<div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet</div>
        <h2 class="text-hero font-extrabold text-slate-800 dark:text-slate-100">Bom dia, ${esc(u.nome.split(" ").slice(0,2).join(" "))}</h2></div>
        <a href="#/avisos" class="pill-soft hover:brightness-95 transition">${todosAvisos.length} ${todosAvisos.length === 1 ? "comunicado publicado" : "comunicados publicados"}</a>
      </div>`;

    return {
      title: "Dashboard",
      html: `
      ${header}

      <div class="card qa-card mb-6" id="qa">
        <div class="qa-head">
          <h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon("zap","w-5 h-5 text-wine")} Acessos Rápidos</h3>
          <div class="flex gap-1.5">
            <button type="button" class="qa-arrow" data-qa-dir="-1" title="Anteriores" disabled>${icon("chevron-left","w-4 h-4")}</button>
            <button type="button" class="qa-arrow" data-qa-dir="1" title="Próximos">${icon("chevron-right","w-4 h-4")}</button>
          </div>
        </div>
        <div class="qa-viewport"><div class="qa-strip">${acessosRapidos}</div></div>
      </div>

      <div id="dash-stats" class="mb-6" aria-busy="true"></div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-4">
          <div class="carousel" id="dash-carousel">
            <div class="carousel-track">${slidesHtml}</div>
            <button class="carousel-arrow prev" data-carousel="prev" aria-label="Anterior">${icon("chevron-left","w-4 h-4")}</button>
            <button class="carousel-arrow next" data-carousel="next" aria-label="Próximo">${icon("chevron-right","w-4 h-4")}</button>
            <div class="carousel-dots">${dotsHtml}</div>
          </div>

          <div class="flex gap-2 flex-wrap" data-filter-group="dash">
            ${["Todos","Comunicado","Promoção","Evento","Urgente"].map((f,i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${f}">${f}</button>`).join("")}
          </div>

          <div id="dash-avisos" class="space-y-4">${avisos}</div>

          <a href="#/avisos" class="card flex items-center justify-between p-4 hover:shadow-md transition-shadow">
            <span class="font-bold text-wine">Ver todos os avisos (${todosAvisos.length})</span>${icon("chevron-right","w-5 h-5 text-wine")}
          </a>
          <div class="flex items-center justify-between text-sm text-slate-400 pt-1 flex-wrap gap-3">
            <span id="dash-info">Exibindo comunicados</span>
            <div class="flex gap-1.5" id="dash-pager"></div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-5">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">${icon("calendar","w-5 h-5 text-wine")} Próximos Eventos</h3>
            <div class="space-y-1">${eventos}</div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">${icon("gift","w-5 h-5 text-wine")} Aniversariantes de ${mesRotulo}</h3>
            <div>${aniversarios}</div>
            <a href="#/aniversariantes/hoje" class="text-xs font-bold text-wine flex items-center gap-1 mt-3 hover:underline">${icon("gift","w-3.5 h-3.5")} Ver aniversariante do dia</a>
          </div>
        </div>
      </div>`,
      init() {
        carregarNumeros();
        wireList({
          containerId: "dash-avisos", itemSel: ".dash-aviso-wrap", size: 4,
          pagerId: "dash-pager", infoId: "dash-info", label: "comunicados",
          filterGroup: "dash", onEmpty: todosAvisos.length ? "Nenhum comunicado nesta categoria." : "Nenhum aviso encontrado.",
          filterFn: (el, f) => { const cat = CAT_FILTRO[f] || "all"; return cat === "all" || el.dataset.cat === cat; },
        });
        wireCarousel("dash-carousel", slides.length);
        wireQuickAccess("qa");
        if (souAniversariante) {
          const btn = document.querySelector('[data-auto-confetti="1"]');
          if (btn) setTimeout(() => btn.click(), 500);
        }
      },
    };
  }

  Object.assign(Pages, { dashboard });
})();
