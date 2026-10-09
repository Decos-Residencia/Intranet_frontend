/* =========================================================================
   Tela: Detalhes do Documento
   Rota: #/documentos/:id
   Os metadados vêm de GET /documentos; "Abrir" e "Baixar" pedem uma URL assinada de 60 s ao backend
   (que confere login e setor). O navegador nunca acessa o Storage com credencial.
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv } = UI;

  function documentoView(id) {
    const todos = App.documentosAll();
    const d = todos.find((x) => String(x.id) === String(id));
    if (!d) return App.missingPage("Documento não encontrado", "Este documento não existe, está inativo ou você não tem acesso a ele.", "#/documentos", "Voltar aos documentos");
    const relacionados = todos.filter((x) => x.id !== d.id && (x.tipo === d.tipo || x.setor === d.setor)).concat(todos.filter((x) => x.id !== d.id)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2);
    const restrito = !!d.setorId; // restrito a setor: sem download, só a tela de leitura
    const baixar = !restrito && App.can("download")
      ? `<button data-action="download-doc" data-id="${esc(d.id)}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("download", "w-4 h-4")} Baixar ${d.ext === "pdf" ? "PDF" : "documento"}</button>`
      : `<button class="btn-outline w-full py-2.5 opacity-50 cursor-not-allowed flex items-center justify-center gap-2" title="${restrito ? "Documento somente visualização" : "Seu papel não permite download"}">${icon("lock", "w-4 h-4")} ${restrito ? "Download bloqueado" : "Baixar (sem permissão)"}</button>`;
    return {
      title: "Visualização de Documento",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs", route: "#/documentos" }, { label: esc(d.titulo) }])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
            <span class="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2"><button type="button" class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button type="button" class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar">+</button></div>
          </div>
          <div class="pdf-scroll">${UI.paginaDoc(d)}</div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações do Arquivo</h3>
            <div class="space-y-3 text-sm">
              ${kv("Versão Atual", esc(d.versao))} ${kv("Criado por", esc(d.enviadoPor))} ${kv("Setor Responsável", esc(d.setor || "Todos"))}
              ${kv("Última Atualização", esc(d.atualizado))} ${kv("Tamanho", esc(d.tamanho))}
            </div>
            <div class="mt-5 space-y-2">
              ${baixar}
              ${restrito ? "" : `<button data-action="open-doc-url" data-id="${esc(d.id)}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("eye", "w-4 h-4")} Abrir arquivo original</button>`}
              <button data-action="print-doc" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("printer", "w-4 h-4")} Imprimir Documento</button>
            </div>
            <p class="text-xs text-slate-400 mt-3">O link do arquivo é gerado na hora e vale por 60 segundos.</p>
          </div>
          ${relacionados.length ? `<div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">DOCUMENTOS RELACIONADOS</h3><div class="space-y-3">
            ${relacionados.map((r) => `<a href="#/documentos/${esc(r.id)}${r.setorId ? "/restrito" : ""}" class="card block p-4 hover:shadow-md">${badge("blue", esc(r.tipo))}<div class="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">${esc(r.titulo)}</div></a>`).join("")}</div></div>` : ""}
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { documentoView });
})();
