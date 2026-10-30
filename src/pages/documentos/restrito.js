/* =========================================================================
   Tela: Documento restrito (prévia protegida)
   Rota: #/documentos/:id/restrito
   O conteúdo abre desfocado e só aparece depois de "Mostrar conteúdo"; volta a se esconder
   quando a pessoa sai da aba. Marca d'água com nome e data/hora de quem está vendo, sem
   download, sem cópia e sem impressão. Barreira de interface: quem autoriza o acesso ao
   arquivo continua sendo o backend (setor do documento).
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc, kv } = UI;

  // Página do documento (visual de PDF), montada só com os dados reais do cadastro.
  function paginaDoc(d) {
    return `<div class="pdf-page">
      <div class="text-center mb-4"><h2 class="font-bold text-slate-800 tracking-wide">HOSPITAL DECÓS CORPORATIVO</h2><div class="text-xs tracking-widest text-slate-400">SISTEMA DE GESTÃO DA QUALIDADE</div></div>
      <hr class="mb-4 border-slate-200">
      <h3 class="font-bold text-wine">${esc(d.tipo || "DOCUMENTO")}</h3>
      <div class="font-bold text-slate-700 text-sm">TÍTULO: ${esc(String(d.titulo).toUpperCase())}</div>
      <div class="text-xs text-slate-400 mb-4">Versão: ${esc(d.versao)} • Atualizado em: ${esc(d.atualizado)} • Setor: ${esc(d.setor || "Todos")}</div>
      <p class="text-sm text-slate-500 mb-3">${esc(d.desc || "Sem descrição.")}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">1. OBJETIVO</p>
      <p class="text-sm text-slate-500 mb-3">${esc(d.desc || "Documento institucional do Hospital Decós.")}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">2. CAMPO DE APLICAÇÃO</p>
      <p class="text-sm text-slate-500 mb-3">${d.setor ? `Aplica-se ao setor ${esc(d.setor)} e à administração do hospital.` : "Aplica-se a todos os setores do hospital."}</p>
      <p class="font-bold text-sm text-slate-700 mb-1">3. CONTROLE DO DOCUMENTO</p>
      <p class="text-sm text-slate-500">Versão ${esc(d.versao)} • Enviado por ${esc(d.enviadoPor)} • Arquivo ${esc(d.arquivo)} (${esc(d.tamanho)}) • Última atualização em ${esc(d.atualizado)}.</p>
    </div>`;
  }

  // Quadro "Sobre este documento", logo abaixo da visualização.
  function sobreDoc(d) {
    const item = (rotulo, valor) => `<div><dt class="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">${rotulo}</dt><dd class="text-sm text-slate-800 dark:text-slate-100 mt-0.5">${valor}</dd></div>`;
    return `<section class="card p-6" aria-labelledby="doc-sobre-h">
      <h3 id="doc-sobre-h" class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">${icon("file-text", "w-5 h-5 text-wine")} Sobre este documento</h3>
      <p class="text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">${esc(d.desc || "Sem descrição.")}</p>
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        ${item("Tipo", esc(d.tipo || "Documento"))}${item("Setor", esc(d.setor || "Todos"))}
        ${item("Versão", `${esc(d.versao)} · ${d.vigente ? "vigente" : "antiga"}`)}${item("Atualizado em", esc(d.atualizado))}
      </dl></section>`;
  }

  // Marca d'água: o mesmo carimbo repetido em diagonal sobre toda a folha.
  function marcaDagua(texto) {
    return `<div class="doc-marca" aria-hidden="true">${Array.from({ length: 24 }, () => `<span>${esc(texto)}</span>`).join("")}</div>`;
  }

  function documentoRestrito(id) {
    const d = App.documentosAll().find((x) => String(x.id) === String(id));
    if (!d) return App.missingPage("Documento não encontrado", "Este documento não existe, está inativo ou você não tem acesso a ele.", "#/documentos", "Voltar aos documentos");
    const lista = App.can("manage_docs") ? "#/admin/documentos" : "#/documentos";
    const quem = App.state.user?.nome || "Colaborador";
    const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const carimbo = `${quem} · ${agora} · RESTRITO`;
    return {
      title: "Documento restrito",
      titleCrimson: true,
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos & POPs", route: lista }, { label: esc(d.titulo) + " (restrito)" }])}
      <div class="card p-5 mb-6 doc-restrito-topo">
        <span class="restrito-icon">${icon("lock", "w-5 h-5")}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">${badge("red", "RESTRITO")} ${badge("blue", esc(d.tipo || "Documento"))}
            ${d.vigente ? badge("green", `Versão ${esc(d.versao)} · vigente`) : badge("gray", `Versão ${esc(d.versao)} · antiga`)}</div>
          <h2 class="text-xl font-extrabold text-slate-800 dark:text-slate-100">${esc(d.titulo)}</h2>
          <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">Circulação restrita${d.setor ? ` ao setor <b>${esc(d.setor)}</b>` : ""}. O conteúdo fica oculto até você pedir para ver, e cada visualização leva o seu nome na marca d'água.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6"><div class="card overflow-hidden doc-viewer">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
            <span class="flex items-center gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200 truncate"><span class="text-crimson">${icon("lock", "w-4 h-4")}</span> ${esc(d.arquivo)}</span>
            <div class="flex items-center gap-2">
              <button type="button" id="doc-ocultar" class="btn-outline text-xs px-3 py-1.5 hidden">${icon("eye", "w-3.5 h-3.5")} Ocultar</button>
              <button type="button" class="zoom-btn" data-action="zoom" data-dir="-1" title="Diminuir" aria-label="Diminuir zoom">−</button><span class="text-sm text-slate-500 zoom-label w-12 text-center">100%</span><button type="button" class="zoom-btn" data-action="zoom" data-dir="1" title="Aumentar" aria-label="Aumentar zoom">+</button>
              <span class="text-sm text-slate-500 dark:text-slate-400 ml-1" data-doc-pagina aria-live="polite"></span>
            </div>
          </div>
          <div class="pdf-scroll no-copy doc-protegido doc-borrado" id="doc-protegido" oncontextmenu="return false">
            <div class="doc-folha" id="doc-folha" aria-hidden="true" inert><div data-doc-folha>${paginaDoc(d)}</div>${marcaDagua(carimbo)}</div>
            <div class="doc-veu" id="doc-veu">
              <span class="doc-veu-icone">${icon("eye", "w-6 h-6")}</span>
              <div class="font-bold text-slate-800 dark:text-slate-100">Conteúdo protegido</div>
              <p class="text-sm text-slate-600 dark:text-slate-300 max-w-sm">Confira se ninguém ao redor deveria não ver este documento. Ele volta a ficar oculto quando você sai desta aba.</p>
              <button type="button" id="doc-mostrar" class="btn-wine px-5 py-2.5">Mostrar conteúdo</button>
            </div>
          </div>
          <div class="doc-print-aviso">Documento restrito: a impressão não é permitida.</div>
        </div>${sobreDoc(d)}</div>
        <aside class="space-y-6">
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Informações do arquivo</h3>
            <div class="space-y-3 text-sm">
              ${kv("Versão atual", esc(d.versao))} ${kv("Enviado por", esc(d.enviadoPor || "—"))} ${kv("Setor responsável", esc(d.setor || "Todos"))}
              ${kv("Última atualização", esc(d.atualizado))} ${kv("Tamanho", esc(d.tamanho))}
            </div>
          </div>
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">Proteções desta tela</h3>
            <ul class="doc-protecoes">
              <li>${icon("eye", "w-4 h-4")} Conteúdo oculto até você pedir para ver</li>
              <li>${icon("user", "w-4 h-4")} Marca d'água com seu nome, data e hora</li>
              <li>${icon("download", "w-4 h-4")} Sem download do arquivo</li>
              <li>${icon("printer", "w-4 h-4")} Sem impressão e sem cópia do texto</li>
            </ul>
          </div>
          ${UI.legendasSeguranca ? UI.legendasSeguranca(true) : ""}
          <a href="#/documentos" class="btn-outline w-full py-2.5 text-center block">Voltar aos documentos</a>
        </aside>
      </div>`,
      init() {
        const area = document.getElementById("doc-protegido");
        const folha = document.getElementById("doc-folha");
        const mostrar = document.getElementById("doc-mostrar");
        const ocultarBtn = document.getElementById("doc-ocultar");
        const ocultar = () => {
          if (!area?.isConnected) return;
          area.classList.add("doc-borrado");
          folha.setAttribute("aria-hidden", "true");
          folha.inert = true;
          ocultarBtn.classList.add("hidden");
        };
        mostrar.addEventListener("click", () => {
          area.classList.remove("doc-borrado");
          folha.removeAttribute("aria-hidden");
          folha.inert = false;
          ocultarBtn.classList.remove("hidden");
          ocultarBtn.focus();
        });
        ocultarBtn.addEventListener("click", () => { ocultar(); mostrar.focus(); });
        // Sair da aba/janela esconde de novo (troca de app, captura de tela pelo atalho do sistema etc.).
        const aoSair = () => { if (document.hidden) ocultar(); };
        const teclas = (e) => {
          const k = e.key.toLowerCase();
          if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s" || k === "c")) {
            e.preventDefault();
            App.toast(k === "c" ? "Cópia não permitida em documento restrito." : k === "p" ? "Impressão não permitida em documento restrito." : "Download não permitido em documento restrito.");
          }
        };
        document.addEventListener("visibilitychange", aoSair);
        window.addEventListener("blur", ocultar);
        document.addEventListener("keydown", teclas, true);
        document.body.classList.add("doc-restrito-aberto");
        UI.mostrarConteudoDoc?.(d, area.closest(".doc-viewer"));
        window.addEventListener("hashchange", () => {
          document.removeEventListener("visibilitychange", aoSair);
          window.removeEventListener("blur", ocultar);
          document.removeEventListener("keydown", teclas, true);
          document.body.classList.remove("doc-restrito-aberto");
        }, { once: true });
      },
    };
  }

  Object.assign(Pages, { documentoRestrito });
  Object.assign(UI, { paginaDoc, sobreDoc });
})();
