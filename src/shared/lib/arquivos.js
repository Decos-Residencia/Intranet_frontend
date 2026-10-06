/* =========================================================================
   Arquivos gerados no navegador (download real)
   Download genérico (CSV, .ics) e copiar texto.
   ========================================================================= */
(function () {
  /* ---------- arquivos gerados no navegador (download real) ---------- */
  function downloadFile(nome, conteudo, mime) {
    const url = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function copiar(texto, msg) {
    const ok = () => App.toast(msg || "Copiado!");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).then(ok, ok);
    else { const t = document.createElement("textarea"); t.value = texto; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (_) {} t.remove(); ok(); }
  }

  Object.assign(App, { downloadFile, copiar });
})();
