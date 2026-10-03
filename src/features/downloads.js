/* =========================================================================
   Baixar documento (PDF/DOC) e adicionar evento à agenda (.ics)
   ========================================================================= */
(function () {
  // O arquivo real está numa URL externa (backend só guarda a URL). Abre em nova
  // aba, sem enviar referrer e sem acesso ao window.opener. Só http(s).
  function abrirDocumento(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id));
    if (!d) { App.toast("Documento não encontrado"); return; }
    let url;
    try { url = new URL(d.url); } catch (_) { url = null; }
    if (!url || !/^https?:$/.test(url.protocol)) { App.toast("O endereço deste documento é inválido"); return; }
    window.open(url.href, "_blank", "noopener,noreferrer");
  }
  function baixarDocumento(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id));
    if (!d) return;
    if (!d.download || !App.can("download")) { App.toast("Download não permitido para este documento"); return; }
    abrirDocumento(id);
    App.toast(`Abrindo ${d.arquivo}`);
  }
  function baixarIcs(ev) {
    if (!ev) return;
    const [ini, fim] = ev.horario.split("-").map((h) => h.trim().replace(":", "") + "00");
    const dia = `202609${ev.dia}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hospital Decos//Intranet//PT", "BEGIN:VEVENT",
      `UID:evento-${ev.id}@decos.com`, `DTSTART:${dia}T${ini}`, `DTEND:${dia}T${fim || ini}`,
      `SUMMARY:${ev.titulo}`, `LOCATION:${ev.local}`, `DESCRIPTION:${ev.desc}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    App.downloadFile(`evento-${ev.id}.ics`, ics, "text/calendar");
    App.toast("Evento adicionado — abra o arquivo para salvar na agenda");
  }

  Object.assign(App, { abrirDocumento, baixarDocumento, baixarIcs });
})();
