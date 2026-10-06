/* =========================================================================
   Abrir/baixar documento (URL assinada). O .ics de eventos fica em features/eventos.js
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
  Object.assign(App, { abrirDocumento, baixarDocumento });
})();
