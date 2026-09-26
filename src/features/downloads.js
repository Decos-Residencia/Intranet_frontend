/* =========================================================================
   Baixar documento (PDF/DOC) e adicionar evento à agenda (.ics)
   ========================================================================= */
(function () {
  function baixarDocumento(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id));
    if (!d) return;
    if (!d.download || !App.can("download")) { App.toast("Download não permitido para este documento"); return; }
    const linhas = [
      "HOSPITAL DECÓS CORPORATIVO - Sistema de Gestão da Qualidade", "",
      `#Tipo: ${d.tipo}   Versão: ${d.versao}`, `Setor responsável: ${d.setor}   Criado por: ${d.criadoPor}`,
      `Última atualização: ${d.atualizado}`, "", "#Resumo", d.desc, "",
      "#Observação", "Cópia gerada pela Intranet Decós. Consulte sempre a versão vigente na Central de Documentos.",
      `Baixado por ${DB.usuario.nome} (${DB.usuario.matricula}).`,
    ];
    if (d.icone === "W") {
      const html = `<html><head><meta charset="utf-8"></head><body><h1>${UI.esc(d.titulo)}</h1>${linhas.map((l) => `<p>${UI.esc(l.replace(/^#/, ""))}</p>`).join("")}</body></html>`;
      App.downloadFile(d.arquivo.replace(/\.docx$/i, ".doc"), html, "application/msword");
    } else {
      App.downloadFile(d.arquivo.endsWith(".pdf") ? d.arquivo : d.arquivo + ".pdf", App.makePdf(d.titulo, linhas));
    }
    App.toast(`Baixando ${d.arquivo}`);
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

  Object.assign(App, { baixarDocumento, baixarIcs });
})();
