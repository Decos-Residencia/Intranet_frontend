/* =========================================================================
   Peças de documento
   Linha chave/valor e a prévia de PDF, usadas no visualizador
   do colaborador, no perfil e nas telas administrativas.
   ========================================================================= */
(function () {
  const { esc } = UI;

  function kv(k, v) {
    return `<div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2"><span class="text-slate-500 dark:text-slate-400">${k}:</span><span class="font-bold text-slate-800 dark:text-slate-100 text-right">${v}</span></div>`;
  }
  function pdfMock(d) {
    return `<div class="pdf-page">
      <div class="text-center mb-4"><h2 class="font-bold text-slate-800 tracking-wide">HOSPITAL DECÓS CORPORATIVO</h2><div class="text-xs tracking-widest text-slate-400">SISTEMA DE GESTÃO DA QUALIDADE</div></div>
      <hr class="mb-4 border-slate-200">
      <h3 class="font-bold text-wine">${esc(d.tipo)}</h3>
      <div class="font-bold text-slate-700 text-sm">TÍTULO: ${esc(d.titulo.toUpperCase())}</div>
      <div class="text-xs text-slate-400 mb-4">Versão: ${esc(d.versao)} • Atualizado em: ${esc(d.atualizado)} • Setor: ${esc(d.setor)}</div>
      <p class="text-sm text-slate-500 mb-3">${esc(d.desc)}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">1. OBJETIVO</p>
      <p class="text-sm text-slate-500 mb-3">Padronizar o processo de higienização das mãos de todos os profissionais de saúde do Hospital Decós, visando prevenir infecções relacionadas à assistência à saúde (IRAS) e garantir a segurança do paciente e da equipe multidisciplinar.</p>
      <p class="font-bold text-sm text-slate-700 mb-1">2. CAMPO DE APLICAÇÃO</p>
      <p class="text-sm text-slate-500 mb-3">Aplica-se a todos os setores assistenciais (UTI Adulto, UTI Neonatal, Centro Cirúrgico, Pronto Atendimento, Unidades de Internação e Ambulatório) e de apoio operacional.</p>
      <p class="font-bold text-sm text-slate-700 mb-1">3. INDICAÇÕES DE HIGIENIZAÇÃO (OS 5 MOMENTOS)</p>
      <p class="text-sm text-slate-500">1. Antes de tocar o paciente; • 2. Antes de realizar procedimento limpo/asséptico; • 3. Após risco de exposição a fluidos corporais; • 4. Após tocar o paciente; • 5. Após tocar superfícies próximas ao paciente.</p>
    </div>`;
  }

  Object.assign(UI, { kv, pdfMock });
})();
