/* =========================================================================
   Tela: Controle de acesso (ADMIN)
   Rota: #/admin/acessos
   Fonte: GET /acessos/usuarios e GET /acessos/permissoes; grava em PUT /acessos/usuarios/{id}.
   Substitui a antiga troca de perfil do topo: o perfil de cada pessoa só muda aqui.
   Permissão efetiva = permissões do perfil + concedidas − retiradas (calculado no servidor).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const POR_PAGINA = 20;
  const PERFIS = [["LEITURA", "Leitura"], ["COLABORADOR", "Colaborador"], ["RH", "RH · Editor-Gestor"], ["ADMIN", "Administrador"]];
  const COR_PERFIL = { ADMIN: "red", RH: "amber", COLABORADOR: "blue", LEITURA: "gray" };
  const rotuloPerfil = (p) => (PERFIS.find(([k]) => k === p) || [p, p])[1];

  let catalogo = null; // [{codigo, rotulo, ajustavel, perfis_padrao}]
  let cache = new Map(); // id → usuário exibido (para abrir o painel sem ir ao servidor)

  function ultimoAcesso(iso) {
    return iso ? UI.fmtDataHora(iso) : "Nunca entrou";
  }

  function linha(u) {
    const ajustes = u.ajustes.length
      ? `<span class="badge badge-blue" title="Permissões ajustadas individualmente">${u.ajustes.length} ajuste${u.ajustes.length > 1 ? "s" : ""}</span>` : "";
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${u.ativo ? "" : "opacity-60"}">
      <td class="py-3.5 pl-4"><div class="flex items-center gap-3"><div class="avatar-soft w-9 h-9 text-xs">${UI.foto(u.nome)}${esc(UI.iniciais(u.nome))}</div>
        <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(u.nome)}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(u.email)}</div></div></div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${esc(u.setor)}</td>
      <td><div class="flex items-center gap-1.5 flex-wrap">${badge(COR_PERFIL[u.perfil] || "gray", rotuloPerfil(u.perfil).toUpperCase())}${ajustes}</div></td>
      <td>${u.ativo ? badge("green", "Ativo") : badge("gray", "Inativo")}</td>
      <td class="text-xs text-slate-500 dark:text-slate-400">${esc(ultimoAcesso(u.ultimo_acesso_em))}</td>
      <td class="text-right pr-4"><button class="btn-outline text-xs px-3 py-1.5" data-acesso-abrir="${u.id}" aria-label="Gerenciar acesso de ${esc(u.nome)}">Gerenciar</button></td></tr>`;
  }

  function adminAcessos() {
    const estado = { busca: "", perfil: "", setor_id: "", ativo: "", page: 1 };

    async function carregar() {
      const corpo = document.getElementById("ac-rows"), info = document.getElementById("ac-info"), pager = document.getElementById("ac-pager");
      if (!corpo) return;
      try {
        const [r, cat] = await Promise.all([
          Services.acessos.usuarios({ page: estado.page, page_size: POR_PAGINA, busca: estado.busca, perfil: estado.perfil, setor_id: estado.setor_id, ativo: estado.ativo }),
          catalogo ? Promise.resolve(catalogo) : Services.acessos.permissoes(),
        ]);
        catalogo = cat;
        if (!document.getElementById("ac-rows")) return;
        cache = new Map(r.items.map((u) => [u.id, u]));
        const paginas = Math.max(1, Math.ceil(r.total / POR_PAGINA));
        const filtrado = estado.busca || estado.perfil || estado.setor_id || estado.ativo;
        corpo.innerHTML = r.items.length ? r.items.map(linha).join("")
          : `<tr><td colspan="6" class="py-10 text-center text-slate-500 dark:text-slate-400">${filtrado ? "Nenhum usuário encontrado para este filtro." : "Nenhum usuário cadastrado."}</td></tr>`;
        const a = r.total ? (r.page - 1) * POR_PAGINA + 1 : 0, b = Math.min(r.page * POR_PAGINA, r.total);
        info.textContent = `Exibindo ${a}–${b} de ${r.total}`;
        pager.innerHTML = paginas > 1 ? `<button class="pg" data-pg="prev" ${r.page <= 1 ? "disabled" : ""}>Anterior</button><span class="pg pg-crimson">${r.page} / ${paginas}</span><button class="pg" data-pg="next" ${r.page >= paginas ? "disabled" : ""}>Próximo</button>` : "";
        pager.querySelectorAll("[data-pg]").forEach((btn) => btn.addEventListener("click", () => { estado.page += btn.dataset.pg === "next" ? 1 : -1; carregar(); }));
      } catch (err) {
        if (document.getElementById("ac-rows")) corpo.innerHTML = `<tr><td colspan="6" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar os usuários. ${esc(err.message || "")}</td></tr>`;
      }
    }
    PagesAdmin.recarregarAcessos = carregar;

    const setores = App.setoresAll().map((s) => [String(s.id), s.nome]);
    const select = (id, rotulo, opcoes, atual = "") => `<label class="sr-only" for="${id}">${rotulo}</label><select id="${id}" class="select-field"><option value="">${rotulo}</option>${opcoes.map(([v, l]) => `<option value="${esc(v)}" ${v === atual ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;

    return {
      title: "Controle de acesso",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Controle de acesso</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Defina o perfil de cada pessoa e, se precisar, conceda ou retire permissões específicas. Toda mudança fica registrada na auditoria.</p></div>
      <div class="flex gap-2 items-center flex-wrap mb-4">
        <div class="search-box w-64"><span>${icon("search", "w-4 h-4 text-slate-400")}</span>
          <input id="ac-busca" type="search" aria-label="Buscar por nome, e-mail ou setor" placeholder="Buscar nome, e-mail ou setor..." maxlength="100" class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
        ${select("ac-perfil", "Perfil: todos", PERFIS)}
        ${select("ac-setor", "Setor: todos", setores)}
        ${select("ac-ativo", "Situação: todas", [["true", "Ativos"], ["false", "Inativos"]])}
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th class="py-3 pl-4">USUÁRIO</th><th>SETOR</th><th>PERFIL</th><th>SITUAÇÃO</th><th>ÚLTIMO ACESSO</th><th class="text-right pr-4"><span class="sr-only">Ações</span></th></tr></thead>
        <tbody id="ac-rows"><tr><td colspan="6" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>
      <div class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mt-4 flex-wrap gap-3"><span id="ac-info" aria-live="polite"></span><div class="flex gap-1.5 items-center" id="ac-pager"></div></div>

      <section class="card p-6 mt-8" aria-labelledby="ac-atalhos-h">
        <div class="flex items-center justify-between gap-3 flex-wrap mb-1">
          <h3 id="ac-atalhos-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon("link", "w-5 h-5 text-wine")} Acessos rápidos para todos</h3>
          <button type="button" id="ac-novo-atalho" class="btn-wine px-4">${icon("plus", "w-4 h-4")} Novo atalho</button>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Links que aparecem nos Acessos rápidos de todos os colaboradores (ex.: site do Hospital Decós, prontuário, escala, ponto). Links externos abrem em nova aba.</p>
        <div id="ac-atalhos"><p class="text-sm text-slate-500 dark:text-slate-400">Carregando…</p></div>
      </section>`,
      init() {
        const ao = (id, campo) => document.getElementById(id).addEventListener("change", (e) => { estado[campo] = e.target.value; estado.page = 1; carregar(); });
        ao("ac-perfil", "perfil"); ao("ac-setor", "setor_id"); ao("ac-ativo", "ativo");
        let t = 0;
        document.getElementById("ac-busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.busca = e.target.value.trim(); estado.page = 1; carregar(); }, 300); });
        document.getElementById("ac-rows").addEventListener("click", (e) => {
          const btn = e.target.closest("[data-acesso-abrir]");
          if (btn) abrirPainel(Number(btn.dataset.acessoAbrir));
        });
        carregar();
        carregarAtalhos();
        document.getElementById("ac-novo-atalho").addEventListener("click", () => formAtalho(null));
        document.getElementById("ac-atalhos").addEventListener("click", (e) => {
          const ed = e.target.closest("[data-at-editar]"), rm = e.target.closest("[data-at-excluir]");
          if (ed) formAtalho(atalhosGlobais.find((a) => a.id === Number(ed.dataset.atEditar)));
          if (rm) {
            const a = atalhosGlobais.find((x) => x.id === Number(rm.dataset.atExcluir));
            App.openConfirm("Excluir atalho?", `"${esc(a.nome)}" some dos Acessos rápidos de todos.`, async () => {
              try { await Services.atalhos.remove(a.id); App.toast("Atalho excluído"); carregarAtalhos(); App.loadApiData(); }
              catch (err) { App.toast(err.message || "Não foi possível excluir."); }
            });
          }
        });
      },
    };
  }

  /* ---------- acessos rápidos globais ---------- */
  let atalhosGlobais = [];
  async function carregarAtalhos() {
    const alvo = document.getElementById("ac-atalhos");
    if (!alvo) return;
    try { atalhosGlobais = await Services.atalhos.todos(); }
    catch (err) { alvo.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar os atalhos. ${esc(err.message || "")}</p>`; return; }
    if (!document.contains(alvo)) return;
    alvo.innerHTML = atalhosGlobais.length ? `<ul class="space-y-2">${atalhosGlobais.map((a) => `<li class="versao-item flex items-center gap-3 flex-wrap ${a.ativo ? "" : "opacity-70"}">
        <span class="qa-icon">${icon(a.icone || "link", "w-4 h-4")}</span>
        <span class="min-w-0 flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${esc(a.nome)} ${a.ativo ? "" : badge("gray", "Inativo")}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 truncate">${esc(a.url)} · ordem ${a.ordem}</span></span>
        <span class="flex gap-1"><button type="button" class="act-btn" data-at-editar="${a.id}" aria-label="Editar ${esc(a.nome)}">${icon("edit", "w-4 h-4")}</button>
          <button type="button" class="act-btn act-btn-danger" data-at-excluir="${a.id}" aria-label="Excluir ${esc(a.nome)}">${icon("trash", "w-4 h-4")}</button></span>
      </li>`).join("")}</ul>` : `<p class="text-sm text-slate-500 dark:text-slate-400">Nenhum atalho global ainda. Comece pelo site do Hospital Decós.</p>`;
  }

  function formAtalho(a) {
    App.openPanel(a ? `Editar atalho · ${esc(a.nome)}` : "Novo atalho para todos", `<form id="ag-form" class="space-y-4" novalidate>
      <div><label class="field-label" for="ag-nome">NOME *</label><input id="ag-nome" class="field-input" maxlength="40" value="${esc(a?.nome || "")}" placeholder="Ex.: Site Hospital Decós"></div>
      <div><label class="field-label" for="ag-url">LINK *</label><input id="ag-url" class="field-input" maxlength="500" value="${esc(a?.url || "")}" placeholder="https://… ou #/documentos"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="field-label" for="ag-icone">ÍCONE</label><select id="ag-icone" class="field-input">${["link", "external-link", "monitor", "calendar", "file-text", "users", "clock", "shield"].map((i) => `<option value="${i}" ${i === (a?.icone || "external-link") ? "selected" : ""}>${i}</option>`).join("")}</select></div>
        <div><label class="field-label" for="ag-ordem">ORDEM</label><input id="ag-ordem" class="field-input" type="number" min="0" max="999" value="${a?.ordem ?? 0}"></div>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input id="ag-ativo" type="checkbox" ${a?.ativo === false ? "" : "checked"}> Visível para todos</label>
      <p id="ag-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">Salvar</button>
    </form>`);
    document.getElementById("ag-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = { nome: document.getElementById("ag-nome").value.trim(), url: document.getElementById("ag-url").value.trim(),
        icone: document.getElementById("ag-icone").value, ordem: Number(document.getElementById("ag-ordem").value) || 0, ativo: document.getElementById("ag-ativo").checked };
      const erro = document.getElementById("ag-erro");
      if (!body.nome || !(/^https?:\/\//i.test(body.url) || body.url.startsWith("#/"))) {
        erro.textContent = "Informe o nome e um link que comece com https:// (ou uma rota interna #/…)."; erro.classList.remove("hidden"); return;
      }
      try {
        if (a) await Services.atalhos.update(a.id, body); else await Services.atalhos.create(body);
        App.closePanel(); App.toast("Atalho salvo"); carregarAtalhos(); App.loadApiData();
      } catch (err) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); }
    });
  }

  /* ---------- painel do usuário ---------- */
  // Estado de cada permissão no rascunho: "padrao" | "concedida" | "retirada".
  function estadoInicial(u) {
    const m = {};
    u.ajustes.forEach((a) => { m[a.permissao] = a.concedida ? "concedida" : "retirada"; });
    return m;
  }

  function linhaPermissao(p, perfil, rascunho) {
    const doPerfil = p.perfis_padrao.includes(perfil);
    const atual = rascunho[p.codigo] || "padrao";
    const efetiva = atual === "concedida" || (atual === "padrao" && doPerfil);
    const origem = atual === "padrao" ? (doPerfil ? "do perfil" : "fora do perfil") : atual === "concedida" ? "concedida individualmente" : "retirada individualmente";
    const nome = `perm-${p.codigo}`;
    const opcao = (valor, rotulo) => `<label class="acc-opt"><input type="radio" name="${nome}" value="${valor}" ${atual === valor ? "checked" : ""} ${p.ajustavel ? "" : "disabled"}><span>${rotulo}</span></label>`;
    return `<fieldset class="acc-perm ${efetiva ? "acc-perm-on" : ""}" data-perm="${p.codigo}">
      <legend class="sr-only">${esc(p.rotulo)}</legend>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">${efetiva ? icon("check", "w-4 h-4 text-green-600 dark:text-green-400") : icon("x", "w-4 h-4 text-slate-400")}${esc(p.rotulo)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${p.ajustavel ? esc(origem) : "Só pelo perfil Administrador"}</div></div>
      </div>
      ${p.ajustavel ? `<div class="acc-opts mt-2">${opcao("padrao", doPerfil ? "Padrão (tem)" : "Padrão (não tem)")}${doPerfil ? opcao("retirada", "Retirar") : opcao("concedida", "Conceder")}</div>` : ""}
    </fieldset>`;
  }

  function abrirPainel(id) {
    const u = cache.get(id);
    if (!u || !catalogo) return;
    const eu = App.state.user?.id === u.id;
    const rascunho = estadoInicial(u);
    let perfil = u.perfil, ativo = u.ativo;

    const corpoPermissoes = () => catalogo.map((p) => linhaPermissao(p, perfil, rascunho)).join("");
    App.openPanel(`Acesso · ${esc(u.nome)}`, `<form id="ac-form" class="space-y-5" novalidate>
      <div class="text-sm text-slate-600 dark:text-slate-300">${esc(u.email)} · ${esc(u.setor)}${u.cargo ? ` · ${esc(u.cargo)}` : ""}</div>
      ${eu ? `<div class="card p-3 text-xs text-slate-600 dark:text-slate-300">${icon("alert-triangle", "w-4 h-4 inline mr-1")}Este é o seu próprio usuário: perfil e situação não podem ser alterados aqui.</div>` : ""}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="field-label" for="ac-f-perfil">PERFIL</label>
          <select id="ac-f-perfil" class="field-input" ${eu ? "disabled" : ""}>${PERFIS.map(([k, l]) => `<option value="${k}" ${k === perfil ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><span class="field-label" id="ac-f-ativo-lbl">SITUAÇÃO</span>
          <label class="flex items-center gap-2 mt-2 text-sm text-slate-700 dark:text-slate-200"><input id="ac-f-ativo" type="checkbox" ${ativo ? "checked" : ""} ${eu ? "disabled" : ""} aria-labelledby="ac-f-ativo-lbl"> Acesso ativo</label></div>
      </div>
      <div><div class="field-label">PERMISSÕES</div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">"Padrão" segue o perfil. Conceda ou retire só as exceções desta pessoa.</p>
        <div id="ac-perms" class="space-y-2">${corpoPermissoes()}</div></div>
      <div id="ac-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></div>
      <button type="submit" class="btn-wine w-full py-3">Salvar alterações</button>
    </form>`);

    const form = document.getElementById("ac-form");
    const redesenhar = () => { document.getElementById("ac-perms").innerHTML = corpoPermissoes(); };
    form.querySelector("#ac-f-perfil").addEventListener("change", (e) => {
      perfil = e.target.value;
      // Ajuste que passou a ser o próprio padrão do novo perfil deixa de existir.
      catalogo.forEach((p) => {
        const doPerfil = p.perfis_padrao.includes(perfil);
        if ((rascunho[p.codigo] === "concedida" && doPerfil) || (rascunho[p.codigo] === "retirada" && !doPerfil)) delete rascunho[p.codigo];
      });
      redesenhar();
    });
    form.querySelector("#ac-f-ativo").addEventListener("change", (e) => { ativo = e.target.checked; });
    form.querySelector("#ac-perms").addEventListener("change", (e) => {
      const fs = e.target.closest("[data-perm]");
      if (!fs) return;
      if (e.target.value === "padrao") delete rascunho[fs.dataset.perm]; else rascunho[fs.dataset.perm] = e.target.value;
      redesenhar();
      document.querySelector(`[data-perm="${fs.dataset.perm}"] input[value="${e.target.value}"]`)?.focus();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const original = estadoInicial(u);
      const codigos = new Set([...Object.keys(original), ...Object.keys(rascunho)]);
      const ajustes = [...codigos].filter((c) => original[c] !== rascunho[c])
        .map((c) => ({ permissao: c, concedida: rascunho[c] === "concedida" ? true : rascunho[c] === "retirada" ? false : null }));
      const body = {};
      if (perfil !== u.perfil) body.perfil = perfil;
      if (ativo !== u.ativo) body.ativo = ativo;
      if (ajustes.length) body.ajustes = ajustes;
      if (!Object.keys(body).length) { App.toast("Nenhuma alteração para salvar."); return; }

      const mudancas = [
        body.perfil ? `perfil: ${rotuloPerfil(u.perfil)} → ${rotuloPerfil(body.perfil)}` : "",
        "ativo" in body ? (body.ativo ? "reativar o acesso" : "desativar o acesso") : "",
        ajustes.length ? `${ajustes.length} ajuste${ajustes.length > 1 ? "s" : ""} de permissão` : "",
      ].filter(Boolean).join(", ");
      App.openConfirm("Confirmar alteração de acesso", `${esc(u.nome)}: ${esc(mudancas)}.`, () => salvar(u, body), "Salvar", "btn-wine");
    });
  }

  async function salvar(u, body) {
    try {
      const atualizado = await Services.acessos.atualizar(u.id, body);
      cache.set(atualizado.id, atualizado);
      App.toast("Acesso atualizado");
      App.closePanel();
      PagesAdmin.recarregarAcessos?.();
    } catch (err) {
      const erro = document.getElementById("ac-erro");
      const msg = err.status === 409 ? "Não é possível rebaixar ou desativar o último administrador ativo."
        : err.message || "Não foi possível salvar.";
      if (erro) { erro.textContent = msg; erro.classList.remove("hidden"); } else App.toast(msg);
    }
  }

  Object.assign(PagesAdmin, { adminAcessos });
})();
