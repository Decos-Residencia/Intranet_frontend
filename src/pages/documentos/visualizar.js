/* =========================================================================
   Tela: Visualização de Documento
   Rota: #/documentos/:id
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv } = UI;

  function documentoView(id) {
    const todos = App.documentosAll();
    const d = todos.find((x) => String(x.id) === String(id));
    if (!d) return App.missingPage("Documento não encontrado", "Este documento não existe ou foi removido.", "#/documentos", "Voltar aos documentos");
    let origem = "—"; try { origem = new URL(d.url).hostname; } catch (_) { /* url inválida: mantém "—" */ }
    const relacionados = todos.filter((x) => x.id !== d.id && (x.tipo === d.tipo || x.setor === d.setor)).concat(todos.filter((x) => x.id !== d.id)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2);
    return {
      title: "Visualização de Documento",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs",route:"#/documentos"},{label:esc(d.titulo)}])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
            <span class="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">${esc(d.arquivo)}</span>
          </div>
          <div class="p-10 text-center">
            <div class="doc-icon ${d.icone === "W" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10" : "bg-red-50 text-red-600 dark:bg-red-500/10"} mx-auto mb-4">${d.icone === "W" ? "W" : "PDF"}</div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">${esc(d.titulo)}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">O arquivo está hospedado em <b>${esc(origem)}</b> e abre em uma nova aba.</p>
            <button data-action="open-doc-url" data-id="${esc(d.id)}" class="btn-wine px-6 py-2.5 inline-flex items-center gap-2">${icon("eye","w-4 h-4")} Abrir documento</button>
          </div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações do Arquivo</h3>
            <div class="space-y-3 text-sm">
              ${kv("Categoria", esc(d.tipo))} ${kv("Publicado em", esc(d.atualizado))} ${kv("Origem do arquivo", esc(origem))}
            </div>
            <div class="mt-5 space-y-2">
              ${(d.download && App.can("download"))
                ? `<button data-action="download-doc" data-id="${d.id}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("download","w-4 h-4")} Baixar documento</button>`
                : `<button class="btn-outline w-full py-2.5 opacity-50 cursor-not-allowed flex items-center justify-center gap-2" title="${d.download ? "Seu papel não permite download" : "Documento somente visualização"}">${icon("lock","w-4 h-4")} ${d.download ? "Baixar (sem permissão)" : "Download bloqueado"}</button>`}
            </div>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">DOCUMENTOS RELACIONADOS</h3>
            <div class="space-y-3">
              ${relacionados.map((r) => `<a href="${r.download ? `#/documentos/${r.id}` : `#/documentos/${r.id}/restrito`}" class="card block p-4 hover:shadow-md">${badge(r.cor==="red"?"red":r.cor==="amber"?"amber":r.cor==="blue"?"blue":"green", esc(r.tipo))}<div class="font-bold text-sm mt-2 text-slate-800 dark:text-slate-100">${esc(r.titulo)}</div><div class="text-xs text-slate-400">Atualizado em ${esc(r.atualizado)}</div></a>`).join("")}
            </div>
          </div>
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { documentoView });
})();
