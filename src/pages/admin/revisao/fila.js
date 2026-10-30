/* =========================================================================
   Tela: Revisão de publicações (quem tem "aprovar publicações")
   Rota: #/admin/revisao
   Fonte: GET /revisao. Aprovar publica (ou agenda, se o aviso tiver data desejada); devolver
   pede um motivo, que vai para o autor numa notificação.
   ========================================================================= */
(function () {
  const { icon, esc, badge } = UI;

  function cartao(i) {
    const quando = i.publicar_em
      ? (i.tipo === "aviso" ? `Publicar em ${UI.fmtDataHora(i.publicar_em)}` : `Acontece em ${UI.fmtDataHora(i.publicar_em)}`)
      : "Publicar ao aprovar";
    const editar = i.tipo === "aviso" ? `#/admin/noticias/${i.id}/editar` : `#/admin/eventos/${i.id}/editar`;
    return `<li class="card revisao-item" data-item="${i.tipo}-${i.id}">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="min-w-0"><div class="flex items-center gap-2 flex-wrap mb-1">${badge(i.tipo === "aviso" ? "blue" : "teal", i.tipo === "aviso" ? "Aviso" : "Evento")}
          <span class="text-xs text-slate-500 dark:text-slate-400">por ${esc(i.autor || "—")}${i.enviado_em ? ` · enviado em ${esc(UI.fmtDataHora(i.enviado_em))}` : ""}</span></div>
          <h3 class="font-bold text-slate-800 dark:text-slate-100">${esc(i.titulo)}</h3>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${icon("clock", "w-3.5 h-3.5 inline -mt-0.5")} ${esc(quando)}</div></div>
        <a href="${editar}" class="btn-outline text-xs px-3 py-1.5">${icon("eye", "w-3.5 h-3.5")} Ver completo</a>
      </div>
      <p class="revisao-previa">${esc(i.previa)}${i.previa.length >= 240 ? "…" : ""}</p>
      <div class="flex gap-2 flex-wrap justify-end">
        <button type="button" class="btn-outline px-4" data-devolver="${i.tipo}:${i.id}" data-titulo="${esc(i.titulo)}">${icon("rotate-ccw", "w-4 h-4")} Devolver</button>
        <button type="button" class="btn-wine px-4" data-aprovar="${i.tipo}:${i.id}">${icon("check", "w-4 h-4")} Aprovar</button>
      </div></li>`;
  }

  function devolver(tipo, id, titulo, depois) {
    App.openPanel(`Devolver: ${esc(titulo)}`, `<form id="rev-form" class="space-y-4" novalidate>
      <p class="text-sm text-slate-600 dark:text-slate-300">O conteúdo volta a rascunho e o autor recebe o motivo numa notificação.</p>
      <div><label class="field-label" for="rev-motivo">MOTIVO *</label>
        <textarea id="rev-motivo" class="field-input" rows="4" maxlength="500" placeholder="Ex.: Corrigir o horário e incluir o ramal para dúvidas."></textarea></div>
      <p id="rev-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">Devolver ao autor</button></form>`);
    const form = document.getElementById("rev-form"), erro = document.getElementById("rev-erro");
    document.getElementById("rev-motivo").focus();
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const motivo = document.getElementById("rev-motivo").value.trim();
      if (motivo.length < 5) { erro.textContent = "Escreva o motivo (pelo menos 5 caracteres)."; erro.classList.remove("hidden"); return; }
      try { await Services.revisao.devolver(tipo, id, motivo); App.closePanel(); App.toast("Devolvido ao autor"); depois(); }
      catch (err) { erro.textContent = err.message || "Não foi possível devolver."; erro.classList.remove("hidden"); }
    });
  }

  function adminRevisao() {
    async function carregar() {
      const lista = document.getElementById("rev-lista"), resumo = document.getElementById("rev-resumo");
      if (!lista) return;
      try {
        const fila = await Services.revisao.fila();
        if (!document.contains(lista)) return;
        App.state.api.revisaoPendentes = fila.length;
        resumo.textContent = fila.length ? `${fila.length} ${fila.length === 1 ? "item aguardando" : "itens aguardando"} aprovação` : "";
        lista.innerHTML = fila.length ? fila.map(cartao).join("")
          : `<li class="card p-10 text-center"><div class="painel-vazio justify-center">${icon("check", "w-4 h-4")} Nada para revisar. Tudo em dia!</div></li>`;
      } catch (err) {
        lista.innerHTML = `<li class="card p-8 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar a fila. ${esc(err.message || "")}</li>`;
      }
    }
    return {
      title: "Revisão de publicações",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Revisão de publicações</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Avisos e eventos enviados por quem não publica direto. Nada aparece para os colaboradores antes da aprovação.</p>
        <p id="rev-resumo" class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2" aria-live="polite"></p></div>
      <ul id="rev-lista" class="space-y-4"><li class="card p-10 text-center text-slate-500 dark:text-slate-400">Carregando…</li></ul>`,
      init() {
        document.getElementById("rev-lista").addEventListener("click", async (ev) => {
          const ap = ev.target.closest("[data-aprovar]"), dv = ev.target.closest("[data-devolver]");
          if (ap) {
            const [tipo, id] = ap.dataset.aprovar.split(":");
            ap.disabled = true;
            try {
              const r = await Services.revisao.aprovar(tipo, id);
              App.toast(r.status === "AGENDADO" ? "Aprovado e agendado" : "Aprovado e publicado");
              carregar(); App.loadApiData?.();
            } catch (err) { App.toast(err.message || "Não foi possível aprovar."); ap.disabled = false; }
          } else if (dv) {
            const [tipo, id] = dv.dataset.devolver.split(":");
            devolver(tipo, id, dv.dataset.titulo, carregar);
          }
        });
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminRevisao });
})();
