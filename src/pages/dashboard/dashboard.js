/* =========================================================================
   Tela: Início (Dashboard)
   Rota: #/dashboard
   Avisos para ler, eventos disponíveis com inscrição, acessos rápidos e aniversariantes.
   Eventos publicados com data futura vêm do estado da sessão.
   ========================================================================= */
(function () {
  const { icon, badge, iniciais, foto, esc, saudacao, tone, catLabel } = UI;

  const num = (n) => Number(n).toLocaleString("pt-BR");
  const plural = (n, um, varios) => `${num(n)} ${n === 1 ? um : varios}`;

  /* ---------- avisos ---------- */
  // Ao passar o mouse (ou focar pelo teclado) o comunicado se abre ali mesmo, com o texto completo.
  // O mesmo texto se estende (sem trocar resumo por texto completo, que dava um "pulo").
  function textoCompleto(a) {
    const paragrafos = (a.conteudo || []).join("\n\n");
    const corte = paragrafos.length > 900 ? paragrafos.slice(0, 900).trimEnd() + "…" : paragrafos;
    return `<div class="dash-aviso-texto"><p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">${esc(corte)}</p></div>
      <span class="dash-aviso-ler">Ler comunicado na íntegra ${icon("chevron-right", "w-4 h-4")}</span>`;
  }
  function avisoItem(a) {
    const estado = UI.estadoLeitura(a.lido);
    return `<li><a href="#/avisos/${a.id}" class="dash-aviso dash-aviso-abre ${a.lido ? "" : "dash-aviso-novo"}">
      <div class="flex items-center gap-2 flex-wrap mb-1.5">${badge(tone(a.categoria), catLabel(a.categoria))}${estado}
        <span class="text-xs text-slate-500 dark:text-slate-400 ml-auto">${esc(a.dataCurta)}</span></div>
      <div class="font-bold text-slate-800 dark:text-slate-100 leading-snug">${esc(a.titulo)}</div>
      ${textoCompleto(a)}
    </a></li>`;
  }

  // Visitante: sem "lido/não lido" (não há conta para guardar a leitura).
  function avisoPublico(a) {
    return `<li><a href="#/avisos/${a.id}" class="dash-aviso dash-aviso-abre">
      <div class="flex items-center gap-2 flex-wrap mb-1.5">${badge(tone(a.categoria), catLabel(a.categoria))}
        <span class="text-xs text-slate-500 dark:text-slate-400 ml-auto">${esc(a.dataCurta)}</span></div>
      <div class="font-bold text-slate-800 dark:text-slate-100 leading-snug">${esc(a.titulo)}</div>
      ${textoCompleto(a)}
    </a></li>`;
  }

  /* ---------- comunicados urgentes: abre ao passar o mouse; clique/teclado fixa ---------- */
  function ligarUrgentes(box) {
    const botao = box.querySelector(".dash-urgente"), corpo = box.querySelector(".dash-urg-corpo");
    let fixo = box.dataset.fixo === "1", espera = 0;
    const abrir = (sim) => {
      box.classList.toggle("is-open", sim);
      botao.setAttribute("aria-expanded", String(sim));
      corpo.inert = !sim; // fechado: os links de dentro saem da ordem do Tab
    };
    abrir(fixo);
    // Só em aparelhos com mouse: no toque, o clique decide.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      box.addEventListener("mouseenter", () => { clearTimeout(espera); espera = setTimeout(() => abrir(true), 120); });
      box.addEventListener("mouseleave", () => { clearTimeout(espera); if (!fixo) espera = setTimeout(() => abrir(false), 350); });
    }
    botao.addEventListener("click", () => {
      clearTimeout(espera);
      const abrirAgora = !box.classList.contains("is-open") || !fixo;
      fixo = abrirAgora; abrir(abrirAgora);
    });
  }

  /* ---------- carrossel de próximos eventos (com a foto de capa) ---------- */
  function acaoSlide(e) {
    if (!App.state.auth) return e.aberto ? `<a href="#/login" data-action="entrar" class="btn-white px-5">${icon("lock", "w-4 h-4")} Entrar para se inscrever</a>` : "";
    if (e.inscrito) return `<span class="ev-slide-ok">${icon("check", "w-4 h-4")} Inscrito</span>
      <button type="button" data-action="cancelar-inscricao" data-id="${e.id}" class="ev-slide-cancelar" aria-label="Cancelar inscrição em ${esc(e.titulo)}">Cancelar inscrição</button>`;
    if (e.aberto && App.can("interact")) return `<button type="button" data-action="inscrever-evento" data-id="${e.id}" class="btn-white px-5" aria-label="Inscrever-se em ${esc(e.titulo)}">Inscrever-se</button>`;
    if (e.livres === 0) return `<span class="ev-slide-ok">Esgotado</span>`;
    return "";
  }
  function carrossel(lista) {
    if (!lista.length) return "";
    const slides = lista.map((e, i) => `
      <article class="ev-slide" data-slide role="group" aria-roledescription="slide" aria-label="${i + 1} de ${lista.length}: ${esc(e.titulo)}" tabindex="-1">
        <div class="ev-slide-foto" aria-hidden="true"><span class="ev-slide-sem-foto">${icon("calendar", "w-12 h-12")}</span>${e.temBanner || e.temImagem
          ? `<img data-foto-evento="${e.id}" data-foto-tipo="${e.temBanner ? "banner" : "capa"}" data-preencher="1" alt="" class="ev-slide-img" decoding="async">`
          : ""}<span class="ev-slide-data">${esc(e.dia)} ${esc(e.mes)}</span></div>
        <div class="ev-slide-legenda">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1"><span class="ev-slide-selo">${e.treinamento ? "Treinamento" : "Evento"}</span>${e.visto ? "" : `<span class="ev-slide-selo ev-slide-novo">Novo</span>`}</div>
            <h3 class="ev-slide-titulo">${esc(e.titulo)}</h3>
            ${e.desc ? `<p class="ev-slide-descricao">${esc(e.desc)}</p>` : ""}
            <p class="ev-slide-info">${esc(e.dataLonga)} · ${esc(e.horario)} · ${esc(e.local)}</p>
            ${e.organizador ? `<p class="ev-slide-info">Organização: ${esc(e.organizador)}</p>` : ""}
            <p class="ev-slide-info ev-slide-vagas">${esc(e.vagasTxt)}</p>
          </div>
          <div class="ev-slide-acoes">${acaoSlide(e)}<a href="#/eventos/${e.id}" class="btn-outline-white">Ver detalhes</a></div>
        </div>
      </article>`).join("");
    return `<section class="ev-carrossel" data-carrossel aria-roledescription="carrossel" aria-label="Eventos disponíveis">
      <div class="ev-carrossel-janela"><div class="ev-carrossel-trilho" data-carrossel-trilho>${slides}</div></div>
      ${lista.length > 1 ? `<div class="ev-carrossel-controles">
        <button type="button" class="ev-carrossel-btn" data-carrossel-ant aria-label="Evento anterior">${icon("chevron-left", "w-5 h-5")}</button>
        <div class="ev-carrossel-pontos" data-carrossel-pontos></div>
        <button type="button" class="ev-carrossel-btn" data-carrossel-prox aria-label="Próximo evento">${icon("chevron-right", "w-5 h-5")}</button>
        <button type="button" class="ev-carrossel-btn" data-carrossel-pausa></button>
      </div>` : ""}
    </section>`;
  }

  /* ---------- cabeçalho ---------- */
  // Foto da fachada do Hospital Decós no cabeçalho.
  function ilustracao() {
    return `<figure class="dash-fachada"><img src="/assets/img/fachada-decos.jpg" alt="Fachada do Hospital Decós" decoding="async"></figure>`;
  }

  /* ---------- tela ---------- */
  function dashboard() {
    const logado = App.state.auth;
    const u = App.state.user;
    const primeiroNome = logado ? esc(u.nome.split(" ")[0]) : "";
    // Só os avisos em destaque aparecem na Inicial (prazo vencido sai sozinho, spec 003).
    const todos = App.avisosAll().filter((a) => a.emDestaque);
    const naoLidos = logado ? todos.filter((a) => !a.lido) : [];
    // Não lidos primeiro (mais recentes antes); completa com os lidos até 5.
    const avisos = logado ? [...naoLidos, ...todos.filter((a) => a.lido)].slice(0, 5) : todos.slice(0, 5);
    // Comunicados urgentes em destaque, não lidos primeiro: ficam juntos num bloco que abre e fecha.
    const urgentes = [...todos.filter((a) => a.categoria === "urgente" && !a.lido), ...todos.filter((a) => a.categoria === "urgente" && a.lido)];
    const urgentesNaoLidos = logado ? urgentes.filter((a) => !a.lido).length : 0;
    const agora = new Date();
    const eventosDisponiveis = App.eventosProximos().filter((e) => !e.cancelado && e.ini > agora);
    const novosEventos = logado ? eventosDisponiveis.filter((e) => !e.visto).length : 0;
    const deHoje = logado ? (App.state.api.eventosHoje || []).map(App.eventoView) : [];

    const hoje = App.hoje();
    const mesNome = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, hoje.mes - 1, 1));
    const doMes = logado ? App.aniversariantesAll().filter((p) => p.mes === hoje.mes).sort((a, b) => a.dia - b.dia) : [];
    const doDia = logado ? App.aniversariantesHoje().filter((p) => p.id !== u.id) : [];
    const proximosAniv = doMes.filter((p) => p.dia > hoje.dia).slice(0, 5);

    // Globais (ADMIN) e pessoais primeiro; completa com os internos até 8 (visitante: só links e telas abertas).
    // Os atalhos pessoais vêm primeiro: com muitos globais, quem criou o seu precisa vê-lo aqui.
    const lista = App.todosAtalhos();
    const atalhos = [...lista.filter((it) => it.origem === "pessoal"), ...lista.filter((it) => it.origem !== "pessoal")]
      .filter((it) => logado || it.url || ["#/avisos", "#/eventos", "#/documentos", "#/faq"].includes(it.route))
      .slice(0, 8).map((it) => UI.qaLink(it, `qa-grid-tile ${it.origem ? `qa-${it.origem}` : ""}`,
        `<span class="qa-icon">${icon(it.icon, "w-5 h-5")}</span><span class="qa-label">${esc(it.titulo)}</span>`, App.can("interact"))).join("");

    const resumo = [
      naoLidos.length ? plural(naoLidos.length, "aviso não lido", "avisos não lidos") : "nenhum aviso pendente",
      novosEventos ? plural(novosEventos, "evento novo", "eventos novos") : "",
      deHoje.length ? plural(deHoje.length, "evento hoje", "eventos hoje") : "",
    ].filter(Boolean).join(" · ");

    const cabecalho = logado && App.souAniversariante() ? `
      <section class="birthday-hero mb-6" aria-label="Feliz aniversário">
        <div class="birthday-hero-emoji" aria-hidden="true">🎉 🎈 🎂 🎊</div>
        <div class="birthday-hero-avatar mx-auto mb-4">${foto(u.nome)}${esc(iniciais(u.nome))}</div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-2">Feliz aniversário, ${primeiroNome}! 🎉</h2>
        <p class="text-white/90 max-w-md mx-auto mb-6">Hoje é o seu dia! Toda a equipe do Hospital Decós deseja muita saúde, alegria e sucesso nesse novo ciclo.</p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <button data-action="celebrate" data-auto-confetti="1" data-msg="🎉 Feliz aniversário para você!" class="btn-white">${icon("party", "w-4 h-4")} Comemorar</button>
          <a href="#/aniversariantes/hoje" class="btn-outline-white">Ver quem mais celebra hoje</a>
        </div>
      </section>` : `
      <section class="dash-hero mb-6" aria-labelledby="dash-ola">
        <div class="min-w-0 relative z-10">
          <h2 id="dash-ola" class="text-hero font-extrabold">${logado ? `${saudacao()}, ${primeiroNome}` : "Bem-vindo à Intranet Decós"}</h2>
          <p class="dash-hero-sub mt-1">${logado ? `Você tem ${esc(resumo)}.` : "Avisos, eventos e documentos do hospital."}</p>
          <div class="flex gap-2 flex-wrap mt-4">
            ${logado ? `${naoLidos.length ? `<a href="#/avisos" class="btn-white px-4">${icon("megaphone", "w-4 h-4")} Ler avisos</a>` : ""}
              <a href="#/agenda" class="btn-outline-white px-4">${icon("check-check", "w-4 h-4")} Minha agenda</a>`
              : `<a href="#/login" data-action="entrar" class="btn-white px-5">${icon("lock", "w-4 h-4")} Entrar</a>
              <a href="${DB.SITE_HOSPITAL}" target="_blank" rel="noopener noreferrer" class="btn-outline-white px-4">${icon("external-link", "w-4 h-4")} Site do hospital<span class="sr-only"> (abre em nova aba)</span></a>`}
          </div>
        </div>
        ${ilustracao()}
      </section>`;

    const hojeVoceTem = deHoje.length ? `
      <section class="dash-hoje mb-6" aria-labelledby="dash-hoje-h">
        <h3 id="dash-hoje-h" class="dash-h mb-2">${icon("bell", "w-5 h-5 text-wine")} Hoje você tem</h3>
        <ul class="grid gap-2 sm:grid-cols-2">${deHoje.map((e) => `<li><a href="#/eventos/${e.id}" class="dash-hoje-item">
          <span class="dash-hoje-hora">${esc(e.horario.split(" ")[0])}</span>
          <span class="min-w-0"><span class="block font-bold text-slate-800 dark:text-slate-100 truncate">${esc(e.titulo)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 truncate">${e.treinamento ? "Treinamento · " : ""}${esc(e.local)}</span></span></a></li>`).join("")}</ul>
      </section>` : "";

    const anivDoDia = doDia.length ? `
      <section class="dash-aniv mb-6" aria-labelledby="dash-aniv-dia-h">
        <div class="dash-aniv-emoji" aria-hidden="true">🎂</div>
        <div class="min-w-0 flex-1">
          <h3 id="dash-aniv-dia-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100">Aniversariante${doDia.length > 1 ? "s" : ""} de hoje</h3>
          <ul class="flex flex-wrap gap-3 mt-3">${doDia.map((p) => `<li class="dash-aniv-pessoa">
            <div class="avatar-soft w-11 h-11 text-xs rounded-full flex items-center justify-center shrink-0">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
            <div class="min-w-0"><div class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(p.nome)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(p.setor)}</div>
              <div class="mt-1">${UI.parabensBtn(p, "btn-wine-soft text-xs px-3 py-1.5 flex items-center gap-1")}</div></div></li>`).join("")}</ul>
        </div>
      </section>` : "";

    const itemUrgente = (a, i) => `<li class="dash-urg-item" style="--i:${i}">
        ${a.temImagem ? `<span class="dash-urg-foto" data-foto-caixa><img data-foto-aviso="${a.id}" alt="" decoding="async"></span>` : ""}
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">${logado && !a.lido ? `<span class="dash-urg-novo">Não lido</span>` : ""}<span class="text-xs text-white/80">${esc(a.data)}</span></div>
          <h3 class="font-bold text-white leading-snug">${esc(a.titulo)}</h3>
          <p class="dash-urg-texto">${esc(a.resumo)}</p>
          <a href="#/avisos/${a.id}" class="dash-urg-ler">Ler comunicado ${icon("chevron-right", "w-4 h-4 inline")}</a>
        </div></li>`;
    const alertaUrgente = urgentes.length ? `
      <section class="dash-urgente-box mb-6" data-urgentes data-fixo="${urgentesNaoLidos ? 1 : 0}" aria-label="Comunicados urgentes">
        <button type="button" class="dash-urgente" aria-expanded="false" aria-controls="dash-urg-corpo">
          <span class="dash-urgente-ic">${icon("alert-triangle", "w-5 h-5")}</span>
          <span class="min-w-0 flex-1"><span class="block text-xs font-extrabold tracking-wide">${urgentes.length === 1 ? "COMUNICADO URGENTE" : `${urgentes.length} COMUNICADOS URGENTES`}${urgentesNaoLidos ? ` · ${urgentesNaoLidos} NÃO ${urgentesNaoLidos === 1 ? "LIDO" : "LIDOS"}` : ""}</span>
            <span class="block font-bold truncate">${esc(urgentes[0].titulo)}</span></span>
          <span class="dash-urgente-acao"><span class="dash-urgente-abrir">Ver ${urgentes.length === 1 ? "comunicado" : "comunicados"}</span><span class="dash-urgente-fechar">Fechar</span>${icon("chevron-down", "w-4 h-4 dash-urgente-seta")}</span>
        </button>
        <div id="dash-urg-corpo" class="dash-urg-corpo" inert><div class="dash-urg-dentro">
          <ul class="dash-urg-lista">${urgentes.map(itemUrgente).join("")}</ul>
        </div></div>
      </section>` : "";

    return {
      title: "Início",
      html: `
      ${cabecalho}
      ${alertaUrgente}
      ${hojeVoceTem}
      ${anivDoDia}
      <section class="mb-6" aria-labelledby="dash-eventos-h">
        <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h3 id="dash-eventos-h" class="dash-h mb-0">${icon("calendar", "w-5 h-5 text-wine")} Eventos disponíveis</h3>
          <a href="#/eventos" class="text-sm font-bold text-wine flex items-center gap-1">Ver calendário ${icon("chevron-right", "w-4 h-4")}</a>
        </div>
        ${eventosDisponiveis.length ? carrossel(eventosDisponiveis)
          : `<p class="card p-5 text-sm text-slate-600 dark:text-slate-300">Nenhum evento disponível no momento.</p>`}
      </section>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section class="card p-5 sm:p-6 lg:col-span-2" aria-labelledby="dash-avisos-h">
          <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 id="dash-avisos-h" class="dash-h">${icon("megaphone", "w-5 h-5 text-wine")} ${logado ? "Avisos para você" : "Últimos avisos"}
              ${naoLidos.length ? `<span class="badge badge-new">${naoLidos.length} não ${naoLidos.length === 1 ? "lido" : "lidos"}</span>` : ""}</h3>
            <a href="#/avisos" class="text-sm font-bold text-wine flex items-center gap-1">Ver todos (${todos.length}) ${icon("chevron-right", "w-4 h-4")}</a>
          </div>
          ${logado ? `<div class="dash-abas" role="group" aria-label="Filtrar avisos">
              <button type="button" class="chip chip-active" data-aba-avisos="nao-lidos" aria-pressed="true">Não lidos (${naoLidos.length})</button>
              <button type="button" class="chip" data-aba-avisos="todos" aria-pressed="false">Todos (${todos.length})</button></div>
            <div data-lista-avisos="nao-lidos">${naoLidos.length
              ? `<ul class="dash-avisos">${naoLidos.slice(0, 5).map(avisoItem).join("")}</ul>`
              : `<p class="painel-vazio">${icon("check", "w-4 h-4")} Você leu todos os avisos.</p>`}</div>
            <div data-lista-avisos="todos" hidden>${todos.length ? `<ul class="dash-avisos">${todos.slice(0, 5).map(avisoItem).join("")}</ul>` : `<p class="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum aviso publicado.</p>`}</div>`
          : avisos.length ? `<ul class="dash-avisos">${avisos.map(avisoPublico).join("")}</ul>` : `<p class="text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum aviso publicado.</p>`}
        </section>

        <div class="space-y-6">
          <section class="card p-5" aria-labelledby="dash-qa-h">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h3 id="dash-qa-h" class="dash-h mb-0"><img src="assets/img/simbolo.png" alt="" class="qa-logo"> Acessos rápidos</h3>
              ${logado ? `<button type="button" id="dash-add-atalho" class="btn-outline text-xs px-3" aria-label="Adicionar atalho pessoal">${icon("plus", "w-4 h-4")} Atalho</button>` : ""}
            </div>
            <div class="qa-grid">${atalhos}</div>
          </section>
          ${logado ? `<section class="card p-5" aria-labelledby="dash-aniv-h">
            <h3 id="dash-aniv-h" class="dash-h mb-1">${icon("gift", "w-5 h-5 text-wine")} Próximos aniversários de ${esc(mesNome)}</h3>
            ${proximosAniv.length ? `<ul class="divide-y divide-slate-100 dark:divide-slate-800">${proximosAniv.map((p) => `<li class="flex items-center gap-3 py-2">
              <div class="avatar-soft w-9 h-9 text-xs rounded-full flex items-center justify-center shrink-0">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
              <div class="flex-1 min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(p.nome)}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(p.setor)}</div></div>
              <span class="birthday-pill">dia ${p.dia}</span></li>`).join("")}</ul>` : `<p class="text-sm text-slate-500 dark:text-slate-400 py-3">Nenhum outro aniversário este mês.</p>`}
            <a href="#/aniversariantes" class="text-sm font-bold text-wine flex items-center gap-1 mt-3">Ver todos (${doMes.length}) ${icon("chevron-right", "w-4 h-4")}</a>
          </section>` : `<section class="card p-5"><h3 class="dash-h mb-1">${icon("lock", "w-5 h-5 text-wine")} Área do colaborador</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">Entre para se inscrever em eventos, abrir chamados, ver o diretório, aniversariantes e documentos do seu setor.</p>
            <a href="#/login" data-action="entrar" class="btn-wine w-full">Entrar</a></section>`}
        </div>
      </div>`,
      init() {
        // Abas "Não lidos" / "Todos" do bloco de avisos.
        document.querySelectorAll("[data-aba-avisos]").forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll("[data-aba-avisos]").forEach((x) => { const on = x === b; x.classList.toggle("chip-active", on); x.setAttribute("aria-pressed", String(on)); });
          document.querySelectorAll("[data-lista-avisos]").forEach((l) => { l.hidden = l.dataset.listaAvisos !== b.dataset.abaAvisos; });
        }));
        const caixa = document.querySelector("[data-carrossel]");
        if (caixa) {
          const slides = [...caixa.querySelectorAll("[data-slide]")], carregados = new WeakSet();
          const carregar = (slide) => {
            if (!slide || carregados.has(slide)) return;
            carregados.add(slide);
            App.carregarFotosEventos(slide);
          };
          Lib.wireCarrossel(caixa, { aoMostrar(slide, indice) {
            carregar(slide);
            carregar(slides[(indice + 1) % slides.length]);
          } });
        }
        const urg = document.querySelector("[data-urgentes]");
        if (urg) { App.carregarFotos(urg); ligarUrgentes(urg); }
        document.getElementById("dash-add-atalho")?.addEventListener("click", () => App.abrirNovoAtalho(() => App.render()));
        const btn = document.querySelector('[data-auto-confetti="1"]');
        if (btn) setTimeout(() => btn.click(), 500);
      },
    };
  }

  Object.assign(Pages, { dashboard });
})();
