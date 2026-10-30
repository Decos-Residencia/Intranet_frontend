/* =========================================================================
   Tela: Adicionar / Editar Documento (ADMIN)
   Rota: #/admin/documentos/novo · #/admin/documentos/:id/editar
   Upload real: arquivo + metadados vão para POST /documentos (multipart); o backend valida (20 MB; PDF,
   DOC, DOCX, XLS, XLSX; extensão + MIME + conteúdo) e grava no Supabase Storage privado.
   Descrição obrigatória (mín. 10). Todo envio diz se a versão é a VIGENTE ou ANTIGA. Na edição, o
   histórico mostra todas as versões; nova versão usa POST /documentos/{id}/versoes e nenhum arquivo
   anterior é apagado (vira "versão antiga").
   ========================================================================= */
(function () {
  const { breadcrumb, esc, icon, badge } = UI;
  const { TIPOS_DOC } = AdminUI;

  const MAX_BYTES = 20 * 1024 * 1024;
  const EXTENSOES = ["pdf", "doc", "docx", "xls", "xlsx"];
  const bytes = (n) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);

  // O rótulo aponta para o primeiro campo com id do bloco (leitores de tela anunciam o nome).
  const fld = (label, html, hint) => {
    const alvo = (html.match(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/) || [])[1];
    return `<div><label class="field-label" ${alvo ? `for="${alvo}"` : ""}>${label}</label>${html}${hint ? `<div class="field-hint">${hint}</div>` : ""}</div>`;
  };
  const filePicker = () => `<input id="dc-arquivo" type="file" class="file-input-hidden" accept=".pdf,.doc,.docx,.xls,.xlsx">
    <div class="file-picker">
      <button type="button" data-pick-document-file class="file-picker-btn">${icon("upload", "w-4 h-4")} Escolher arquivo</button>
      <span id="dc-arquivo-label" class="file-picker-name">Nenhum arquivo escolhido</span>
    </div>`;
  const $ = (i) => document.getElementById(i);
  const MIN_DESC = 10;
  // Escolha obrigatória: a versão enviada é a que vale (vigente) ou entra só no histórico (antiga)?
  const escolhaVersao = (nome) => `<fieldset class="space-y-2"><legend class="field-label">ESTA VERSÃO É *</legend>
    <label class="versao-opt"><input type="radio" name="${nome}" value="true"><span><b>Versão nova (vigente)</b><small>Passa a ser a exibida para todos. A atual vira "versão antiga".</small></span></label>
    <label class="versao-opt"><input type="radio" name="${nome}" value="false"><span><b>Versão antiga</b><small>Entra só no histórico, marcada como obsoleta.</small></span></label>
  </fieldset>`;
  const vigenteEscolhido = (nome) => document.querySelector(`input[name="${nome}"]:checked`)?.value;

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
    const pessoas = [...(App.state.api.usuariosRaw || [])].filter((u) => u.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
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
              ${fld(id ? "RÓTULO DA VERSÃO EXIBIDA" : "VERSÃO *", `<input id="dc-versao" class="field-input" maxlength="30" value="1.0">`, "Ex.: 1.0, 2.3, 2026-10.")}
            </div>
            <div><label class="field-label" for="dc-desc">DESCRIÇÃO *</label>
              <textarea id="dc-desc" class="field-input" rows="3" maxlength="2000" required aria-describedby="dc-desc-ajuda" placeholder="Para que serve este documento, a quem se aplica e o que ele contém"></textarea>
              <div id="dc-desc-ajuda" class="field-hint flex justify-between gap-2"><span>Obrigatória, no mínimo ${MIN_DESC} caracteres.</span><span id="dc-desc-cont" aria-live="polite">0/2000</span></div></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${fld("QUEM PODE VER", `<select id="dc-setor" class="field-input"><option value="">Geral — todos os colaboradores</option>${setores.map((s) => `<option value="${s.id}">Somente o setor ${esc(s.nome)}</option>`).join("")}</select>`, "Documentos restritos só aparecem para o setor escolhido e para administradores.")}
              ${fld("STATUS", `<select id="dc-ativo" class="field-input"><option value="true">Ativo (visível)</option><option value="false">Inativo (escondido)</option></select>`)}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${fld("REVISAR ATÉ (VALIDADE)", `<input id="dc-revisar" type="date" class="field-input">`, "Opcional. Ex.: POP revisado a cada 2 anos. Alertas faltando 30 e 7 dias e no vencimento.")}
              ${fld("RESPONSÁVEL PELA REVISÃO", `<select id="dc-responsavel" class="field-input"><option value="">Quem gerencia documentos</option>${pessoas.map((u) => `<option value="${u.id}">${esc(u.nome)}${u.setor?.nome ? ` · ${esc(u.setor.nome)}` : ""}</option>`).join("")}</select>`, "Recebe os alertas por notificação e e-mail.")}
            </div>
            <fieldset><legend class="field-label">PERMISSÃO DO ARQUIVO</legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label class="versao-opt"><input type="radio" name="dc-permissao" value="download" checked><span><b>${icon("download", "w-4 h-4 inline -mt-0.5")} Download disponível</b><small>Manuais de uso comum e formulários: dá para baixar e imprimir.</small></span></label>
                <label class="versao-opt"><input type="radio" name="dc-permissao" value="visualizacao"><span><b>${icon("eye", "w-4 h-4 inline -mt-0.5")} Somente visualização</b><small>Documento crítico: só leitura na tela, sem download, impressão nem cópia.</small></span></label>
              </div></fieldset>
          </div>
          <div class="card p-6 space-y-4" id="dc-bloco-arquivo">
            ${id ? `<div><div class="font-bold text-slate-800 dark:text-slate-100 mb-1">Arquivo exibido agora</div><div class="text-sm text-slate-500 dark:text-slate-400" id="dc-atual">Carregando…</div></div>
              <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div class="font-bold text-slate-800 dark:text-slate-100">Enviar outra versão</div>
                ${fld("ARQUIVO *", filePicker(), "Nenhum arquivo anterior é apagado: ele fica no histórico.")}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${fld("RÓTULO DA NOVA VERSÃO *", `<input id="dc-nv-rotulo" class="field-input" maxlength="30" placeholder="Ex.: 2.0">`)}
                  ${fld("O QUE MUDOU", `<input id="dc-nv-obs" class="field-input" maxlength="1000" placeholder="Opcional">`)}
                </div>
                ${escolhaVersao("dc-nv-vigente")}
                <button type="button" data-action="replace-doc" class="btn-outline px-5 py-2.5">${icon("upload", "w-4 h-4")} Enviar versão</button>
              </div>
              <div class="pt-4 border-t border-slate-100 dark:border-slate-800"><div class="font-bold text-slate-800 dark:text-slate-100 mb-2">Histórico de versões</div><div id="dc-versoes"></div></div>`
              : `${fld("ARQUIVO *", filePicker(), "PDF, DOC, DOCX, XLS ou XLSX — até 20 MB. O arquivo é guardado em um armazenamento privado.")}
                ${escolhaVersao("dc-vigente")}`}
            <div id="dc-arquivo-info" class="text-xs text-slate-500 dark:text-slate-400"></div>
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
          ${id && App.can("manage_reviews") ? `<section class="card p-5" aria-labelledby="dc-av-h">
            <div class="flex items-center justify-between gap-2 mb-2"><h3 id="dc-av-h" class="font-bold text-slate-800 dark:text-slate-100">Avaliações</h3>
              <button type="button" id="dc-pedir-avaliacao" class="btn-wine text-xs px-3 py-1.5 flex items-center gap-1">${icon("plus", "w-3.5 h-3.5")} Pedir avaliação</button></div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Peça a alguém que leia e aprove ou rejeite este documento. A pessoa é avisada e responde em “Minhas revisões”.</p>
            <ul id="dc-avaliacoes" class="space-y-2" aria-live="polite"><li class="text-sm text-slate-500 dark:text-slate-400">Carregando…</li></ul>
          </section>` : ""}
        </aside>
      </form>`,
      init() { iniciar(id); },
    };
  }

  /* ---------- avaliações do documento (POST /avaliacoes-documentos) ---------- */
  const ROT_AV = { PENDENTE: ["blue", "Pendente"], EM_ANALISE: ["amber", "Em análise"], APROVADO: ["green", "Aprovado"], REJEITADO: ["red", "Rejeitado"] };

  async function carregarAvaliacoes(id) {
    const box = $("dc-avaliacoes");
    if (!box) return;
    try {
      const r = await Services.avaliacoes.list({ documento_id: id, page_size: 50 });
      if (!document.contains(box)) return;
      box.innerHTML = r.items.length ? r.items.map((a) => {
        const [tom, rot] = ROT_AV[a.status] || ["gray", a.status];
        return `<li class="text-sm"><div class="flex items-center justify-between gap-2"><span class="font-semibold text-slate-800 dark:text-slate-100 truncate">${esc(a.avaliador_nome || "—")}</span>${badge(tom, rot)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">pedida em ${esc(UI.fmtDataHora(a.data_solicitacao))}</div>
          ${a.status === "REJEITADO" && a.observacao ? `<div class="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">${esc(a.observacao)}</div>` : ""}</li>`;
      }).join("") : `<li class="text-sm text-slate-500 dark:text-slate-400">Nenhuma avaliação pedida ainda.</li>`;
    } catch (err) { box.innerHTML = `<li class="text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar. ${esc(err.message || "")}</li>`; }
  }

  function pedirAvaliacao(id) {
    const pessoas = [...(App.state.api.usuariosRaw || [])].filter((u) => u.ativo !== false && u.id !== App.state.user?.id)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    App.openPanel("Pedir avaliação", `<form id="dc-av-form" class="space-y-4" novalidate>
      <p class="text-sm text-slate-500 dark:text-slate-400">${esc($("dc-titulo")?.value || "Documento")}</p>
      <div><label class="field-label" for="dc-av-pessoa">QUEM VAI AVALIAR *</label><select id="dc-av-pessoa" class="field-input"><option value="">Escolha a pessoa</option>${pessoas.map((u) => `<option value="${u.id}">${esc(u.nome)}${u.setor?.nome ? ` · ${esc(u.setor.nome)}` : ""}</option>`).join("")}</select>
        <div class="field-hint">Documento de setor só pode ser avaliado por alguém do setor.</div></div>
      <div><label class="field-label" for="dc-av-obs">O QUE VERIFICAR</label><textarea id="dc-av-obs" class="field-input" rows="3" maxlength="5000" placeholder="Opcional. Ex.: conferir as doses da página 3"></textarea></div>
      <p id="dc-av-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">Pedir avaliação</button></form>`);
    $("dc-av-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const erro = $("dc-av-erro"), pessoa = $("dc-av-pessoa").value, obs = $("dc-av-obs").value.trim();
      if (!pessoa) { erro.textContent = "Escolha quem vai avaliar."; erro.classList.remove("hidden"); $("dc-av-pessoa").focus(); return; }
      const corpo = { documento_id: Number(id), avaliador_id: Number(pessoa) };
      if (obs) corpo.observacao = obs;
      try {
        await Services.avaliacoes.create(corpo);
        App.closePanel(); App.toast("Avaliação pedida: a pessoa foi avisada");
        carregarAvaliacoes(id);
      } catch (err) { erro.textContent = err.message || "Não foi possível pedir a avaliação."; erro.classList.remove("hidden"); }
    });
  }

  async function iniciar(id) {
    if (id && $("dc-pedir-avaliacao")) {
      $("dc-pedir-avaliacao").addEventListener("click", () => pedirAvaliacao(id));
      carregarAvaliacoes(id);
    }
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
    const desc = $("dc-desc"), cont = $("dc-desc-cont");
    const contar = () => { cont.textContent = `${desc.value.trim().length}/2000`; };
    desc.addEventListener("input", contar);
    if (!id) return;
    try {
      const d = await Services.documentos.get(id);
      if (!$("form-doc")) return;
      $("dc-titulo").value = d.titulo; $("dc-categoria").value = d.categoria; $("dc-versao").value = d.versao;
      $("dc-revisar").value = d.revisar_em || ""; $("dc-responsavel").value = d.responsavel_id ? String(d.responsavel_id) : "";
      $("dc-desc").value = d.descricao || ""; contar(); $("dc-setor").value = d.setor_id ? String(d.setor_id) : ""; $("dc-ativo").value = d.ativo ? "true" : "false";
      document.querySelector(`input[name="dc-permissao"][value="${d.somente_visualizacao ? "visualizacao" : "download"}"]`).checked = true;
      $("dc-atual").innerHTML = atualHtml(d);
      $("dc-salvar").disabled = false;
      App.montarVersoes($("dc-versoes"), id, { gerir: true, aoMudar: () => recarregarAtual(id) });
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
    const somenteVisualizacao = document.querySelector('input[name="dc-permissao"]:checked')?.value === "visualizacao";
    const revisar = $("dc-revisar").value, responsavel = $("dc-responsavel").value;
    if (!titulo) { App.toast("Informe o título do documento"); $("dc-titulo").focus(); return; }
    if (!categoria) { App.toast("Informe a categoria"); $("dc-categoria").focus(); return; }
    if (desc.length < MIN_DESC) { estado("erro", `Descrição obrigatória (mínimo ${MIN_DESC} caracteres).`); $("dc-desc").focus(); return; }
    if (id) {
      ocupado(true); estado("enviando", "Salvando alterações…");
      try {
        await Services.documentos.update(id, { titulo, categoria, versao, descricao: desc, setor_id: setor ? Number(setor) : null, ativo, somente_visualizacao: somenteVisualizacao,
          revisar_em: revisar || null, responsavel_id: responsavel ? Number(responsavel) : null });
        estado("sucesso", "Alterações salvas."); App.toast("Documento atualizado");
        await App.loadApiData(); setTimeout(() => App.go("#/admin/documentos"), 400);
      } catch (err) { estado("erro", err.message || "Não foi possível salvar."); ocupado(false); }
      return;
    }
    const file = $("dc-arquivo").files?.[0];
    const erro = validarArquivo(file);
    if (erro) { estado("erro", erro); App.toast(erro); return; }
    const vigente = vigenteEscolhido("dc-vigente");
    if (!vigente) { estado("erro", "Escolha se esta é a versão nova (vigente) ou uma versão antiga."); document.querySelector('input[name="dc-vigente"]').focus(); return; }
    const data = new FormData();
    data.append("arquivo", file); data.append("titulo", titulo); data.append("categoria", categoria); data.append("versao", versao);
    data.append("ativo", String(ativo)); data.append("vigente", vigente); data.append("descricao", desc);
    if (setor) data.append("setor_id", setor);
    data.append("somente_visualizacao", String(somenteVisualizacao));
    if (revisar) data.append("revisar_em", revisar);
    if (responsavel) data.append("responsavel_id", responsavel);
    ocupado(true); estado("enviando", `Enviando ${file.name} (${bytes(file.size)}) para o armazenamento seguro…`);
    try {
      await Services.documentos.create(data);
      estado("sucesso", "Documento enviado com sucesso."); App.toast("Documento enviado e publicado");
      await App.loadApiData(); setTimeout(() => App.go("#/admin/documentos"), 500);
    } catch (err) { estado("erro", err.message || "Falha no envio."); App.toast(err.message || "Falha no envio do documento."); ocupado(false); }
  }

  const atualHtml = (d) => `<b>${esc(d.arquivo_nome)}</b> · versão ${esc(d.versao)} ${d.vigente ? badge("green", "Vigente") : badge("gray", "Sem versão vigente")} · ${bytes(d.tamanho_bytes)} · enviado por ${esc(d.enviado_por || "—")} <button type="button" class="font-bold text-wine hover:underline ml-2" data-action="open-doc-url" data-id="${d.id}">Abrir</button>`;

  async function recarregarAtual(id) {
    try {
      const d = await Services.documentos.get(id);
      if ($("dc-atual")) { $("dc-atual").innerHTML = atualHtml(d); $("dc-versao").value = d.versao; }
      App.loadApiData();
    } catch (_) { /* a tela segue com o que já mostrava */ }
  }

  async function substituirDocumento() {
    const f = $("form-doc");
    const file = $("dc-arquivo")?.files?.[0];
    const erro = validarArquivo(file);
    if (erro) { estado("erro", erro); App.toast(erro); return; }
    const rotulo = $("dc-nv-rotulo").value.trim();
    if (!rotulo) { estado("erro", "Informe o rótulo da nova versão (ex.: 2.0)."); $("dc-nv-rotulo").focus(); return; }
    const vigente = vigenteEscolhido("dc-nv-vigente");
    if (!vigente) { estado("erro", "Escolha se esta é a versão nova (vigente) ou uma versão antiga."); document.querySelector('input[name="dc-nv-vigente"]').focus(); return; }
    const data = new FormData();
    data.append("arquivo", file); data.append("rotulo", rotulo); data.append("vigente", vigente);
    const obs = $("dc-nv-obs").value.trim();
    if (obs) data.append("observacao", obs);
    ocupado(true); estado("enviando", `Enviando ${file.name} (${bytes(file.size)})… o arquivo atual continua disponível até terminar.`);
    try {
      const d = await Services.documentos.enviarVersao(f.dataset.id, data);
      $("dc-atual").innerHTML = atualHtml(d);
      $("dc-versao").value = d.versao; $("dc-arquivo").value = ""; $("dc-arquivo-info").textContent = ""; $("dc-arquivo-label").textContent = "Nenhum arquivo escolhido";
      $("dc-nv-rotulo").value = ""; $("dc-nv-obs").value = "";
      document.querySelectorAll('input[name="dc-nv-vigente"]').forEach((r) => { r.checked = false; });
      estado("sucesso", vigente === "true" ? `Versão ${rotulo} agora é a vigente.` : `Versão ${rotulo} adicionada ao histórico como antiga.`);
      App.toast("Versão enviada");
      await App.montarVersoes($("dc-versoes"), f.dataset.id, { gerir: true, aoMudar: () => recarregarAtual(f.dataset.id) });
      App.loadApiData();
    } catch (err) { estado("erro", err.message || "Falha ao enviar a versão."); App.toast(err.message || "Falha ao enviar a versão."); }
    ocupado(false);
  }

  Object.assign(PagesAdmin, { adminDocumentoNovo, submitDocumento, substituirDocumento });
})();
