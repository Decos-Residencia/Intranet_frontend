/* =========================================================================
   Item de notificação
   Painel do sino e Central de Notificações.
   ========================================================================= */
(function () {
  const { icon, esc } = UI;

  // Item de notificação (painel do sino e central). Urgente ganha faixa e
  // selo vermelhos para não se perder entre os avisos comuns.
  function notifItem(n, lida, attrs, compacto) {
    return `<a href="${n.rota || "#/dashboard"}" ${attrs} data-nid="${n.id}" data-tipo="${n.tipo}" data-lida="${lida}"
      class="notif-item ${lida ? "" : "notif-unread"} ${n.urgente ? "notif-urgent" : ""}">
      <span class="notif-icon">${icon(n.icone, "w-5 h-5")}</span>
      <div class="flex-1 min-w-0">
        ${n.urgente ? `<span class="badge badge-red mb-1 inline-block">🔥 URGENTE</span>` : ""}
        <div class="font-bold ${compacto ? "text-sm" : ""} ${lida ? "text-slate-700 dark:text-slate-200" : "text-wine"}">${esc(n.titulo)}</div>
        <div class="${compacto ? "text-xs" : "text-sm"} text-slate-500 dark:text-slate-400">${esc(n.texto)}</div>
        <div class="${compacto ? "text-[11px]" : "text-xs"} text-slate-400 mt-1">${esc(n.tempo)}</div></div>
      ${lida ? "" : `<span class="w-2 h-2 rounded-full ${n.urgente ? "bg-red-500" : "bg-wine"} mt-2 shrink-0"></span>`}
    </a>`;
  }

  Object.assign(UI, { notifItem });
})();
