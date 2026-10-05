/* =========================================================================
   Tela: Aniversariante do Dia
   Rota: #/aniversariantes/hoje
   Fonte: GET /aniversariantes/hoje e /aniversariantes/proximos (só ativos, sem ano de nascimento).
   ========================================================================= */
(function () {
  const { icon, breadcrumb, iniciais, foto, parabensBtn, esc } = UI;

  function aniversarianteDoDia() {
    const hoje = App.aniversariantesHoje();
    const outros = App.aniversariantesProximos();

    const heroCard = (p) => `
      <div class="card p-8 text-center flex flex-col items-center">
        <div class="avatar-birthday w-24 h-24 text-2xl mx-auto mb-4">${foto(p.nome)}${esc(iniciais(p.nome))}</div>
        <div class="font-extrabold text-xl text-slate-800 dark:text-slate-100">${esc(p.nome)}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">${esc(p.cargo)}</div>
        <span class="tag-outline mb-4 inline-block">${esc(p.setor)}</span>
        ${parabensBtn(p, "btn-wine px-6 py-2.5 flex items-center gap-2")}
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
      ${hoje.length
        ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">${hoje.map(heroCard).join("")}</div>`
        : `<div class="card p-10 text-center mb-8"><div class="text-5xl mb-3">🎂</div><p class="text-slate-500 dark:text-slate-400">Ninguém do quadro atual faz aniversário hoje.</p><a href="#/aniversariantes" class="btn-outline inline-flex mt-4 px-5 py-2.5">Ver todos os aniversariantes do mês</a></div>`}
      <div class="card p-5">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">${icon("gift","w-5 h-5 text-wine")} Próximos Aniversariantes <span class="text-xs font-normal text-slate-400">(30 dias)</span></h3>
        <div>${outrosLista}</div>
      </div>`,
    };
  }

  Object.assign(Pages, { aniversarianteDoDia });
})();
