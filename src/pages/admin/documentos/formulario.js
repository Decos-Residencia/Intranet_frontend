/* =========================================================================
   Tela: Adicionar / Editar Documento
   Rota: #/admin/documentos/novo · #/admin/documentos/:id/editar
   ========================================================================= */
(function () {
  const { icon, breadcrumb, esc } = UI;
  const { opts, TIPOS_DOC, SETORES_DOC, fieldLbl, guide, wireDrop } = AdminUI;

  function adminDocumentoNovo(id) {
    const d = id ? App.findItem("docsAdm", id) : null;
    const step = (n, t) => `<h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><span class="w-1 h-5 bg-crimson rounded-full"></span>${n}. ${t}</h3>`;
    const perm = d?.permissao || "download";
    const permOpt = (val, ic, titulo, texto) => `<button type="button" data-filter="${val}" class="perm-opt ${perm === val ? "perm-active" : ""}"><div class="flex items-center justify-between mb-2"><span class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon(ic,"w-4 h-4 text-crimson")} ${titulo}</span><span class="radio ${perm === val ? "radio-on" : ""}"></span></div>
      <p class="text-sm text-slate-500 dark:text-slate-400 text-left">${texto}</p></button>`;
    return {
      title: "Central de Documentos & POPs",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs",route:"#/admin/documentos"},{label: d ? "Editar Documento" : "Adicionar Documento"}])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Editor & Gestor</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${d ? "Editar Documento" : "Criar Nova Publicação de Documento"}</h2></div>
      <form id="form-doc" data-id="${d?.id || ""}" data-action="prevent" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6">${step(1,"Informações Básicas do Documento")}
            <div class="space-y-4">
              <div>${fieldLbl("Título do Documento ou POP *", "dc-titulo")}<input id="dc-titulo" class="field-input" maxlength="140" placeholder="Digite o título oficial..." value="${esc(d?.titulo || "")}">
                <div class="field-hint">Insira um título claro e objetivo (Ex: POP - Higienização Simples das Mãos)</div></div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>${fieldLbl("Categoria *", "dc-tipo")}<select id="dc-tipo" class="field-input">${opts(TIPOS_DOC, d?.tipo || "POP")}</select></div>
                <div>${fieldLbl("Setor Responsável *", "dc-setor")}<select id="dc-setor" class="field-input">${opts(SETORES_DOC, d?.setor || "Enfermagem Geral")}</select></div>
                <div>${fieldLbl("Versão Atual *", "dc-versao")}<input id="dc-versao" class="field-input" placeholder="Ex: v2.1" value="${esc(d?.versao || "")}"><div class="field-hint">Versão do documento para controle histórico</div></div>
                <div>${fieldLbl("Código de Identificação", "dc-codigo")}<input id="dc-codigo" class="field-input" placeholder="Ex: COD-POP-ENF-042" value="${esc(d?.codigo || "")}"><div class="field-hint">Código interno do hospital (opcional)</div></div>
              </div>
              <div>${fieldLbl("Descrição ou Resumo do Documento *", "dc-desc")}<textarea id="dc-desc" class="field-input" rows="3" placeholder="Escreva um resumo conciso das normas ou procedimentos abordados...">${esc(d?.desc || "")}</textarea>
                <div class="field-hint">Forneça uma breve descrição sobre o objetivo e o público-alvo deste documento</div></div>
            </div>
          </div>
          <div class="card p-6">${step(2,"Upload do Arquivo Oficial")}
            ${fieldLbl("Arquivo PDF ou Word *")}
            <label class="dropzone mt-2" for="dc-file" id="dc-drop"><span class="text-crimson mb-2">${icon("file-text","w-8 h-8")}</span>
              <div class="font-bold text-slate-700 dark:text-slate-200">Arraste e solte o arquivo aqui ou clique para buscar</div>
              <div class="text-xs text-slate-400">Formatos recomendados: PDF para POPs gerais, DOCX para formulários editáveis.</div></label>
            <input type="file" id="dc-file" accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" class="hidden">
            <div class="text-xs text-slate-400 mt-2">Tamanho máximo de arquivo suportado: 15MB. Apenas formatos oficiais (PDF, DOCX).</div>
            <div class="file-uploaded mt-4 ${d?.arquivo ? "" : "hidden"}" id="dc-file-box"><div class="doc-icon bg-red-50 text-red-600 dark:bg-red-500/10" id="dc-file-ext">PDF</div>
              <div class="flex-1"><div class="font-bold text-slate-800 dark:text-slate-100" id="dc-file-nome">${esc(d?.arquivo || "")}</div><div class="text-xs text-slate-400" id="dc-file-info">${esc(d?.tamanho || "")} • Arquivo anexado</div></div>
              <span class="text-green-500">${icon("check","w-5 h-5")}</span></div>
          </div>
          <div class="card p-6">${step(3,"Configuração de Acesso e Permissão")}
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Determine as ações que os colaboradores comuns (perfil Usuário) poderão realizar ao visualizar este arquivo na Central de Documentos.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-filter-group="perm">
              ${permOpt("download", "download", "Download Disponível", "Os usuários poderão visualizar o documento no navegador e realizar o download da cópia em PDF/Word para uso ou arquivamento local. Recomendado para POPs gerais e formulários de uso frequente.")}
              ${permOpt("view", "eye", "Somente Visualização", "O documento ficará restrito à leitura online através da plataforma de visualização do hospital. O botão de download será desabilitado para este arquivo. Ideal para manuais estratégicos e protocolos sigilosos.")}
            </div>
          </div>
        </div>
        <aside class="space-y-5">
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><span class="w-1 h-5 bg-crimson rounded-full"></span>Publicação</h3>
            ${fieldLbl("Opção de Envio", "dc-envio")}<select id="dc-envio" class="field-input">${opts([{ value: "publicar", label: "Publicar Imediatamente" }, { value: "revisao", label: "Enviar para Revisão (SCIH/Qualidade)" }], d?.status === "Em Revisão" ? "revisao" : "publicar")}</select>
            <div class="space-y-2 mt-4 text-sm" id="dc-check"></div>
            <button type="button" data-action="save-documento" data-status="Publicado" class="btn-crimson w-full mt-5 py-3">${d ? "Salvar alterações" : "Publicar Documento"}</button>
            <button type="button" data-action="save-documento" data-status="Rascunho" class="btn-crimson-outline w-full mt-2 py-3">Salvar como Rascunho</button>
            <a href="#/admin/documentos" class="block text-center text-sm font-bold text-slate-500 mt-3 hover:underline">Cancelar</a>
          </div>
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3"><span class="w-1 h-5 bg-crimson rounded-full"></span>Diretrizes de Qualidade</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Todos os documentos e POPs publicados na Intranet Hospitalar Decós passam por revisão sistemática do Núcleo de Gestão de Qualidade e SCIH para garantir conformidade técnica.</p>
            <div class="space-y-3">${guide("edit","Linguagem Técnica","Mantenha a terminologia médica padrão e passos numerados.")}
            ${guide("shield","Checagem de Segurança","Evidencie pontos críticos de biossegurança ou dupla checagem.")}
            ${guide("clock","SLA de Revisão","Rascunhos marcados em revisão são processados em até 48 horas.")}</div>
          </div>
        </aside>
      </form>`,
      init() {
        const $ = (i) => document.getElementById(i);
        const f = $("form-doc");
        if (d?.arquivo) { f.dataset.arquivo = d.arquivo; f.dataset.tamanho = d.tamanho; }
        const check = () => {
          const itens = [
            [$("dc-titulo").value.trim().length >= 5, "Título válido inserido"],
            [$("dc-desc").value.trim().length >= 10, "Descrição preenchida"],
            [!!f.dataset.arquivo, "Arquivo carregado"],
            [true, "Permissões definidas"],
          ];
          $("dc-check").innerHTML = itens.map(([ok, t]) => `<div class="flex items-center gap-2 ${ok ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}">${icon(ok ? "check" : "x", `w-4 h-4 ${ok ? "text-green-500" : "text-slate-300"}`)} ${t}</div>`).join("");
        };
        const fmt = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
        const setArquivo = (file) => {
          if (!file) return;
          if (!/\.(pdf|docx?)$/i.test(file.name)) { App.toast("Formato inválido — envie PDF ou DOCX"); return; }
          if (file.size > 15 * 1024 * 1024) { App.toast("Arquivo maior que 15MB"); return; }
          f.dataset.arquivo = file.name; f.dataset.tamanho = fmt(file.size);
          const word = /\.docx?$/i.test(file.name);
          $("dc-file-ext").textContent = word ? "W" : "PDF";
          $("dc-file-ext").className = "doc-icon " + (word ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10" : "bg-red-50 text-red-600 dark:bg-red-500/10");
          $("dc-file-nome").textContent = file.name;
          $("dc-file-info").textContent = `${fmt(file.size)} • Upload concluído com sucesso`;
          $("dc-file-box").classList.remove("hidden");
          check();
        };
        $("dc-file").addEventListener("change", (e) => setArquivo(e.target.files[0]));
        wireDrop($("dc-drop"), setArquivo);
        document.querySelectorAll('[data-filter-group="perm"] [data-filter]').forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="perm"] [data-filter]').forEach((x) => { x.classList.remove("perm-active"); x.querySelector(".radio").classList.remove("radio-on"); });
          b.classList.add("perm-active"); b.querySelector(".radio").classList.add("radio-on");
        }));
        ["dc-titulo", "dc-desc"].forEach((i) => $(i).addEventListener("input", check));
        check();
      },
    };
  }
  function submitDocumento(status) {
    const f = document.getElementById("form-doc");
    if (!f) return;
    const v = (i) => document.getElementById(i).value.trim();
    const titulo = v("dc-titulo");
    if (titulo.length < 5) { App.toast("Informe um título com pelo menos 5 caracteres"); document.getElementById("dc-titulo").focus(); return; }
    if (status !== "Rascunho") {
      if (v("dc-desc").length < 10) { App.toast("Preencha a descrição do documento"); document.getElementById("dc-desc").focus(); return; }
      if (!f.dataset.arquivo) { App.toast("Anexe o arquivo PDF ou DOCX"); return; }
      if (document.getElementById("dc-envio").value === "revisao") status = "Em Revisão";
    }
    const tipo = TIPOS_DOC.find((t) => t.value === v("dc-tipo")) || TIPOS_DOC[0];
    const antigo = f.dataset.id ? App.findItem("docsAdm", f.dataset.id) : null;
    App.saveDocumento({
      ...(antigo ? { id: antigo.id } : {}), titulo, tipo: tipo.value, cor: tipo.cor, status, own: true,
      setor: v("dc-setor"), versao: v("dc-versao") || "1.0", codigo: v("dc-codigo"), desc: v("dc-desc"),
      arquivo: f.dataset.arquivo || "", tamanho: f.dataset.tamanho || "—",
      permissao: document.querySelector('[data-filter-group="perm"] .perm-active')?.dataset.filter || "download",
      quando: "Agora mesmo", autor: DB.usuario.nome,
    });
    App.toast({ Rascunho: "Salvo como rascunho", "Em Revisão": "Documento enviado para revisão", Publicado: "Documento publicado na central!" }[status]);
    setTimeout(() => App.go("#/admin/documentos"), 500);
  }

  Object.assign(PagesAdmin, { adminDocumentoNovo, submitDocumento });
})();
