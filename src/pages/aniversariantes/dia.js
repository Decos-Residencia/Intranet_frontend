/* =========================================================================
   Tela: Aniversariante do Dia
   Rota: #/aniversariantes/hoje
   Fonte: GET /aniversariantes/hoje e /aniversariantes/proximos (só ativos, sem ano de nascimento).
   Os colegas veem quantas pessoas já deram parabéns; os recados em si só o aniversariante lê,
   no dia (GET /parabens/recebidos-hoje), e somem no dia seguinte.
   ========================================================================= */
(function () {
  const { icon, breadcrumb, iniciais, foto, parabensBtn, esc } = UI;

  function aniversarianteDoDia() {
    const hoje = App.aniversariantesHoje();
    const outros = App.aniversariantesProximos();
    const souAniversariante = hoje.some((p) => p.id === App.state.user?.id);

    const heroCard = (p) => `
      <div class="card p-8 text-center flex flex-col items-center">
        <div class="avatar-birthday w-24 h-24 text-2xl mx-auto mb-4">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="font-extrabold text-xl text-slate-800 dark:text-slate-100">${esc(p.nome)}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(p.cargo)}</div>
        <span class="tag-outline mb-3 inline-block">${esc(p.setor)}</span>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">${p.totalParabens ? `${icon("gift", "w-4 h-4 inline -mt-0.5 text-wine")} ${p.totalParabens} ${p.totalParabens === 1 ? "pessoa já deu" : "pessoas já deram"} parabéns` : "Seja a primeira pessoa a dar parabéns"}</p>
        ${App.state.user?.id === p.id ? `<span class="text-sm font-semibold text-wine dark:text-pink-300">É o seu dia! 🎉</span>` : parabensBtn(p, "btn-wine px-6 py-2.5 flex items-center gap-2")}
      </div>`;

    const outrosLista = outros.slice(0, 10).map((p) => `
      <a href="#/aniversariantes" class="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
        <div class="avatar-soft w-9 h-9 text-xs rounded-full flex items-center justify-center shrink-0">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="flex-1 min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${esc(p.nome)}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(p.setor)}</div></div>
        <span class="birthday-pill">${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}</span>
      </a>`).join("") || `<div class="text-sm text-slate-400 py-3">Nenhum aniversariante nos próximos 30 dias.</div>`;

    return {
      title: "Aniversariante do Dia",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Aniversariantes", route: "#/aniversariantes" }, { label: "Aniversariante do Dia" }])}
      <div class="banner-wine mb-6">
        <h2 class="text-xl font-extrabold text-white">${hoje.length ? "🎉 Hoje tem festa no Decós!" : "Nenhum aniversariante hoje"}</h2>
        <p class="text-white/80 text-sm mt-1">${hoje.length ? "Confira quem está celebrando mais um ano de vida hoje." : "Veja abaixo os próximos aniversariantes."}</p>
      </div>
      ${souAniversariante ? `<section class="card p-6 mb-8 recados-dia" aria-labelledby="recados-h">
        <h3 id="recados-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon("gift", "w-5 h-5 text-wine")} Seus recados de hoje</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Só você vê esta lista, e ela some amanhã. Os parabéns também ficam no sino de notificações.</p>
        <ul id="recados-lista" class="recados-grade" aria-live="polite"><li class="text-sm text-slate-500 dark:text-slate-400">Carregando…</li></ul>
      </section>` : ""}
      ${hoje.length
        ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">${hoje.map(heroCard).join("")}</div>`
        : `<div class="card p-10 text-center mb-8"><div class="text-5xl mb-3">🎂</div><p class="text-slate-500 dark:text-slate-400">Ninguém do quadro atual faz aniversário hoje.</p><a href="#/aniversariantes" class="btn-outline inline-flex mt-4 px-5 py-2.5">Ver todos os aniversariantes do mês</a></div>`}
      <div class="card p-5">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">${icon("gift","w-5 h-5 text-wine")} Próximos Aniversariantes <span class="text-xs font-normal text-slate-400">(30 dias)</span></h3>
        <div>${outrosLista}</div>
      </div>`,
      async init() {
        const lista = document.getElementById("recados-lista");
        if (!lista) return;
        try {
          const recados = await Services.aniversariantes.recebidosHoje();
          if (!document.contains(lista)) return;
          lista.innerHTML = recados.length ? recados.map((r) => `<li class="recado">
              <div class="recado-texto">${r.mensagem ? `“${esc(r.mensagem)}”` : `<span class="text-slate-500 dark:text-slate-400">Te desejou um feliz aniversário.</span>`}</div>
              <div class="recado-autor"><span class="avatar-soft w-7 h-7 text-[10px] rounded-full inline-flex items-center justify-center shrink-0">${foto(r.remetente)}${esc(iniciais(r.remetente))}</span>
                <span class="min-w-0"><b>${esc(r.remetente)}</b>${r.setor ? ` · ${esc(r.setor)}` : ""}<br><span class="text-xs text-slate-500 dark:text-slate-400">${esc(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(r.criado_em)))}</span></span></div>
            </li>`).join("")
            : `<li class="text-sm text-slate-500 dark:text-slate-400">Ainda ninguém mandou recado. Eles aparecem aqui ao longo do dia.</li>`;
        } catch (err) {
          if (document.contains(lista)) lista.innerHTML = `<li class="text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar seus recados. ${esc(err.message || "")}</li>`;
        }
      },
    };
  }

  Object.assign(Pages, { aniversarianteDoDia });
})();
