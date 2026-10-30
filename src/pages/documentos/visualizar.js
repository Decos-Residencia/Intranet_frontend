/* =========================================================================
   Tela: Detalhes do Documento
   Rota: #/documentos/:id
   O PDF vigente é desenhado na própria tela (GET /documentos/{id}/conteudo, sem link de download).
   Documento "somente visualização": sem baixar, abrir original, imprimir ou copiar — o servidor
   também recusa o download. Restrito a setor usa a prévia protegida (restrito.js).
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv } = UI;

  // Faixa e legenda de segurança (iguais na tela comum e na de restrito).
  function faixaSomenteLeitura(d) {
    return `<div class="card p-5 mb-6 doc-restrito-topo" role="note">
      <span class="restrito-icon">${icon("lock", "w-5 h-5")}</span>
      <div class="flex-1 min-w-0"><div class="font-extrabold text-slate-800 dark:text-slate-100">DOCUMENTO COM RESTRIÇÃO DE SEGURANÇA (SOMENTE LEITURA)</div>
        <p class="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Este arquivo é de leitura na intranet${d.setor ? ` e de circulação restrita ao setor <b>${esc(d.setor)}</b>` : ""}. Cópia, impressão e download estão desabilitados para garantir a integridade da versão vigente.</p></div>
      ${badge("red", "RESTRITO")}</div>`;
  }
  function legendas(somenteLeitura) {
    const linha = (ativo, selo, texto) => `<div class="legenda-seg ${ativo ? "legenda-seg-on" : ""}">
      <div class="flex items-center justify-between gap-2">${selo}<span class="text-xs font-bold ${ativo ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}">${ativo ? "ATIVO NESTA TELA" : "NÃO ATIVO"}</span></div>
      <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5">${texto}</p></div>`;
    return `<div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Legendas de segurança</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Identificação rápida do nível de privacidade dos documentos da intranet.</p>
      <div class="space-y-2">
        ${linha(somenteLeitura, `<span class="perm-badge perm-view">${icon("eye", "w-3.5 h-3.5")} Somente visualização</span>`, "Documento crítico de circulação restrita. Download e cópia bloqueados por segurança.")}
        ${linha(!somenteLeitura, `<span class="perm-badge perm-download">${icon("download", "w-3.5 h-3.5")} Download disponível</span>`, "Manuais de uso comum e formulários. Permitem baixar uma cópia.")}
      </div></div>`;
  }

  // Desenha o PDF real dentro do visualizador; sem PDF (ou se falhar), fica o resumo.
  async function mostrarConteudo(d, raiz) {
    const folha = raiz.querySelector("[data-doc-folha]"), pagina = raiz.querySelector("[data-doc-pagina]");
    if (d.ext !== "pdf" && d.mime !== "application/pdf") return;
    const caixa = document.createElement("div");
    caixa.className = "pdf-paginas";
    caixa.setAttribute("aria-busy", "true");
    try {
      folha.after(caixa);
      await App.abrirPdf(d.apiId || d.id, caixa, { aoPaginar: (a, t) => { if (pagina) pagina.textContent = `Pág. ${a} de ${t}`; } });
      if (!document.contains(caixa)) return;
      caixa.setAttribute("aria-busy", "false");
      folha.hidden = true; // o resumo some: agora aparece o documento de verdade
    } catch (_) {
      caixa.remove();
      if (pagina) pagina.textContent = "";
    }
  }

  // Somente leitura: bloqueia Ctrl/Cmd+P, S e C enquanto a tela está aberta (e a impressão sai em branco).
  function protegerTela() {
    const teclas = (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c"].includes(k)) {
        e.preventDefault();
        App.toast(k === "c" ? "Cópia não permitida neste documento." : k === "p" ? "Impressão não permitida neste documento." : "Download não permitido neste documento.");
      }
    };
    document.addEventListener("keydown", teclas, true);
    document.body.classList.add("doc-restrito-aberto");
    window.addEventListener("hashchange", () => {
      document.removeEventListener("keydown", teclas, true);
      document.body.classList.remove("doc-restrito-aberto");
    }, { once: true });
  }

  function documentoView(id) {
    const todos = App.documentosAll();
    const d = todos.find((x) => String(x.id) === String(id));
    if (!d) return App.missingPage("Documento não encontrado", "Este documento não existe, está inativo ou você não tem acesso a ele.", "#/documentos", "Voltar aos documentos");
    if (d.setorId) return Pages.documentoRestrito(id); // restrito a setor: prévia protegida
    const relacionados = todos.filter((x) => x.id !== d.id && (x.tipo === d.tipo || x.setor === d.setor)).concat(todos.filter((x) => x.id !== d.id)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 2);
    const leitura = d.somenteVisualizacao;
    const baixar = App.can("download")
      ? `<button data-action="download-doc" data-id="${esc(d.id)}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("download", "w-4 h-4")} Baixar ${d.ext === "pdf" ? "PDF" : "documento"}</button>`
      : !App.state.auth ? `<button type="button" data-action="entrar" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("lock", "w-4 h-4")} Entrar para baixar</button>`
      : `<button class="btn-outline w-full py-2.5 opacity-50 cursor-not-allowed flex items-center justify-center gap-2" title="Seu papel não permite download">${icon("lock", "w-4 h-4")} Baixar (sem permissão)</button>`;
    return {
      title: "Visualização de Documento",
      titleCrimson: leitura,
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs", route: "#/documentos" }, { label: esc(d.titulo) + (leitura ? " (somente leitura)" : "") }])}
      ${leitura ? faixaSomenteLeitura(d) : ""}
      <div class="card p-6 mb-6">
        <div class="flex items-center gap-2 flex-wrap mb-2">${badge("blue", esc(d.tipo || "Documento"))}
          ${d.vigente ? badge("green", `Versão ${esc(d.versao)} · vigente`) : badge("gray", `Versão ${esc(d.versao)} · antiga`)}</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${esc(d.titulo)}</h2>
        <p class="text-slate-600 dark:text-slate-300 mt-2 max-w-3xl">${esc(d.desc || "Sem descrição.")}</p>
        ${d.vigente ? "" : `<div class="doc-antiga-aviso mt-4" role="note">${icon("alert-triangle", "w-5 h-5 shrink-0")}<span><b>Este documento não tem versão em vigor.</b> O arquivo exibido é uma versão antiga; confirme com o setor responsável antes de usar.</span></div>`}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6"><div class="card overflow-hidden doc-viewer" id="doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
            <span class="flex items-center gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">${leitura ? `<span class="text-crimson">${icon("lock", "w-4 h-4")}</span>` : ""}${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2"><button type="button" class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir" aria-label="Diminuir zoom">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button type="button" class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar" aria-label="Aumentar zoom">+</button>
              <span class="text-sm text-slate-500 dark:text-slate-400 ml-2" data-doc-pagina aria-live="polite"></span></div>
          </div>
          <div class="pdf-scroll pdf-scroll-leitor ${leitura ? "no-copy" : ""}" tabindex="0" role="region" aria-label="Conteúdo do documento ${esc(d.titulo)}" ${leitura ? `oncontextmenu="return false"` : ""}><div data-doc-folha>${UI.paginaDoc(d)}</div></div>
          ${leitura ? `<div class="doc-print-aviso">Documento somente para visualização: a impressão não é permitida.</div>` : ""}
        </div>${UI.sobreDoc(d)}</div>
        <aside class="space-y-6">
          <div class="card p-6">
            <div class="flex items-center justify-between gap-2 mb-4"><h3 class="font-bold text-slate-800 dark:text-slate-100">Informações do arquivo</h3>${leitura ? badge("red", "LEITURA APENAS") : ""}</div>
            <div class="space-y-3 text-sm">
              ${kv("Versão atual", `${esc(d.versao)}${d.vigente ? " (vigente)" : ""}`)} ${kv("Criado por", esc(d.enviadoPor))} ${kv("Setor responsável", esc(d.setor || "Todos"))}
              ${kv("Última atualização", esc(d.atualizado))} ${kv("Tamanho", esc(d.tamanho))}
            </div>
            ${leitura ? `<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><div class="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2">STATUS DE COMPLIANCE</div>
              <span class="perm-badge perm-download">● ${d.vigente ? "Vigente e validado" : "Sem versão vigente"}</span></div>`
            : `<div class="mt-5 space-y-2">
              ${baixar}
              <button data-action="open-doc-url" data-id="${esc(d.id)}" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("eye", "w-4 h-4")} Abrir arquivo original</button>
              <button data-action="print-doc" class="btn-outline w-full py-2.5 flex items-center justify-center gap-2">${icon("printer", "w-4 h-4")} Imprimir documento</button>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-3">O link do arquivo é gerado na hora e vale por 60 segundos.</p>`}
          </div>
          ${legendas(leitura)}
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Versões ${d.totalVersoes > 1 ? `(${d.totalVersoes})` : ""}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">A vigente é a que vale. As antigas ficam disponíveis só para consulta.</p>
            <div id="doc-versoes"></div>
          </div>
          ${relacionados.length ? `<div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">DOCUMENTOS RELACIONADOS</h3><div class="space-y-3">
            ${relacionados.map((r) => `<a href="#/documentos/${esc(r.id)}${r.setorId ? "/restrito" : ""}" class="card block p-4 hover:shadow-md">${badge("blue", esc(r.tipo))}<div class="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">${esc(r.titulo)}</div></a>`).join("")}</div></div>` : ""}
        </aside>
      </div>`,
      init() {
        // Somente leitura: o histórico mostra as versões, mas sem abrir os arquivos.
        App.montarVersoes(document.getElementById("doc-versoes"), d.id, { podeAbrir: !leitura });
        if (leitura) protegerTela();
        mostrarConteudo(d, document.getElementById("doc-viewer"));
      },
    };
  }

  Object.assign(Pages, { documentoView });
  Object.assign(UI, { legendasSeguranca: legendas, mostrarConteudoDoc: mostrarConteudo });
})();
