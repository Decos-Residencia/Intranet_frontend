/* =========================================================================
   Tela: Meu painel
   Rota: #/painel
   Tudo o que depende da pessoa, num lugar só (GET /painel): avisos não lidos, treinamentos
   obrigatórios pendentes (com inscrição na próxima turma), chamados em aberto, tarefas de hoje
   e próximos eventos inscritos. Cada bloco mostra a contagem, até 5 itens e o atalho.
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
      return `<li><a href="#/chamados" class="painel-item abre-mouse">
        <span class="min-w-0 flex-1"><span class="block font-semibold abre-linha">${esc(c.protocolo)} · ${esc(c.categoria)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400">Atualizado em ${esc(quando(c.atualizado_em))}</span></span>${badge(tom, rot)}</a></li>`;
    }).join("")}</ul>` : emDia("Nenhum chamado em aberto.");
    return bloco("chamados", "help-circle", "Meus chamados abertos", b.total, corpo, ["#/chamados", "Ver meus chamados"]);
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
      </div>`,
      async init() {
        const grade = document.getElementById("painel-grade");
        const resumo = document.getElementById("painel-resumo");
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
