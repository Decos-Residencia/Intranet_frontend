/* =========================================================================
   Tela: Adicionar / Editar Documento
   Rota: #/admin/documentos/novo · #/admin/documentos/:id/editar
   Persistido no backend (POST/PUT /documentos): título, categoria e
   url_arquivo (URL https:// do arquivo). Não há upload nesta versão.
   BACKEND FUTURO (não salvos nem simulados): setor, versão, código,
   descrição, permissão de download, rascunho e revisão.
   ========================================================================= */
(function () {
  const { icon, breadcrumb, esc } = UI;
  const { opts, TIPOS_DOC, fieldLbl, guide } = AdminUI;

  function adminDocumentoNovo(id) {
    const d = id ? App.findItem("docsAdm", id) : null;
    if (id && !d) return App.missingPage("Documento não encontrado", "Este documento não existe ou foi removido.", "#/admin/documentos", "Voltar aos documentos");
    const step = (n, t) => `<h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><span class="w-1 h-5 bg-crimson rounded-full"></span>${n}. ${t}</h3>`;
    return {
      title: "Central de Documentos & POPs",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Documentos & POPs",route:"#/admin/documentos"},{label: d ? "Editar Documento" : "Adicionar Documento"}])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Editor & Gestor</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${d ? "Editar Documento" : "Criar Nova Publicação de Documento"}</h2></div>
      <form id="form-doc" data-id="${esc(d?.id || "")}" data-action="prevent" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6">${step(1,"Informações Básicas do Documento")}
            <div class="space-y-4">
              <div>${fieldLbl("Título do Documento ou POP *", "dc-titulo")}<input id="dc-titulo" class="field-input" maxlength="140" placeholder="Digite o título oficial..." value="${esc(d?.titulo || "")}">
                <div class="field-hint">Insira um título claro e objetivo (Ex: POP - Higienização Simples das Mãos)</div></div>
              <div>${fieldLbl("Categoria *", "dc-tipo")}<select id="dc-tipo" class="field-input">${opts(TIPOS_DOC, d?.tipo || "POP")}</select></div>
            </div>
          </div>
          <div class="card p-6">${step(2,"Endereço do Arquivo Oficial")}
            ${fieldLbl("URL do arquivo (https://) *", "dc-url")}
            <input id="dc-url" type="url" class="field-input" maxlength="2048" placeholder="https://exemplo.com/documentos/pop-higienizacao.pdf" value="${esc(d?.url || "")}" autocomplete="off">
            <div class="field-hint">O arquivo precisa estar hospedado em um endereço público https://. O envio de arquivos (upload) ainda não está disponível.</div>
          </div>
        </div>
        <aside class="space-y-5">
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4"><span class="w-1 h-5 bg-crimson rounded-full"></span>Publicação</h3>
            <div class="space-y-2 text-sm" id="dc-check"></div>
            <button type="button" data-action="save-documento" data-status="Publicado" class="btn-crimson w-full mt-5 py-3">${d ? "Salvar alterações" : "Publicar Documento"}</button>
            <a href="#/admin/documentos" class="block text-center text-sm font-bold text-slate-500 mt-3 hover:underline">Cancelar</a>
            <p class="text-xs text-slate-400 mt-3">Setor, versão, descrição, permissões, rascunho e revisão ainda não são salvos pelo servidor (recursos futuros). O documento é publicado imediatamente.</p>
          </div>
          <div class="card p-6"><h3 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3"><span class="w-1 h-5 bg-crimson rounded-full"></span>Diretrizes de Qualidade</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Todos os documentos e POPs publicados na Intranet Hospitalar Decós passam por revisão sistemática do Núcleo de Gestão de Qualidade e SCIH para garantir conformidade técnica.</p>
            <div class="space-y-3">${guide("edit","Linguagem Técnica","Mantenha a terminologia médica padrão e passos numerados.")}
            ${guide("shield","Checagem de Segurança","Evidencie pontos críticos de biossegurança ou dupla checagem.")}</div>
          </div>
        </aside>
      </form>`,
      init() {
        const $ = (i) => document.getElementById(i);
        const check = () => {
          const itens = [
            [$("dc-titulo").value.trim().length >= 5, "Título válido inserido"],
            [urlHttps($("dc-url").value) !== null, "URL https:// válida"],
          ];
          $("dc-check").innerHTML = itens.map(([ok, t]) => `<div class="flex items-center gap-2 ${ok ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}">${icon(ok ? "check" : "x", `w-4 h-4 ${ok ? "text-green-500" : "text-slate-300"}`)} ${t}</div>`).join("");
        };
        ["dc-titulo", "dc-url"].forEach((i) => $(i).addEventListener("input", check));
        check();
      },
    };
  }

  // Devolve a URL normalizada se for https:// válida; senão null.
  function urlHttps(valor) {
    try {
      const u = new URL(String(valor).trim());
      if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return null;
      return u.href.length <= 2048 ? u.href : null;
    } catch (_) { return null; }
  }

  async function submitDocumento() {
    const f = document.getElementById("form-doc");
    if (!f) return;
    const v = (i) => document.getElementById(i).value.trim();
    const titulo = v("dc-titulo");
    if (titulo.length < 5) { App.toast("Informe um título com pelo menos 5 caracteres"); document.getElementById("dc-titulo").focus(); return; }
    const url = urlHttps(v("dc-url"));
    if (!url) { App.toast("Informe uma URL https:// válida para o arquivo"); document.getElementById("dc-url").focus(); return; }
    const tipo = TIPOS_DOC.find((t) => t.value === v("dc-tipo")) || TIPOS_DOC[0];
    const payload = { titulo, categoria: tipo.value, url_arquivo: url };
    const antigo = f.dataset.id ? App.findItem("docsAdm", f.dataset.id) : null;
    const botoes = document.querySelectorAll('[data-action="save-documento"]');
    botoes.forEach((b) => { b.disabled = true; });
    try {
      if (antigo?.apiId) await Services.documentos.update(antigo.apiId, payload);
      else await Services.documentos.create(payload);
      App.logAudit(antigo ? "editou" : "publicou", "Documento: " + titulo, "documento");
      await App.loadApiData();
      App.toast("Documento publicado na central!");
      setTimeout(() => App.go("#/admin/documentos"), 500);
    } finally {
      botoes.forEach((b) => { b.disabled = false; });
    }
  }

  Object.assign(PagesAdmin, { adminDocumentoNovo, submitDocumento });
})();
