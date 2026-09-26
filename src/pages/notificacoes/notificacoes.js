/* =========================================================================
   Tela: Central de Notificações
   Rota: #/notificacoes
   ========================================================================= */
(function () {
  const { icon } = UI;
  const { wireList } = Lib;

  function notificacoes() {
    const todas = App.notificacoesAll();
    const items = todas.map((n) => UI.notifItem(n, App.isLida(n), 'data-action="read-notif"')).join("");
    const urgentes = todas.filter((n) => n.urgente).length;
    const naoLidas = App.unreadCount();
    return {
      title: "Notificações",
      html: `
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap" data-filter-group="notif">
          <button class="chip chip-active" data-filter="todas">Todas <span class="ml-1 bg-white/20 rounded-full px-1.5">${todas.length}</span></button>
          <button class="chip" data-filter="unread">Não lidas${naoLidas ? ` (${naoLidas})` : ""}</button>
          <button class="chip" data-filter="urgente">🔥 Urgentes (${urgentes})</button>
          <button class="chip" data-filter="aviso">Avisos</button>
          <button class="chip" data-filter="evento">Eventos</button>
          <button class="chip" data-filter="documento">Documentos & POPs</button>
        </div>
        ${naoLidas ? `<button data-action="mark-read" class="btn-outline text-sm px-4 py-2 flex items-center gap-2">${icon("check-check","w-4 h-4")} Marcar todas como lidas</button>` : ""}
      </div>
      <div class="card divide-y divide-slate-50 dark:divide-slate-800" id="notif-list">${items}</div>`,
      init() {
        wireList({
          containerId: "notif-list", itemSel: ".notif-item", size: 99, label: "notificações", filterGroup: "notif", initialFilter: "todas",
          onEmpty: "Nenhuma notificação neste filtro.",
          filterFn: (el, f) => f === "todas" || (f === "unread" && el.dataset.lida === "false") || el.dataset.tipo === f,
        });
      },
    };
  }

  Object.assign(Pages, { notificacoes });
})();
