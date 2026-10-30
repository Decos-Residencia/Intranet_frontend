/* =========================================================================
   Tela: Validade de documentos (gestores de documentos)
   Rota: #/admin/validades
   Fonte: GET /documentos/validades?dias=N. Vencidos primeiro; o responsável recebe alertas
   faltando 30 e 7 dias e no vencimento (gerados pelo servidor).
   ========================================================================= */
(function () {
  const { icon, esc } = UI;
  const JANELAS = [[30, "30 dias"], [60, "60 dias"], [180, "6 meses"], [365, "12 meses"]];

  function adminValidades() {
    const estado = { dias: 60 };
    async function carregar() {
      const corpo = document.getElementById("val-rows"), info = document.getElementById("val-info");
      if (!corpo) return;
      try {
        const itens = await Services.documentos.validades(estado.dias);
        if (!document.contains(corpo)) return;
        const vencidos = itens.filter((d) => d.dias_restantes <= 0).length;
        info.textContent = `${itens.length} ${itens.length === 1 ? "documento" : "documentos"} · ${vencidos} ${vencidos === 1 ? "vencido" : "vencidos"}`;
        corpo.innerHTML = itens.length ? itens.map((d) => `<tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="py-3 pl-4">${PagesAdmin.seloValidade(d.revisar_em, d.dias_restantes)}</td>
          <td><a href="#/admin/documentos/${d.id}/editar" class="font-semibold text-slate-800 dark:text-slate-100 hover:underline">${esc(d.titulo)}</a>
            <div class="text-xs text-slate-500 dark:text-slate-400">${esc(d.categoria)} · v${esc(d.versao)}${d.setor ? ` · ${esc(d.setor)}` : ""}</div></td>
          <td class="text-sm text-slate-600 dark:text-slate-300">${esc(d.revisar_em.split("-").reverse().join("/"))}</td>
          <td class="text-sm text-slate-600 dark:text-slate-300 pr-4">${esc(d.responsavel || "Quem gerencia documentos")}</td></tr>`).join("")
          : `<tr><td colspan="4" class="py-10 text-center text-slate-500 dark:text-slate-400">Nenhuma revisão vencida ou vencendo nesse período.</td></tr>`;
      } catch (err) {
        if (document.contains(corpo)) corpo.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar. ${esc(err.message || "")}</td></tr>`;
      }
    }
    return {
      title: "Validade de documentos",
      html: `<div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Validade de documentos</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Revisões vencidas e próximas. O responsável recebe notificação e e-mail faltando 30 dias, 7 dias e no vencimento. Defina "Revisar até" e o responsável no formulário do documento.</p></div>
        <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div class="flex gap-2 flex-wrap" role="group" aria-label="Período">${JANELAS.map(([d, l]) => `<button type="button" class="chip ${d === 60 ? "chip-active" : ""}" data-val-dias="${d}" aria-pressed="${d === 60}">${l}</button>`).join("")}</div>
          <span id="val-info" class="text-sm text-slate-500 dark:text-slate-400" aria-live="polite"></span></div>
        <div class="card overflow-x-auto" tabindex="0" role="region" aria-label="Revisões de documentos"><table class="w-full text-sm text-left">
          <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th scope="col" class="py-3 pl-4">PRAZO</th><th scope="col">DOCUMENTO</th><th scope="col">REVISAR ATÉ</th><th scope="col" class="pr-4">RESPONSÁVEL</th></tr></thead>
          <tbody id="val-rows"><tr><td colspan="4" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>
        <a href="#/admin/documentos" class="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-wine dark:text-pink-300 hover:underline">${icon("file-text", "w-4 h-4")} Ir para Gerenciar Documentos</a>`,
      init() {
        document.querySelectorAll("[data-val-dias]").forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll("[data-val-dias]").forEach((x) => { x.classList.toggle("chip-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
          estado.dias = Number(b.dataset.valDias); carregar();
        }));
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminValidades });
})();
