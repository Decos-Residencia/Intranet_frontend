/* =========================================================================
   Tela: Documento restrito (somente leitura)
   Rota: #/documentos/:id/restrito
   Visual de página de documento (dados reais do cadastro), com zoom e sem botão de baixar.
   Barreira de interface: o backend continua sendo quem autoriza o acesso ao arquivo.
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv } = UI;

  // Página do documento (visual de PDF), montada só com os dados reais do cadastro.
  function paginaDoc(d) {
    return `<div class="pdf-page">
      <div class="text-center mb-4"><h2 class="font-bold text-slate-800 tracking-wide">HOSPITAL DECÓS CORPORATIVO</h2><div class="text-xs tracking-widest text-slate-400">SISTEMA DE GESTÃO DA QUALIDADE</div></div>
      <hr class="mb-4 border-slate-200">
      <h3 class="font-bold text-wine">${esc(d.tipo || "DOCUMENTO")}</h3>
      <div class="font-bold text-slate-700 text-sm">TÍTULO: ${esc(String(d.titulo).toUpperCase())}</div>
      <div class="text-xs text-slate-400 mb-4">Versão: ${esc(d.versao)} • Atualizado em: ${esc(d.atualizado)} • Setor: ${esc(d.setor || "Todos")}</div>
      <p class="text-sm text-slate-500 mb-3">${esc(d.desc || "Sem descrição.")}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">1. OBJETIVO</p>
      <p class="text-sm text-slate-500 mb-3">${esc(d.desc || "Documento institucional do Hospital Decós.")}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">2. CAMPO DE APLICAÇÃO</p>
      <p class="text-sm text-slate-500 mb-3">${d.setor ? `Aplica-se ao setor ${esc(d.setor)} e à administração do hospital.` : "Aplica-se a todos os setores do hospital."}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">3. CONTROLE DO DOCUMENTO</p>
      <p class="text-sm text-slate-500">Versão ${esc(d.versao)} • Enviado por ${esc(d.enviadoPor)} • Arquivo ${esc(d.arquivo)} (${esc(d.tamanho)}) • Última atualização em ${esc(d.atualizado)}.</p>
    </div>`;
  }

  function documentoRestrito(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id));
    if (!d) return App.missingPage("Documento não encontrado", "Este documento não existe, está inativo ou você não tem acesso a ele.", "#/documentos", "Voltar aos documentos");
    const lista = App.can("manage_docs") ? "#/admin/documentos" : "#/documentos";
    return {
      title: "Visualização de Documento",
      titleCrimson: true,
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs", route: lista }, { label: esc(d.titulo) + " (RESTRITO)" }])}
      <div class="card p-5 mb-6 ring-1 ring-crimson/40 flex items-center gap-4">
        <span class="restrito-icon">${icon("x", "w-5 h-5")}</span>
        <div class="flex-1"><div class="font-bold text-slate-800 dark:text-slate-100">DOCUMENTO COM RESTRIÇÃO DE SEGURANÇA (SOMENTE LEITURA)</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Este arquivo é de circulação restrita${d.setor ? ` ao setor <b>${esc(d.setor)}</b>` : ""}. Ações de cópia, impressão e download ficam desabilitadas nesta tela para preservar a integridade da versão vigente.</div></div>
        <span class="badge badge-red">RESTRITO</span>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <span class="flex items-center gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200 truncate"><span class="text-crimson">${icon("lock", "w-4 h-4")}</span> ${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2"><button type="button" class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button type="button" class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar">+</button></div>
          </div>
          <div class="pdf-scroll no-copy" oncontextmenu="return false">${paginaDoc(d)}</div>
        </div>
        <aside class="space-y-6">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-slate-800 dark:text-slate-100">Informações do Arquivo</h3>${badge("gray", "LEITURA APENAS")}</div>
            <div class="space-y-3 text-sm">
              ${kv("Versão Atual", esc(d.versao))} ${kv("Criado por", esc(d.enviadoPor))} ${kv("Setor Responsável", esc(d.setor || "Todos"))}
              ${kv("Última Atualização", esc(d.atualizado))} ${kv("Tamanho", esc(d.tamanho))}
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><div class="text-xs font-bold tracking-wider text-slate-400 mb-2">STATUS DE COMPLIANCE</div>
            <span class="perm-badge perm-download">● ${d.ativo ? "Vigente" : "Inativo"}</span></div>
          </div>
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2">Legendas de Segurança</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Identificação rápida do nível de privacidade dos documentos da Intranet:</p>
            <div class="space-y-3">
              <div><div class="flex items-center justify-between"><span class="perm-badge perm-view">${icon("eye", "w-3.5 h-3.5")} Somente Visualização</span><span class="text-xs font-bold text-slate-500">ATIVO NESTA TELA</span></div>
              <p class="text-xs text-slate-400 mt-1">Documento de circulação restrita. Download e cópia desabilitados nesta tela.</p></div>
              <div><div class="flex items-center justify-between"><span class="perm-badge perm-download">${icon("download", "w-3.5 h-3.5")} Download Disponível</span><span class="text-xs font-bold text-slate-400">NÃO ATIVO</span></div>
              <p class="text-xs text-slate-400 mt-1">Manuais de uso comum e formulários. Permitem baixar uma cópia.</p></div>
            </div>
          </div>
          <a href="#/documentos/${esc(d.id)}" class="btn-outline w-full py-2.5 text-center block">Voltar aos detalhes</a>
        </aside>
      </div>`,
    };
  }

  Object.assign(Pages, { documentoRestrito });
  Object.assign(UI, { paginaDoc });
})();
