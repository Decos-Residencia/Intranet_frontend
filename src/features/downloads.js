/* =========================================================================
   Abrir/baixar documento (URL assinada) e adicionar evento à agenda (.ics)
   ========================================================================= */
(function () {
  // O arquivo fica no Supabase Storage PRIVADO. O backend valida login e permissão por setor e devolve
  // uma URL assinada de 60 s, usada na hora (nunca guardada). inline=true abre no navegador.
  async function abrirDocumento(id, inline = true) {
    try {
      const r = await Services.documentos.download(id, inline);
      if (!/^https?:\/\//.test(r.url)) throw new Error("Endereço de download inválido.");
      const a = document.createElement("a");
      a.href = r.url; a.rel = "noopener noreferrer";
      if (inline) a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
      return r;
    } catch (err) {
      App.toast(err.message || "Não foi possível abrir o documento.");
      return null;
    }
  }
  async function baixarDocumento(id) {
    if (!App.can("download")) { App.toast("Download não permitido para o seu perfil"); return; }
    const r = await abrirDocumento(id, false);
    if (r) App.toast(`Baixando ${r.arquivo_nome}`);
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
