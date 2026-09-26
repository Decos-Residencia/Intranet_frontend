/* =========================================================================
   Tela: Detalhe do Aviso
   Rota: #/avisos/:id
   ========================================================================= */
(function () {
  const { badge, breadcrumb, foto, esc, tone, catLabel } = UI;

  function avisoDetalhe(id) {
    const todos = App.avisosAll();
    const a = todos.find((x) => String(x.id) === String(id)) || DB.avisos[2];
    const relacionados = todos.filter((x) => x.id !== a.id).slice(0, 3).map((r) => `
      <a href="#/avisos/${r.id}" class="card block p-4 hover:shadow-md transition-shadow">
        <div class="mb-2">${badge(tone(r.categoria), catLabel(r.categoria).toUpperCase())}</div>
        <div class="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">${esc(r.titulo)}</div>
        <div class="text-xs text-slate-400">${esc(r.autor)} • ${esc(r.dataCurta)}</div>
      </a>`).join('<div class="h-3"></div>');

    return {
      title: "Detalhe do Comunicado",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Avisos",route:"#/avisos"},{label:esc(a.titulo.slice(0,28))+"..."}])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <article class="lg:col-span-2 card p-8">
          <div class="flex items-center justify-between mb-4">${badge(tone(a.categoria),catLabel(a.categoria).toUpperCase())}<span class="text-sm text-slate-400">${a.data}</span></div>
          <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-5">${esc(a.titulo)}</h1>
          ${a.own && typeof a.imagem === "string" ? `<img src="${a.imagem}" alt="" class="w-full max-h-72 object-cover rounded-xl mb-5">` : ""}
          <div class="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div class="avatar-soft w-10 h-10 text-sm">${foto(a.autor)}${a.autorSigla}</div>
            <div><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${esc(a.autor)}</div><div class="text-xs text-slate-400">Hospital Decós Corporativo</div></div>
          </div>
          <div class="prose-decos space-y-4">${a.conteudo.map((p)=>`<p>${a.own ? esc(p) : p}</p>`).join("")}</div>
        </article>
        <aside>
          <h3 class="text-xs font-bold tracking-widest text-slate-400 mb-4">AVISOS RELACIONADOS</h3>
          <div class="space-y-3">${relacionados}</div>
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { avisoDetalhe });
})();
