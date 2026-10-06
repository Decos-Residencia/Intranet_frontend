/* =========================================================================
   Tela: Adicionar / Editar Documento (ADMIN)
   Rota: #/admin/documentos/novo · #/admin/documentos/:id/editar
   Upload real: arquivo + metadados vão para POST /documentos (multipart); o backend valida (20 MB; PDF,
   DOC, DOCX, XLS, XLSX; extensão + MIME + conteúdo) e grava no Supabase Storage privado. Editar muda só
   os metadados; "Substituir arquivo" usa PUT /documentos/{id}/arquivo (o anterior só some depois do novo).
   ========================================================================= */
(function () {
  const { breadcrumb, esc, icon } = UI;
  const { TIPOS_DOC } = AdminUI;

  const MAX_BYTES = 20 * 1024 * 1024;
  const EXTENSOES = ["pdf", "doc", "docx", "xls", "xlsx"];
  const bytes = (n) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);

  const fld = (label, html, hint) => `<div><label class="field-label">${label}</label>${html}${hint ? `<div class="field-hint">${hint}</div>` : ""}</div>`;
  const filePicker = () => `<input id="dc-arquivo" type="file" class="file-input-hidden" accept=".pdf,.doc,.docx,.xls,.xlsx">
    <div class="file-picker">
      <button type="button" data-pick-document-file class="file-picker-btn">${icon("upload", "w-4 h-4")} Escolher arquivo</button>
      <span id="dc-arquivo-label" class="file-picker-name">Nenhum arquivo escolhido</span>
    </div>`;
  const $ = (i) => document.getElementById(i);

  // Mensagem de estado do envio: idle | enviando | sucesso | erro
  function estado(tipo, texto) {
    const el = $("dc-estado");
    if (!el) return;
    const cores = { enviando: "text-slate-600 dark:text-slate-300", sucesso: "text-green-600 dark:text-green-400", erro: "text-red-600 dark:text-red-400" };
    el.className = `text-sm font-semibold ${cores[tipo] || ""} ${texto ? "" : "hidden"}`;
    el.textContent = texto ? (tipo === "enviando" ? "⏳ " : tipo === "sucesso" ? "✓ " : "⚠ ") + texto : "";
  }
  const ocupado = (sim) => document.querySelectorAll("#form-doc button, #form-doc input, #form-doc select, #form-doc textarea").forEach((e) => { e.disabled = sim; });

  function validarArquivo(file) {
    if (!file) return "Selecione um arquivo.";
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!EXTENSOES.includes(ext)) return "Formato não permitido. Envie PDF, DOC, DOCX, XLS ou XLSX.";
    if (file.size === 0) return "O arquivo está vazio.";
    if (file.size > MAX_BYTES) return `O arquivo (${bytes(file.size)}) passa do limite de 20 MB.`;
    return "";
  }

  function adminDocumentoNovo(id) {
    const setores = App.setoresAll();
    const categorias = [...new Set([...TIPOS_DOC.map((t) => t.value), ...App.documentosAll().map((d) => d.tipo)].filter(Boolean))];
    return {
      title: id ? "Editar Documento" : "Adicionar Documento",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Documentos", route: "#/admin/documentos" }, { label: id ? "Editar" : "Novo documento" }])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${id ? "Editar Documento" : "Adicionar Documento Oficial"}</h2></div>
      <form id="form-doc" data-id="${esc(id || "")}" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" data-prevent-submit>
        <div class="lg:col-span-2 space-y-5">
          <div class="card p-6 space-y-4">
            ${fld("TÍTULO DO DOCUMENTO *", `<input id="dc-titulo" class="field-input" maxlength="200" placeholder="Ex: POP — Higienização das Mãos">`)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${fld("CATEGORIA *", `<input id="dc-categoria" class="field-input" maxlength="100" list="dc-cats" placeholder="Ex: POP, Protocolo, Manual"><datalist id="dc-cats">${categorias.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>`)}
              ${fld("VERSÃO", `<input id="dc-versao" class="field-input" maxlength="30" value="1.0">`, "Texto livre controlado por você (ex.: 1.0, 2.3, 2026-10).")}
            </div>
            ${fld("DESCRIÇÃO", `<textarea id="dc-desc" class="field-input" rows="3" maxlength="2000" placeholder="Opcional: resumo do que o documento contém"></textarea>`)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${fld("QUEM PODE VER", `<select id="dc-setor" class="field-input"><option value="">Geral — todos os colaboradores</option>${setores.map((s) => `<option value="${s.id}">Somente o setor ${esc(s.nome)}</option>`).join("")}</select>`, "Documentos restritos só aparecem para o setor escolhido e para administradores.")}
              ${fld("STATUS", `<select id="dc-ativo" class="field-input"><option value="true">Ativo (visível)</option><option value="false">Inativo (escondido)</option></select>`)}
            </div>
          </div>
          <div class="card p-6" id="dc-bloco-arquivo">
            ${id ? `<div class="font-bold text-slate-800 dark:text-slate-100 mb-1">Arquivo atual</div><div class="text-sm text-slate-500 dark:text-slate-400 mb-4" id="dc-atual">Carregando…</div>
              <div class="font-bold text-slate-800 dark:text-slate-100 mb-2">Substituir arquivo</div>
              ${fld("NOVO ARQUIVO", filePicker(), "O arquivo anterior só é removido depois que o novo estiver salvo com sucesso.")}
              <button type="button" data-action="replace-doc" class="btn-outline mt-3 px-5 py-2.5">Substituir arquivo</button>`
              : fld("ARQUIVO *", filePicker(), "PDF, DOC, DOCX, XLS ou XLSX — até 20 MB. O arquivo é guardado em um armazenamento privado.")}
            <div id="dc-arquivo-info" class="text-xs text-slate-400 mt-2"></div>
          </div>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div id="dc-estado" class="hidden"></div>
            <div class="flex gap-3 ml-auto">
              <a href="#/admin/documentos" class="btn-outline px-6 py-2.5">Cancelar</a>
              <button type="button" id="dc-salvar" data-action="save-documento" class="btn-crimson px-6 py-2.5" ${id ? "disabled" : ""}>${id ? "Salvar alterações" : "Enviar documento"}</button>
            </div>
          </div>
        </div>
        <aside class="space-y-4">
          <div class="card p-5 ring-1 ring-crimson/20">
            <div class="font-bold text-crimson mb-1">Como funciona</div>
            <p class="text-sm text-slate-500 dark:text-slate-400">O arquivo vai para um armazenamento <b>privado</b>. Os colaboradores abrem por um link temporário (60 s) gerado após conferir o login e o setor.</p>
            <p class="text-xs text-slate-400 mt-3">Validamos o tipo real do arquivo, não só a extensão.</p>
          </div>
        </aside>
      </form>`,
      init() { iniciar(id); },
    };
  }

  async function iniciar(id) {
    const arq = $("dc-arquivo");
    document.querySelector("[data-pick-document-file]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (arq?.showPicker) arq.showPicker();
      else arq?.click();
    });
    arq?.addEventListener("change", () => {
      const f = arq.files?.[0];
      const erro = f ? validarArquivo(f) : "";
      $("dc-arquivo-label").textContent = f ? `${f.name} · ${bytes(f.size)}` : "Nenhum arquivo escolhido";
      $("dc-arquivo-info").textContent = f ? (erro || `${f.name} · ${bytes(f.size)}`) : "";
      $("dc-arquivo-info").className = `text-xs mt-2 ${erro ? "text-red-600" : "text-slate-400"}`;
    });
    if (!id) return;
    try {
      const d = await Services.documentos.get(id);
      if (!$("form-doc")) return;
      $("dc-titulo").value = d.titulo; $("dc-categoria").value = d.categoria; $("dc-versao").value = d.versao;
      $("dc-desc").value = d.descricao || ""; $("dc-setor").value = d.setor_id ? String(d.setor_id) : ""; $("dc-ativo").value = d.ativo ? "true" : "false";
      $("dc-atual").innerHTML = `<b>${esc(d.arquivo_nome)}</b> · ${bytes(d.tamanho_bytes)} · enviado por ${esc(d.enviado_por || "—")} <button type="button" class="font-bold text-wine hover:underline ml-2" data-action="open-doc-url" data-id="${d.id}">Abrir</button>`;
      $("dc-salvar").disabled = false;
    } catch (err) {
      App.toast(err.message || "Documento não encontrado."); App.go("#/admin/documentos");
    }
  }

  async function submitDocumento() {
    const f = $("form-doc");
    if (!f) return;
    const id = f.dataset.id;
    const titulo = $("dc-titulo").value.trim(), categoria = $("dc-categoria").value.trim(), versao = $("dc-versao").value.trim() || "1.0";
    const desc = $("dc-desc").value.trim(), setor = $("dc-setor").value, ativo = $("dc-ativo").value === "true";
    if (!titulo) { App.toast("Informe o título do documento"); $("dc-titulo").focus(); return; }
    if (!categoria) { App.toast("Informe a categoria"); $("dc-categoria").focus(); return; }
    if (id) {
      ocupado(true); estado("enviando", "Salvando alterações…");
      try {
        await Services.documentos.update(id, { titulo, categoria, versao, descricao: desc || null, setor_id: setor ? Number(setor) : null, ativo });
        estado("sucesso", "Alterações salvas."); App.toast("Documento atualizado");
        await App.loadApiData(); setTimeout(() => App.go("#/admin/documentos"), 400);
      } catch (err) { estado("erro", err.message || "Não foi possível salvar."); ocupado(false); }
      return;
    }
    const file = $("dc-arquivo").files?.[0];
    const erro = validarArquivo(file);
    if (erro) { estado("erro", erro); App.toast(erro); return; }
    const data = new FormData();
    data.append("arquivo", file); data.append("titulo", titulo); data.append("categoria", categoria); data.append("versao", versao);
    data.append("ativo", String(ativo));
    if (desc) data.append("descricao", desc);
    if (setor) data.append("setor_id", setor);
    ocupado(true); estado("enviando", `Enviando ${file.name} (${bytes(file.size)}) para o armazenamento seguro…`);
    try {
      await Services.documentos.create(data);
      estado("sucesso", "Documento enviado com sucesso."); App.toast("Documento enviado e publicado");
      await App.loadApiData(); setTimeout(() => App.go("#/admin/documentos"), 500);
    } catch (err) { estado("erro", err.message || "Falha no envio."); App.toast(err.message || "Falha no envio do documento."); ocupado(false); }
  }

  async function substituirDocumento() {
    const f = $("form-doc");
    const file = $("dc-arquivo")?.files?.[0];
    const erro = validarArquivo(file);
    if (erro) { estado("erro", erro); App.toast(erro); return; }
    const data = new FormData();
    data.append("arquivo", file);
    const versao = $("dc-versao").value.trim();
    if (versao) data.append("versao", versao);
    ocupado(true); estado("enviando", `Enviando ${file.name} (${bytes(file.size)})… o arquivo atual continua disponível até terminar.`);
    try {
      const d = await Services.documentos.substituirArquivo(f.dataset.id, data);
      $("dc-atual").innerHTML = `<b>${esc(d.arquivo_nome)}</b> · ${bytes(d.tamanho_bytes)} · enviado por ${esc(d.enviado_por || "—")} <button type="button" class="font-bold text-wine hover:underline ml-2" data-action="open-doc-url" data-id="${d.id}">Abrir</button>`;
      $("dc-versao").value = d.versao; $("dc-arquivo").value = ""; $("dc-arquivo-info").textContent = "";
      estado("sucesso", "Arquivo substituído."); App.toast("Arquivo substituído com sucesso");
      await App.loadApiData();
    } catch (err) { estado("erro", err.message || "Falha ao substituir o arquivo."); App.toast(err.message || "Falha ao substituir o arquivo."); }
    ocupado(false);
  }

  Object.assign(PagesAdmin, { adminDocumentoNovo, submitDocumento, substituirDocumento });
})();
