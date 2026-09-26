/* =========================================================================
   Arquivos gerados no navegador (download real)
   Download genérico, PDF mínimo sem biblioteca e copiar texto.
   ========================================================================= */
(function () {
  /* ---------- arquivos gerados no navegador (download real) ---------- */
  function downloadFile(nome, conteudo, mime) {
    const url = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // PDF mínimo de uma página (Helvetica/WinAnsi), sem biblioteca externa.
  function makePdf(titulo, linhas) {
    const latin = (t) => String(t).replace(/[•–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x00-\xff]/g, "");
    const pdfEsc = (t) => latin(t).replace(/[\\()]/g, (m) => "\\" + m);
    const wrap = (t, n) => { const out = []; let cur = "";
      String(t).split(/\s+/).forEach((w) => { if ((cur + " " + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
      if (cur) out.push(cur); return out.length ? out : [""]; };
    let y = 790;
    const ops = [`BT /F2 15 Tf 50 ${y} Td (${pdfEsc(titulo)}) Tj ET`];
    y -= 28;
    linhas.forEach((l) => { const bold = l.startsWith("#"); const txt = bold ? l.slice(1) : l;
      wrap(txt, 95).forEach((w) => { if (y < 50) return; ops.push(`BT /${bold ? "F2" : "F1"} 10.5 Tf 50 ${y} Td (${pdfEsc(w)}) Tj ET`); y -= 15; });
      y -= 6; });
    const stream = ops.join("\n");
    const objs = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];
    let out = "%PDF-1.4\n"; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([Uint8Array.from(out, (c) => c.charCodeAt(0) & 0xff)], { type: "application/pdf" });
  }

  function copiar(texto, msg) {
    const ok = () => App.toast(msg || "Copiado!");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).then(ok, ok);
    else { const t = document.createElement("textarea"); t.value = texto; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (_) {} t.remove(); ok(); }
  }

  Object.assign(App, { downloadFile, makePdf, copiar });
})();
