/* =========================================================================
   Painel de notificações (sino)
   ========================================================================= */
(function () {
  function openNotifPanel() {
    const items = App.notificacoesAll().map((n) => UI.notifItem(n, App.isLida(n), 'data-action="close-panel"', true)).join("");
    App.openPanel("Notificações", `<div class="flex justify-end mb-2"><button data-action="mark-read" class="text-xs font-bold text-wine">Marcar todas como lidas</button></div>
      <div class="card divide-y divide-slate-50 dark:divide-slate-800">${items}</div>
      <a href="#/notificacoes" data-action="close-panel" class="btn-outline w-full mt-4 py-2.5 justify-center">Ver central de notificações</a>`);
  }

  Object.assign(App, { openNotifPanel });
})();
