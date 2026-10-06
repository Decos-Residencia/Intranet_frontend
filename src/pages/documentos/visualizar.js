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
    const relacionados = todos.filter((x) => x.id !== d.id && (x.tipo === d.tipo)).slice(0, 3);
    return {
      title: "Detalhes do Documento",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs", route: "#/documentos" }, { label: esc(d.titulo) }])}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="p-10 text-center">
            ${UI.iconeArquivoDoc(d.ext, "mx-auto mb-4")}
            <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">${esc(d.titulo)}</h3>
            <div class="mb-3">${badge("blue", esc(d.tipo || "Documento"))} ${badge("gray", "v" + esc(d.versao))}</div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">${esc(d.desc || "Sem descrição.")}</p>
            <div class="flex gap-3 justify-center flex-wrap">
              <button data-action="open-doc-url" data-id="${esc(d.id)}" class="btn-wine px-6 py-2.5 inline-flex items-center gap-2">${icon("eye", "w-4 h-4")} Abrir</button>
              ${App.can("download") ? `<button data-action="download-doc" data-id="${esc(d.id)}" class="btn-outline px-6 py-2.5 inline-flex items-center gap-2">${icon("download", "w-4 h-4")} Baixar</button>` : ""}
            </div>
            <p class="text-xs text-slate-400 mt-4">O link de acesso é gerado na hora e vale por 60 segundos.</p>
          </div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações do Arquivo</h3>
            <div class="space-y-3 text-sm">
              ${kv("Arquivo", esc(d.arquivo))} ${kv("Tamanho", esc(d.tamanho))} ${kv("Versão", esc(d.versao))}
              ${kv("Acesso", d.setor ? `Setor ${esc(d.setor)}` : "Todos os colaboradores")} ${kv("Atualizado em", esc(d.atualizado))} ${kv("Enviado por", esc(d.enviadoPor))}
            </div>
          </div>
          ${relacionados.length ? `<div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">MESMA CATEGORIA</h3><div class="space-y-3">
            ${relacionados.map((r) => `<a href="#/documentos/${esc(r.id)}" class="card block p-4 hover:shadow-md">${badge("blue", esc(r.tipo))}<div class="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">${esc(r.titulo)}</div></a>`).join("")}</div></div>` : ""}
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { documentoView });
})();
