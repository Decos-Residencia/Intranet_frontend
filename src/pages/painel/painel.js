/* =========================================================================
   Tela: Meu painel
   Rota: #/painel
   Tudo o que depende da pessoa, num lugar só (GET /painel): avisos não lidos, treinamentos
   obrigatórios pendentes (com inscrição na próxima turma), chamados em aberto, tarefas de hoje
   e próximos eventos inscritos. Cada bloco mostra a contagem, até 5 itens e o atalho.
   Abaixo, "Meus chamados" completo (GET /chamados/meus), que antes era uma tela própria.
   ========================================================================= */
(function () {
  const { icon, esc, badge } = UI;

  const ROT_CHAMADO = { ABERTO: ["blue", "Aberto"], EM_ANALISE: ["amber", "Em análise"], CONCLUIDO: ["green", "Concluído"] };
  const dataCurta = (iso) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso)).replace(".", "");
  const quando = (iso) => UI.fmtDataHora(iso);

  function emDia(texto) {
    return `<p class="painel-vazio">${icon("check", "w-4 h-4")} ${esc(texto)}</p>`;
  }

  // Cartão de um bloco: título com contagem, lista e atalho "ver tudo".
  function bloco(id, ico, tituloTxt, total, corpo, verTudo) {
    return `<section class="card p-5 painel-bloco" aria-labelledby="pb-${id}">
      <div class="flex items-center justify-between gap-2 mb-3">
        <h3 id="pb-${id}" class="dash-h mb-0">${icon(ico, "w-5 h-5 text-wine")} ${esc(tituloTxt)}</h3>
        <span class="painel-conta ${total ? "painel-conta-on" : ""}" aria-label="${total} pendente${total === 1 ? "" : "s"}">${total}</span>
      </div>
      ${corpo}
      ${verTudo ? `<a href="${verTudo[0]}" class="painel-ver">${esc(verTudo[1])} ${icon("chevron-right", "w-4 h-4")}</a>` : ""}
    </section>`;
  }

  function blocoAvisos(b) {
    const corpo = b.itens.length ? `<ul class="painel-lista">${b.itens.map((a) => `<li><a href="#/avisos/${a.id}" class="painel-item abre-mouse">
        <span class="painel-ponto" aria-hidden="true"></span>
        <span class="min-w-0 flex-1"><span class="block font-semibold abre-linha">${esc(a.titulo)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400">${esc(UI.catLabel ? UI.catLabel(a.categoria) : a.categoria)}${a.data_publicacao ? ` · ${dataCurta(a.data_publicacao)}` : ""}</span></span></a></li>`).join("")}</ul>`
      : emDia("Você leu todos os avisos.");
    return bloco("avisos", "megaphone", "Avisos para ler", b.total, corpo, ["#/avisos", "Ver todos os avisos"]);
  }

  function blocoTreinamentos(b) {
    const acao = (t) => {
      const turma = t.proxima_turma;
      if (!turma) return `<span class="text-xs text-slate-500 dark:text-slate-400">Sem turma aberta no momento</span>`;
      const data = `${dataCurta(turma.inicio)} · ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(turma.inicio))}`;
      const botao = turma.inscrito
        ? `<span class="painel-ok">${icon("check", "w-3.5 h-3.5")} Inscrito</span>`
        : turma.inscricoes_abertas && App.can("interact")
          ? `<button type="button" class="btn-wine text-xs px-3 py-1.5" data-action="inscrever-evento" data-id="${turma.id}" aria-label="Inscrever-se na turma de ${esc(t.tema)} em ${esc(data)}">Inscrever-se</button>`
          : `<span class="text-xs text-slate-500 dark:text-slate-400">Turma lotada</span>`;
      return `<span class="flex items-center justify-between gap-2 flex-wrap"><a href="#/eventos/${turma.id}" class="text-xs font-semibold text-wine dark:text-pink-300 underline-offset-2 hover:underline">Próxima turma: ${esc(data)}</a>${botao}</span>`;
    };
    const corpo = b.itens.length ? `<ul class="painel-lista">${b.itens.map((t) => `<li class="painel-item painel-item-col abre-mouse">
        <span class="font-semibold">${esc(t.tema)}</span>
        ${t.descricao ? `<span class="abre-texto text-xs text-slate-500 dark:text-slate-400">${esc(t.descricao)}</span>` : ""}
        ${acao(t)}</li>`).join("")}</ul>`
      : emDia("Nenhum treinamento obrigatório pendente.");
    return bloco("treinos", "graduation", "Treinamentos obrigatórios", b.total, corpo, null);
  }

  function blocoChamados(b) {
    const corpo = b.itens.length ? `<ul class="painel-lista">${b.itens.map((c) => {
      const [tom, rot] = ROT_CHAMADO[c.status] || ["gray", c.status];
      return `<li><a href="#painel-chamados-h" class="painel-item abre-mouse" data-ir-chamados>
        <span class="min-w-0 flex-1"><span class="block font-semibold abre-linha">${esc(c.protocolo)} · ${esc(c.categoria)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400">Atualizado em ${esc(quando(c.atualizado_em))}</span></span>${badge(tom, rot)}</a></li>`;
    }).join("")}</ul>` : emDia("Nenhum chamado em aberto.");
    return bloco("chamados", "help-circle", "Meus chamados abertos", b.total, corpo, null);
  }

  function blocoAgenda(b) {
    const pct = b.total ? Math.round((b.feitos / b.total) * 100) : 0;
    const corpo = b.itens.length ? `
      <div class="painel-progresso" role="progressbar" aria-valuemin="0" aria-valuemax="${b.total}" aria-valuenow="${b.feitos}" aria-label="${b.feitos} de ${b.total} tarefas feitas"><span style="width:${pct}%"></span></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">${b.feitos} de ${b.total} feita${b.total === 1 ? "" : "s"}</p>
      <ul class="painel-lista">${b.itens.map((t) => `<li class="painel-item abre-mouse ${t.feito ? "painel-feito" : ""}">
        <span class="painel-check" aria-hidden="true">${t.feito ? icon("check", "w-3.5 h-3.5") : ""}</span>
        <span class="min-w-0 flex-1 abre-linha">${t.hora ? `<b>${esc(t.hora.slice(0, 5))}</b> · ` : ""}${esc(t.texto)}</span>
        <span class="sr-only">${t.feito ? "(feita)" : "(a fazer)"}</span></li>`).join("")}</ul>`
      : emDia("Nada anotado para hoje.");
    return bloco("agenda", "check-check", "Minha agenda de hoje", b.total - b.feitos, corpo, ["#/agenda", "Abrir minha agenda"]);
  }

  function blocoEventos(b) {
    const corpo = b.itens.length ? `<ul class="painel-lista">${b.itens.map((e) => {
      const d = new Date(e.inicio);
      return `<li><a href="#/eventos/${e.id}" class="painel-item abre-mouse">
        <span class="painel-data" aria-hidden="true"><b>${d.getDate()}</b>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "")}</span>
        <span class="min-w-0 flex-1"><span class="block font-semibold abre-linha">${esc(e.titulo)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 abre-linha">${esc(quando(e.inicio))} · ${esc(e.local)}</span></span></a></li>`;
    }).join("")}</ul>` : emDia("Nenhuma inscrição em eventos futuros.");
    return bloco("eventos", "calendar", "Meus próximos eventos", b.total, corpo, ["#/eventos", "Ver calendário"]);
  }

  /* ---------- Meus chamados (lista completa) ---------- */
  const STATUS_CH = { ABERTO: ["blue", "Aberto"], EM_ANALISE: ["amber", "Em análise"], CONCLUIDO: ["green", "Concluído"] };
  const TIPO_CH = { TI: "Chamado de TI", EVENTO_ADVERSO: "Evento adverso", GERAL: "Chamado geral" };
  const PRIO_CH = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };
  const FILTROS_CH = [["", "Todos"], ["ABERTO", "Abertos"], ["EM_ANALISE", "Em análise"], ["CONCLUIDO", "Concluídos"]];

  function chamadoItem(c) {
    const [tom, rotulo] = STATUS_CH[c.status] || ["gray", c.status];
    return `<li class="card p-5">
      <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div class="min-w-0"><div class="text-xs font-bold text-slate-500 dark:text-slate-400">${esc(TIPO_CH[c.tipo] || c.tipo)} · ${esc(c.protocolo)}</div>
          <h4 class="font-bold text-slate-800 dark:text-slate-100">${esc(c.categoria)}</h4></div>${badge(tom, rotulo)}</div>
      <p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">${esc(c.descricao)}</p>
      <dl class="flex gap-x-5 gap-y-1 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-3">
        <div><dt class="inline font-bold">Local:</dt> <dd class="inline">${esc(c.local)}</dd></div>
        <div><dt class="inline font-bold">Prioridade:</dt> <dd class="inline">${esc(PRIO_CH[c.prioridade] || c.prioridade)}</dd></div>
        <div><dt class="inline font-bold">Aberto em:</dt> <dd class="inline">${esc(quando(c.criado_em))}</dd></div>
        ${c.concluido_em ? `<div><dt class="inline font-bold">Concluído em:</dt> <dd class="inline">${esc(quando(c.concluido_em))}</dd></div>` : ""}
      </dl>
      ${c.resposta_admin ? `<div class="ch-resposta mt-3"><div class="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-1">${icon("check-check", "w-4 h-4 inline")} Resposta da equipe</div>
        <p class="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">${esc(c.resposta_admin)}</p></div>` : ""}
    </li>`;
  }

  async function carregarChamados() {
    const lista = document.getElementById("painel-ch-lista");
    if (!lista) return;
    let itens;
    try { itens = await Services.listAll(Services.chamados.meus); App.state.api.chamados = itens; }
    catch (err) { lista.innerHTML = `<li class="card p-6 text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar seus chamados. ${esc(err.message || "")}</li>`; return; }
    if (!document.contains(lista)) return;
    const pinta = (status) => {
      const vis = status ? itens.filter((c) => c.status === status) : itens;
      lista.innerHTML = vis.length ? vis.map(chamadoItem).join("")
        : `<li class="card p-6 text-sm text-slate-500 dark:text-slate-400">${itens.length ? "Nenhum chamado com este status." : "Você ainda não abriu chamados. Precisa de ajuda da TI ou quer relatar algo? Use “Abrir chamado”."}</li>`;
    };
    pinta("");
    Lib.wireFilters("painel-ch", (f) => {
      document.querySelectorAll('[data-filter-group="painel-ch"] [data-filter]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      pinta(f);
    });
  }

  function secaoChamados() {
    if (!App.can("interact")) return "";
    return `<section class="mt-8" aria-labelledby="painel-chamados-h">
      <div class="flex items-end justify-between gap-3 mb-3 flex-wrap">
        <div><h3 id="painel-chamados-h" class="text-lg font-extrabold text-slate-800 dark:text-slate-100" tabindex="-1">Meus chamados</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Todos os chamados que você abriu. Relatos anônimos não aparecem aqui, para preservar o anonimato.</p></div>
        <button type="button" data-action="open-chamado" data-tipo="geral" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Abrir chamado</button></div>
      <div class="flex gap-2 flex-wrap mb-4" role="group" aria-label="Filtrar chamados por status" data-filter-group="painel-ch">
        ${FILTROS_CH.map(([v, l], i) => `<button type="button" class="chip ${i === 0 ? "chip-active" : ""}" data-filter="${v}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div>
      <ul id="painel-ch-lista" class="space-y-3" aria-live="polite"><li class="text-sm text-slate-500 dark:text-slate-400 py-6">Carregando…</li></ul>
    </section>`;
  }

  function painel() {
    const nome = esc((App.state.user?.nome || "").split(" ")[0]);
    return {
      title: "Meu painel",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Tudo o que depende de você, num lugar só</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Meu painel</h2>
        <p id="painel-resumo" class="text-slate-600 dark:text-slate-300 mt-1" aria-live="polite">Carregando suas pendências, ${nome}…</p></div>
      <div id="painel-grade" class="painel-grade" aria-busy="true">
        ${[1, 2, 3, 4, 5].map(() => `<div class="card p-5 painel-bloco painel-esqueleto" aria-hidden="true"></div>`).join("")}
      </div>
      ${secaoChamados()}`,
      async init() {
        const grade = document.getElementById("painel-grade");
        const resumo = document.getElementById("painel-resumo");
        carregarChamados();
        grade.addEventListener("click", (e) => {
          if (!e.target.closest("[data-ir-chamados]")) return;
          e.preventDefault(); document.getElementById("painel-chamados-h")?.focus();
          document.getElementById("painel-chamados-h")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        if (location.hash === "#/chamados") setTimeout(() => document.getElementById("painel-chamados-h")?.scrollIntoView({ block: "start" }), 300);
        try {
          const p = await Services.painel.resumo();
          if (!document.contains(grade)) return;
          const pendencias = p.avisos_nao_lidos.total + p.treinamentos_pendentes.total + p.chamados_abertos.total + (p.agenda_hoje.total - p.agenda_hoje.feitos);
          resumo.textContent = pendencias
            ? `${nome}, você tem ${pendencias} ${pendencias === 1 ? "pendência" : "pendências"} hoje.`
            : `Tudo em dia, ${nome}! Nenhuma pendência no momento.`;
          grade.innerHTML = [
            blocoAvisos(p.avisos_nao_lidos), blocoTreinamentos(p.treinamentos_pendentes), blocoAgenda(p.agenda_hoje),
            blocoChamados(p.chamados_abertos), blocoEventos(p.proximos_eventos),
          ].join("");
          grade.setAttribute("aria-busy", "false");
        } catch (err) {
          if (!document.contains(grade)) return;
          grade.setAttribute("aria-busy", "false");
          grade.innerHTML = `<div class="card p-8 text-center text-slate-500 dark:text-slate-400 col-span-full">Não foi possível carregar o painel. ${esc(err.message || "")}</div>`;
          resumo.textContent = "";
        }
      },
    };
  }

  Object.assign(Pages, { painel });
})();
