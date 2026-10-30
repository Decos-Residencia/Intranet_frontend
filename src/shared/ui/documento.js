/* =========================================================================
   Peças de documento
   Linha chave/valor do visualizador e histórico de versões (vigente x antiga),
   usado na visualização do colaborador e no formulário do gestor.
   ========================================================================= */
(function () {
  const { esc } = UI;

  function kv(k, v) {
    return `<div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2"><span class="text-slate-500 dark:text-slate-400">${k}:</span><span class="font-bold text-slate-800 dark:text-slate-100 text-right">${v}</span></div>`;
  }

  const tamanho = (n) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);

  function itemVersao(docId, v, gerir, podeAbrir) {
    const selo = v.vigente
      ? `<span class="badge badge-green">${UI.icon("check", "w-3 h-3 inline")} Vigente</span>`
      : `<span class="badge badge-gray">Versão antiga</span>`;
    return `<li class="versao-item ${v.vigente ? "versao-vigente" : ""}">
      <div class="flex items-center gap-2 flex-wrap"><span class="font-extrabold text-slate-800 dark:text-slate-100">Versão ${esc(v.rotulo)}</span>${selo}</div>
      <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${esc(UI.fmtDataHora(v.enviado_em))} · ${esc(v.enviado_por || "—")} · ${esc(v.arquivo_nome)} · ${tamanho(v.tamanho_bytes)}</div>
      ${v.observacao ? `<p class="text-sm text-slate-600 dark:text-slate-300 mt-1">${esc(v.observacao)}</p>` : ""}
      <div class="flex gap-2 flex-wrap mt-2">
        ${podeAbrir ? `<button type="button" class="btn-outline text-xs px-3" data-action="open-doc-url" data-id="${esc(docId)}" data-versao="${v.id}" ${v.vigente ? "" : `data-antiga="1"`}>${UI.icon("eye", "w-3.5 h-3.5")} Abrir</button>` : ""}
        ${gerir && !v.vigente ? `<button type="button" class="btn-outline text-xs px-3" data-doc-vigente="${v.id}" data-rotulo="${esc(v.rotulo)}">Tornar vigente</button>` : ""}
      </div>
    </li>`;
  }

  // Carrega e desenha o histórico em `alvo`. gerir = mostra "Tornar vigente"; aoMudar = callback.
  async function montarVersoes(alvo, docId, { gerir = false, podeAbrir = true, aoMudar } = {}) {
    if (!alvo) return [];
    alvo.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400">Carregando versões…</p>`;
    let versoes;
    try { versoes = await Services.documentos.versoes(docId); }
    catch (err) { alvo.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar as versões. ${esc(err.message || "")}</p>`; return []; }
    if (!document.contains(alvo)) return versoes;
    const temVigente = versoes.some((v) => v.vigente);
    alvo.innerHTML = `${temVigente ? "" : `<p class="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">${UI.icon("alert-triangle", "w-4 h-4 inline")} Sem versão vigente: este documento só tem versões antigas.</p>`}
      <ul class="space-y-2">${versoes.map((v) => itemVersao(docId, v, gerir, podeAbrir)).join("")}</ul>`;
    alvo.querySelectorAll("[data-doc-vigente]").forEach((btn) => btn.addEventListener("click", () => {
      App.openConfirm("Tornar esta versão vigente?", `A versão ${esc(btn.dataset.rotulo)} passa a ser a exibida para todos. A atual vira "versão antiga" e continua no histórico.`, async () => {
        try {
          await Services.documentos.tornarVigente(docId, btn.dataset.docVigente);
          App.toast(`Versão ${btn.dataset.rotulo} agora é a vigente`);
          await montarVersoes(alvo, docId, { gerir, podeAbrir, aoMudar });
          aoMudar?.();
        } catch (err) { App.toast(err.message || "Não foi possível tornar a versão vigente."); }
      }, "Tornar vigente", "btn-wine");
    }));
    return versoes;
  }

  Object.assign(UI, { kv });
  Object.assign(App, { montarVersoes });
})();
