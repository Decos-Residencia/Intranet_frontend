/* =========================================================================
   Tela: Detalhe do Aviso
   Rota: #/avisos/:id
   Abrir o aviso registra a leitura no servidor (POST /avisos/{id}/leitura): uma por usuário,
   reabrir ou recarregar a página não conta de novo.
   ========================================================================= */
(function () {
  const { badge, breadcrumb, foto, esc, tone, catLabel } = UI;

  function avisoDetalhe(id) {
    const todos = App.avisosAll();
    const a = todos.find((x) => String(x.id) === String(id));
    if (!a) return avisoAvulso(id);
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
          <div class="flex items-center justify-between mb-4">${badge(tone(a.categoria),catLabel(a.categoria).toUpperCase())}<span class="flex items-center gap-3"><span id="aviso-lido" class="${a.lido ? "" : "hidden"} text-xs font-bold text-green-600 dark:text-green-400">✓ Lido</span><span class="text-sm text-slate-400">${esc(a.data)}</span></span></div>
          <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-5">${esc(a.titulo)}</h1>
          ${a.own && a.imagem ? `<img src="${esc(a.imagem)}" alt="" class="w-full max-h-72 object-cover rounded-xl mb-5">` : ""}
          <div class="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div class="avatar-soft w-10 h-10 text-sm">${foto(a.autor)}${esc(a.autorSigla)}</div>
            <div><div class="font-bold text-sm text-slate-800 dark:text-slate-100">${esc(a.autor)}</div><div class="text-xs text-slate-400">Hospital Decós Corporativo</div></div>
          </div>
          <div class="prose-decos space-y-4">${a.conteudo.map((p)=>`<p>${a.own ? esc(p) : p}</p>`).join("")}</div>
        </article>
        <aside>
          <h3 class="text-xs font-bold tracking-widest text-slate-400 mb-4">AVISOS RELACIONADOS</h3>
          <div class="space-y-3">${relacionados}</div>
        </aside>
      </div>`,
      init() {
        // Leitura real: uma por usuário no servidor (a resposta não depende do navegador).
        App.registrarLeitura(a.id).then((ok) => { if (ok) document.getElementById("aviso-lido")?.classList.remove("hidden"); });
      },
    };
  }

  // Aviso que não está no mural carregado (ex.: um agendado que acabou de ser publicado): busca no servidor.
  function avisoAvulso(id) {
    return {
      title: "Detalhe do Comunicado",
      html: `<div class="min-h-[40vh] flex items-center justify-center text-slate-400" id="aviso-avulso">Carregando aviso…</div>`,
      init() {
        App.carregarAviso(id)
          .then(() => { if (location.hash === `#/avisos/${id}`) App.render(); })
          .catch(() => {
            const box = document.getElementById("aviso-avulso");
            if (box) box.innerHTML = `<div class="text-center"><div class="text-5xl mb-3">🗂️</div><h2 class="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">Aviso não encontrado</h2><p class="text-slate-500 dark:text-slate-400 mb-6">Este aviso não existe, ainda não foi publicado ou foi arquivado.</p><a href="#/avisos" class="btn-wine px-6 py-2.5">Voltar ao mural</a></div>`;
          });
      },
    };
  }

  Object.assign(Pages, { avisoDetalhe });
})();
