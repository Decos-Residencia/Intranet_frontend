/* =========================================================================
   Tela: Visualizar Documento Restrito
   Rota: #/admin/documentos/:id/restrito
   ========================================================================= */
(function () {
  const { icon, breadcrumb, esc, kv } = UI;

  function adminDocumentoRestrito(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id)) || DB.documentos[0];
    return {
      title: "Visualização de Documento",
      titleCrimson: true,
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs",route: App.can("manage_docs") ? "#/admin/documentos" : "#/documentos"},{label:esc(d.titulo) + " (RESTRITO)"}])}
      <div class="card p-5 mb-6 ring-1 ring-crimson/40 flex items-center gap-4">
        <span class="restrito-icon">${icon("x","w-5 h-5")}</span>
        <div class="flex-1"><div class="font-bold text-slate-800 dark:text-slate-100">DOCUMENTO COM RESTRIÇÃO DE SEGURANÇA (SOMENTE LEITURA)</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Este arquivo contém diretrizes de compliance restritas à visualização interna. De acordo com as normas da SCIH, ações de cópia, impressão e download estão desabilitadas para garantir a integridade das versões ativas.</div></div>
        <span class="badge badge-red">RESTRITO</span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <span class="flex items-center gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200 truncate"><span class="text-crimson">${icon("lock","w-4 h-4")}</span> ${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2"><button class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar">+</button></div>
          </div>
          <div class="pdf-scroll no-copy">${UI.pdfMock(d)}</div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-slate-800 dark:text-slate-100">Informações do Arquivo</h3><span class="badge badge-gray">LEITURA APENAS</span></div>
            <div class="space-y-3 text-sm">${kv("Versão Atual",esc(d.versao))}${kv("Criado por",esc(d.criadoPor))}${kv("Setor Responsável",esc(d.setor))}${kv("Última Atualização",esc(d.atualizado))}${kv("Tamanho",esc(d.tamanho))}</div>
            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><div class="text-xs font-bold tracking-wider text-slate-400 mb-2">STATUS DE COMPLIANCE</div>
            <span class="perm-badge perm-download">● Vigente e Validado SCIH</span></div>
          </div>
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2">Legendas de Segurança</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Este painel serve para identificação rápida do nível de privacidade dos documentos da Intranet:</p>
            <div class="space-y-3">
              <div><div class="flex items-center justify-between"><span class="perm-badge perm-view">${icon("eye","w-3.5 h-3.5")} Somente Visualização</span><span class="text-xs font-bold text-slate-500">ATIVO NESTA TELA</span></div>
              <p class="text-xs text-slate-400 mt-1">Documento crítico de circulação restrita. Downloads e cópias bloqueados para segurança.</p></div>
              <div><div class="flex items-center justify-between"><span class="perm-badge perm-download">${icon("download","w-3.5 h-3.5")} Download Disponível</span><span class="text-xs font-bold text-slate-400">NÃO ATIVO</span></div>
              <p class="text-xs text-slate-400 mt-1">Manuais de suporte comum e formulários públicos. Permitem baixar cópia em PDF.</p></div>
            </div>
          </div>
        </aside>
      </div>`,
    };
  }

  Object.assign(PagesAdmin, { adminDocumentoRestrito });
})();
