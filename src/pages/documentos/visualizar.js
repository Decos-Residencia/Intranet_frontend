/* =========================================================================
   Tela: Visualização de Documento
   Rota: #/documentos/:id
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv, pdfMock } = UI;

  function documentoView(id) {
    const todos = App.documentosAll();
    const d = todos.find((x) => String(x.id) === String(id)) || DB.documentos[0];
    const relacionados = todos.filter((x) => x.id !== d.id && (x.tipo === d.tipo || x.setor === d.setor)).concat(todos.filter((x) => x.id !== d.id)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2);
    return {
      title: "Visualização de Documento",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs",route:"#/documentos"},{label:esc(d.titulo)}])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
            <span class="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2"><button class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar">+</button></div>
          </div>
          <div class="pdf-scroll">${pdfMock(d)}</div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações do Arquivo</h3>
            <div class="space-y-3 text-sm">
              ${kv("Versão Atual", d.versao)} ${kv("Criado por", d.criadoPor)} ${kv("Setor Responsável", d.setor)}
              ${kv("Última Atualização", d.atualizado)} ${kv("Tamanho", d.tamanho)}
            </div>
            <div class="mt-5 space-y-2">
              ${(d.download && App.can("download"))
                ? `<button data-action="download-doc" data-id="${d.id}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("download","w-4 h-4")} Baixar ${d.icone === "W" ? "documento" : "PDF"}</button>`
                : `<button class="btn-outline w-full py-2.5 opacity-50 cursor-not-allowed flex items-center justify-center gap-2" title="${d.download ? "Seu papel não permite download" : "Documento somente visualização"}">${icon("lock","w-4 h-4")} ${d.download ? "Baixar (sem permissão)" : "Download bloqueado"}</button>`}
              <button data-action="print-doc" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("printer","w-4 h-4")} Imprimir Documento</button>
            </div>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">DOCUMENTOS RELACIONADOS</h3>
            <div class="space-y-3">
              ${relacionados.map((r) => `<a href="${r.download ? `#/documentos/${r.id}` : `#/documentos/${r.id}/restrito`}" class="card block p-4 hover:shadow-md">${badge(r.cor==="red"?"red":r.cor==="amber"?"amber":r.cor==="blue"?"blue":"green", r.tipo)}<div class="font-bold text-sm mt-2 text-slate-800 dark:text-slate-100">${esc(r.titulo)}</div><div class="text-xs text-slate-400">${esc(r.setor)} • Atualizado em ${esc(r.atualizado)}</div></a>`).join("")}
            </div>
          </div>
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { documentoView });
})();
