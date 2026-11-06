/* =========================================================================
   Tela: Controle de acesso (ADMIN)
   Rota: #/admin/acessos
   Fonte: GET /acessos/perfis, /acessos/permissoes, /acessos/usuarios e /funcionalidades.
   O acesso é por perfil, nunca por pessoa. "Perfis de acesso" mostra um card por perfil; editar
   um perfil grava as permissões em PUT /acessos/perfis/{perfil} (vale para todos do perfil) e os
   módulos que ele vê em PUT /funcionalidades/{codigo}. Cada pessoa só recebe um perfil
   (PUT /acessos/usuarios/{id}: perfil e situação). O perfil Administrador tem todas as permissões.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const POR_PAGINA = 20;
  const PERFIS = [["LEITURA", "Leitura"], ["COLABORADOR", "Colaborador"], ["RH", "RH · Editor-Gestor"], ["ADMIN", "Administrador"]];
  const COR_PERFIL = { ADMIN: "red", RH: "amber", COLABORADOR: "blue", LEITURA: "gray" };
  const rotuloPerfil = (p) => (PERFIS.find(([k]) => k === p) || [p, p])[1];

  let catalogo = null; // [{codigo, rotulo, editavel, perfis, perfis_padrao}]
  let perfisInfo = []; // [{perfil, editavel, permissoes, usuarios_ativos}]
  let cache = new Map(); // id → usuário exibido (para abrir o painel sem ir ao servidor)

  function ultimoAcesso(iso) {
    return iso ? UI.fmtDataHora(iso) : "Nunca entrou";
  }

  function linha(u) {
    return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${u.ativo ? "" : "opacity-60"}">
      <td class="py-3.5 pl-4"><div class="flex items-center gap-3"><div class="avatar-soft w-9 h-9 text-xs">${UI.foto(u.nome)}${esc(UI.iniciais(u.nome))}</div>
        <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(u.nome)}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(u.email)}</div></div></div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${esc(u.setor)}</td>
      <td><div class="flex items-center gap-1.5 flex-wrap">${badge(COR_PERFIL[u.perfil] || "gray", rotuloPerfil(u.perfil).toUpperCase())}</div></td>
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
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">O acesso é definido por perfil: escolha o que cada perfil pode fazer e depois o perfil de cada pessoa. Toda mudança fica registrada na auditoria.</p></div>
      <section class="mb-8" aria-labelledby="ac-perfis-h">
        <h3 id="ac-perfis-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">${icon("shield", "w-5 h-5 text-wine")} Perfis de acesso</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-3xl">São 4 perfis. Em cada um, escolha o que ele pode fazer e quais módulos ele vê; vale na hora para todas as pessoas do perfil. Usuários, acessos e auditoria são sempre só do Administrador.</p>
        <div id="ac-perfis" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"><p class="text-sm text-slate-500 dark:text-slate-400">Carregando…</p></div>
      </section>
      <h3 class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">${icon("users", "w-5 h-5 text-wine")} Pessoas e perfis</h3>
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
        carregarPerfis();
        document.getElementById("ac-perfis").addEventListener("click", (e) => {
          const btn = e.target.closest("[data-perfil-editar]");
          if (btn) editarPerfil(btn.dataset.perfilEditar);
        });
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

  /* ---------- perfis de acesso: um card e um editor por perfil ---------- */
  const DESCRICAO_PERFIL = {
    LEITURA: "Só consulta: lê avisos, documentos e eventos.",
    COLABORADOR: "O padrão: consulta e interage (chamados, inscrições, parabéns).",
    RH: "Edita e gerencia conteúdo da intranet.",
    ADMIN: "Tudo, inclusive usuários, acessos e auditoria.",
  };
  // Permissões agrupadas por assunto; o que o catálogo trouxer fora daqui vai em "Outras".
  const GRUPOS = [
    ["Consultar", ["baixar"]],
    ["Interagir", ["interagir"]],
    ["Conteúdo", ["gerenciar_avisos", "gerenciar_documentos", "gerenciar_faq", "gerenciar_eventos", "gerenciar_avaliacoes", "gerenciar_vagas"]],
    ["Atendimento e gestão", ["gerenciar_chamados", "aprovar_publicacoes", "ver_indicadores", "excluir_definitivo"]],
    ["Só do Administrador", ["gerenciar_usuarios", "auditoria"]],
  ];
  // Sem tela desde que as Solicitações Cadastrais saíram: não aparece, e o valor gravado é mantido.
  const OCULTAS = new Set(["editar_perfil"]);
  const CONTEUDO = ["gerenciar_avisos", "gerenciar_documentos", "gerenciar_faq", "gerenciar_eventos"];
  // Atalhos que preenchem o editor (nada é gravado até clicar em Salvar).
  const MODELOS = [
    ["leitura", "Somente leitura", "Vê e baixa; não interage.", ["baixar"]],
    ["interagir", "Pode interagir", "Leitura + chamados, inscrições e parabéns.", ["baixar", "interagir"]],
    ["conteudo", "Edita conteúdo", "Interage e gerencia avisos, documentos, FAQ e eventos.", ["baixar", "interagir", ...CONTEUDO]],
    ["gestor", "Gestor", "Conteúdo + vagas, avaliações, chamados, aprovações e indicadores.",
      ["baixar", "interagir", ...CONTEUDO, "gerenciar_vagas", "gerenciar_avaliacoes", "gerenciar_chamados", "aprovar_publicacoes", "ver_indicadores"]],
  ];
  let modulos = []; // GET /funcionalidades: [{codigo, rotulo, publicos, ligada_para}]

  async function carregarPerfis() {
    const alvo = document.getElementById("ac-perfis");
    try {
      const [perfis, cat, mods] = await Promise.all([Services.acessos.perfis(), Services.acessos.permissoes(), Services.funcionalidades.listar()]);
      perfisInfo = perfis; catalogo = cat; modulos = mods;
      desenharPerfis();
    } catch (err) {
      if (alvo && document.contains(alvo)) alvo.innerHTML = `<p class="card p-5 text-sm text-slate-500 dark:text-slate-400 sm:col-span-2 xl:col-span-4">Não foi possível carregar os perfis. ${esc(err.message || "")}</p>`;
    }
  }

  const visiveis = () => catalogo.filter((c) => !OCULTAS.has(c.codigo));
  const modulosDo = (perfil) => modulos.filter((m) => m.publicos.includes(perfil));

  function desenharPerfis() {
    const alvo = document.getElementById("ac-perfis");
    if (!alvo || !catalogo) return;
    alvo.innerHTML = PERFIS.map(([perfil, rotulo]) => {
      const info = perfisInfo.find((p) => p.perfil === perfil);
      if (!info) return "";
      const tem = new Set(info.permissoes);
      const perms = visiveis().filter((c) => tem.has(c.codigo));
      const mods = modulosDo(perfil), ligados = mods.filter((m) => m.ligada_para.includes(perfil));
      const pessoas = info.usuarios_ativos;
      return `<article class="card p-5 flex flex-col gap-3" data-perfil-card="${perfil}">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><div class="flex items-center gap-2 flex-wrap">${badge(COR_PERFIL[perfil] || "gray", rotulo.toUpperCase())}${info.editavel ? "" : `<span class="text-xs text-slate-500 dark:text-slate-400">${icon("lock", "w-3.5 h-3.5 inline")} fixo</span>`}</div>
            <p class="text-sm text-slate-600 dark:text-slate-300 mt-2">${esc(DESCRICAO_PERFIL[perfil] || "")}</p></div>
        </div>
        <dl class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-2"><dt class="text-[11px] text-slate-500 dark:text-slate-400">Pessoas</dt><dd class="font-extrabold text-slate-800 dark:text-slate-100" data-perfil-pessoas>${pessoas}</dd></div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-2"><dt class="text-[11px] text-slate-500 dark:text-slate-400">Permissões</dt><dd class="font-extrabold text-slate-800 dark:text-slate-100" data-perfil-perms>${perms.length}/${visiveis().length}</dd></div>
          <div class="rounded-lg bg-slate-50 dark:bg-slate-800/40 py-2"><dt class="text-[11px] text-slate-500 dark:text-slate-400">Módulos</dt><dd class="font-extrabold text-slate-800 dark:text-slate-100" data-perfil-mods>${ligados.length}/${mods.length}</dd></div>
        </dl>
        <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-1 flex-1">${perms.length ? perms.slice(0, 4).map((c) => `<li class="flex items-start gap-1.5">${icon("check", "w-3.5 h-3.5 mt-0.5 text-green-600 dark:text-green-400 shrink-0")}<span>${esc(c.rotulo)}</span></li>`).join("") + (perms.length > 4 ? `<li class="text-slate-500 dark:text-slate-400">+ ${perms.length - 4} outras</li>` : "")
          : `<li class="text-slate-500 dark:text-slate-400">Nenhuma permissão: só vê o que é aberto a todos.</li>`}</ul>
        <button type="button" class="btn-outline w-full py-2 text-sm" data-perfil-editar="${perfil}" aria-label="Editar o acesso do perfil ${esc(rotulo)}">${icon("edit", "w-4 h-4")} Editar acesso</button>
      </article>`;
    }).join("");
  }

  function editarPerfil(perfil) {
    const info = perfisInfo.find((p) => p.perfil === perfil);
    if (!info || !catalogo) return;
    const rotulo = rotuloPerfil(perfil);
    const permitidas = new Set(info.permissoes);
    const ligados = new Set(modulosDo(perfil).filter((m) => m.ligada_para.includes(perfil)).map((m) => m.codigo));
    const conhecidas = new Set(GRUPOS.flatMap(([, cods]) => cods));
    const grupos = [...GRUPOS, ["Outras", visiveis().filter((c) => !conhecidas.has(c.codigo)).map((c) => c.codigo)]];
    const porCodigo = new Map(catalogo.map((c) => [c.codigo, c]));
    // Pode mudar aqui? O perfil ADMIN é fixo e Usuários/Auditoria nunca saem dele.
    const aceita = (c) => info.editavel && c.editavel;

    const blocoPerms = grupos.map(([titulo, cods]) => {
      const itens = cods.map((cod) => porCodigo.get(cod)).filter((c) => c && !OCULTAS.has(c.codigo));
      if (!itens.length) return "";
      return `<fieldset class="mb-4"><legend class="field-label mb-2">${esc(titulo.toUpperCase())}</legend><div class="space-y-2">${itens.map((c) => `
        <label class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200 ${aceita(c) ? "" : "opacity-70"}"><input type="checkbox" class="acc-check mt-0.5" data-pe-perm="${c.codigo}" ${permitidas.has(c.codigo) ? "checked" : ""} ${aceita(c) ? "" : "disabled"}>
          <span>${esc(c.rotulo)}${aceita(c) ? "" : `<span class="block text-xs text-slate-500 dark:text-slate-400">${info.editavel ? "Só do Administrador" : "O Administrador tem todas"}</span>`}</span></label>`).join("")}</div></fieldset>`;
    }).join("");
    const mods = modulosDo(perfil);
    const blocoMods = mods.length ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${mods.map((m) => `
        <label class="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" class="acc-check" data-pe-mod="${m.codigo}" ${ligados.has(m.codigo) ? "checked" : ""}> ${esc(m.rotulo)}</label>`).join("")}</div>`
      : `<p class="text-sm text-slate-500 dark:text-slate-400">Nenhum módulo configurável.</p>`;

    App.openPanel(`Acesso do perfil ${esc(rotulo)}`, `<form id="pe-form" class="space-y-5" novalidate>
      <p class="text-sm text-slate-600 dark:text-slate-300">${esc(DESCRICAO_PERFIL[perfil] || "")} Vale na hora para ${info.usuarios_ativos} ${info.usuarios_ativos === 1 ? "pessoa ativa" : "pessoas ativas"}.</p>
      ${info.editavel ? `<div><div class="field-label mb-2">COMEÇAR DE UM MODELO</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${MODELOS.map(([id, nome, desc]) => `<button type="button" class="btn-outline !flex flex-col !items-start !justify-start gap-0.5 text-left px-3 py-2" data-pe-modelo="${id}"><span class="block font-bold text-sm">${esc(nome)}</span><span class="block text-xs text-slate-500 dark:text-slate-400 font-normal">${esc(desc)}</span></button>`).join("")}</div>
        <button type="button" class="text-xs font-bold text-wine mt-2 underline" data-pe-padrao>Restaurar o padrão do perfil ${esc(rotulo)}</button></div>` : ""}
      <div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">O que pode fazer</h3>${blocoPerms}</div>
      <div><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Módulos que vê</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Desmarcado, o módulo some do menu e das telas deste perfil; nada é apagado.</p>${blocoMods}</div>
      <p id="pe-resumo" class="text-sm text-slate-600 dark:text-slate-300" aria-live="polite"></p>
      <div id="pe-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></div>
      <button type="submit" id="pe-salvar" class="btn-wine w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Salvar</button>
    </form>`);

    const form = document.getElementById("pe-form");
    const marcadas = (attr) => new Set([...form.querySelectorAll(`[data-${attr}]`)].filter((i) => i.checked).map((i) => i.dataset[attr === "pe-perm" ? "pePerm" : "peMod"]));
    const mudancas = () => {
      const perms = marcadas("pe-perm"), mods = marcadas("pe-mod");
      const lista = [];
      visiveis().forEach((c) => { if (aceita(c) && perms.has(c.codigo) !== permitidas.has(c.codigo)) lista.push([perms.has(c.codigo) ? "✓ Dar" : "✕ Tirar", c.rotulo]); });
      mods.forEach((m) => { if (!ligados.has(m)) lista.push(["✓ Mostrar", "módulo " + modulos.find((x) => x.codigo === m).rotulo]); });
      ligados.forEach((m) => { if (!mods.has(m)) lista.push(["✕ Esconder", "módulo " + modulos.find((x) => x.codigo === m).rotulo]); });
      return { perms, mods, lista };
    };
    const atualizar = () => {
      const { lista } = mudancas(), n = lista.length;
      const botao = document.getElementById("pe-salvar");
      botao.disabled = !n;
      botao.textContent = n ? `Salvar ${n} ${n === 1 ? "mudança" : "mudanças"}` : "Salvar";
      document.getElementById("pe-resumo").textContent = n ? "" : "Nenhuma mudança ainda.";
    };
    const aplicar = (codigos) => {
      const alvo = new Set(codigos);
      form.querySelectorAll("[data-pe-perm]:not([disabled])").forEach((i) => { i.checked = alvo.has(i.dataset.pePerm); });
      atualizar();
    };
    form.addEventListener("change", atualizar);
    form.querySelectorAll("[data-pe-modelo]").forEach((b) => b.addEventListener("click", () => {
      const [, nome, , codigos] = MODELOS.find(([id]) => id === b.dataset.peModelo);
      aplicar(codigos);
      App.toast(`Modelo "${nome}" aplicado. Revise e clique em Salvar.`);
    }));
    form.querySelector("[data-pe-padrao]")?.addEventListener("click", () => {
      aplicar(catalogo.filter((c) => (c.perfis_padrao || []).includes(perfil)).map((c) => c.codigo));
      App.toast("Padrão do perfil carregado. Revise e clique em Salvar.");
    });
    atualizar();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { perms, mods, lista } = mudancas();
      if (!lista.length) return;
      const texto = lista.map(([acao, nome]) => `${acao} <b>${esc(nome)}</b>`).join("<br>");
      App.openConfirm(`Salvar o acesso do perfil ${esc(rotulo)}?`, `${texto}<br><br>Afeta ${info.usuarios_ativos} ${info.usuarios_ativos === 1 ? "pessoa ativa" : "pessoas ativas"} na hora.`, async () => {
        const erro = document.getElementById("pe-erro");
        try {
          if (info.editavel) {
            // Mantém o que não aparece no editor (permissões ocultas) como estava.
            const novas = catalogo.filter((c) => (aceita(c) && !OCULTAS.has(c.codigo) ? perms.has(c.codigo) : permitidas.has(c.codigo))).map((c) => c.codigo);
            const mudouPerm = novas.length !== permitidas.size || novas.some((c) => !permitidas.has(c));
            if (mudouPerm) await Services.acessos.definirPerfil(perfil, novas);
          }
          for (const m of modulos) {
            if (!m.publicos.includes(perfil) || mods.has(m.codigo) === ligados.has(m.codigo)) continue;
            const ligadaPara = mods.has(m.codigo) ? [...m.ligada_para, perfil] : m.ligada_para.filter((p) => p !== perfil);
            await Services.funcionalidades.definir(m.codigo, ligadaPara);
          }
          App.toast(`Acesso do perfil ${rotulo} atualizado`);
          App.closePanel();
          await carregarPerfis();
          // O próprio ADMIN pode ter mudado o que ele vê: menu e telas se ajustam já.
          await App.atualizarFuncionalidades?.(true);
          App.loadApiData?.();
        } catch (err) {
          if (erro) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); } else App.toast(err.message || "Não foi possível salvar.");
          carregarPerfis();
        }
      }, "Salvar", "btn-wine");
    });
  }

  /* ---------- painel do usuário: só perfil e situação ---------- */
  function resumoDoPerfil(perfil) {
    const info = perfisInfo.find((p) => p.perfil === perfil);
    if (!info || !catalogo) return "";
    const tem = catalogo.filter((c) => info.permissoes.includes(c.codigo));
    return tem.length ? `<ul class="space-y-1.5">${tem.map((c) => `<li class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">${icon("check", "w-4 h-4 text-green-600 dark:text-green-400")}${esc(c.rotulo)}</li>`).join("")}</ul>`
      : `<p class="text-sm text-slate-500 dark:text-slate-400">Este perfil não tem permissões.</p>`;
  }

  function abrirPainel(id) {
    const u = cache.get(id);
    if (!u || !catalogo) return;
    const eu = App.state.user?.id === u.id;
    let perfil = u.perfil, ativo = u.ativo;

    App.openPanel(`Acesso · ${esc(u.nome)}`, `<form id="ac-form" class="space-y-5" novalidate>
      <div class="text-sm text-slate-600 dark:text-slate-300">${esc(u.email)} · ${esc(u.setor)}${u.cargo ? ` · ${esc(u.cargo)}` : ""}</div>
      ${eu ? `<div class="card p-3 text-xs text-slate-600 dark:text-slate-300">${icon("alert-triangle", "w-4 h-4 inline mr-1")}Este é o seu próprio usuário: perfil e situação não podem ser alterados aqui.</div>` : ""}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label class="field-label" for="ac-f-perfil">PERFIL</label>
          <select id="ac-f-perfil" class="field-input" ${eu ? "disabled" : ""}>${PERFIS.map(([k, l]) => `<option value="${k}" ${k === perfil ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><span class="field-label" id="ac-f-ativo-lbl">SITUAÇÃO</span>
          <label class="flex items-center gap-2 mt-2 text-sm text-slate-700 dark:text-slate-200"><input id="ac-f-ativo" type="checkbox" ${ativo ? "checked" : ""} ${eu ? "disabled" : ""} aria-labelledby="ac-f-ativo-lbl"> Acesso ativo</label></div>
      </div>
      <div><div class="field-label">O QUE ESTE PERFIL PODE FAZER</div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">As permissões são do perfil, não da pessoa. Para mudar, use "Editar acesso" no card do perfil, em Perfis de acesso.</p>
        <div id="ac-perms">${resumoDoPerfil(perfil)}</div></div>
      <div id="ac-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></div>
      <button type="submit" class="btn-wine w-full py-3">Salvar alterações</button>
    </form>`);

    const form = document.getElementById("ac-form");
    form.querySelector("#ac-f-perfil").addEventListener("change", (e) => { perfil = e.target.value; document.getElementById("ac-perms").innerHTML = resumoDoPerfil(perfil); });
    form.querySelector("#ac-f-ativo").addEventListener("change", (e) => { ativo = e.target.checked; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const body = {};
      if (perfil !== u.perfil) body.perfil = perfil;
      if (ativo !== u.ativo) body.ativo = ativo;
      if (!Object.keys(body).length) { App.toast("Nenhuma alteração para salvar."); return; }
      const mudancas = [
        body.perfil ? `perfil: ${rotuloPerfil(u.perfil)} → ${rotuloPerfil(body.perfil)}` : "",
        "ativo" in body ? (body.ativo ? "reativar o acesso" : "desativar o acesso") : "",
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
      carregarPerfis(); // contagem de pessoas por perfil
    } catch (err) {
      const erro = document.getElementById("ac-erro");
      const msg = err.status === 409 ? "Não é possível rebaixar ou desativar o último administrador ativo."
        : err.message || "Não foi possível salvar.";
      if (erro) { erro.textContent = msg; erro.classList.remove("hidden"); } else App.toast(msg);
    }
  }

  Object.assign(PagesAdmin, { adminAcessos });
})();
