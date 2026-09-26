/* =========================================================================
   Modal de confirmação
   ========================================================================= */
(function () {
  let confirmCb = null;
  function openConfirm(title, msg, onOk) {
    let m = document.getElementById("modal");
    if (!m) { m = document.createElement("div"); m.id = "modal"; document.body.appendChild(m); }
    m.innerHTML = `<div class="modal-backdrop" data-action="confirm-no"></div>
      <div class="modal-card">
        <div class="modal-icon">${UI.icon("alert-triangle", "w-6 h-6")}</div>
        <h3 class="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-1 text-center">${title}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-5 text-center">${msg}</p>
        <div class="flex gap-3 justify-center">
          <button data-action="confirm-no" class="btn-outline px-5 py-2.5">Cancelar</button>
          <button data-action="confirm-yes" class="btn-danger px-5 py-2.5">Sim, excluir</button>
        </div></div>`;
    requestAnimationFrame(() => m.classList.add("open"));
    confirmCb = onOk;
  }
  function closeModal() { document.getElementById("modal")?.classList.remove("open"); confirmCb = null; }
  function confirmYes() { const cb = confirmCb; App.closeModal(); cb && cb(); }

  Object.assign(App, { openConfirm, closeModal, confirmYes });
})();
