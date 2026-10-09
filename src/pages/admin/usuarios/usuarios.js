/* =========================================================================
   Tela: Usuários & Setores (Admin)
   Rota: #/admin/usuarios
   Fonte: GET /usuarios e GET /setores (escrita só ADMIN, validada no backend).
   "Remover" um usuário o DESATIVA (DELETE /usuarios/{id} não apaga o cadastro).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const { wireList } = Lib;
  const { statCard, sel } = AdminUI;

  function adminUsuarios() {
    const roleBadge = (r) => {
      const map = { admin: "red", rh: "amber", normal: "blue", leitura: "gray" };
      return badge(map[r] || "gray", DB.roles[r]?.curto || esc(r));
    };
    const eu = App.state.user;
    const lista = App.state.usuarios;
    const conta = (fn) => lista.filter(fn).length;
    const rows = lista.map((u) => `
      <tr class="user-row border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${u.status === "Inativo" ? "opacity-60" : ""}" data-role="${esc(u.role)}" data-status="${esc(u.status)}" data-busca="${esc((u.nome + " " + u.email + " " + u.setor + " " + u.cargo).toLowerCase())}">
        <td class="py-3.5 pl-4"><div class="flex items-center gap-3"><div class="avatar-soft w-9 h-9 text-xs">${UI.foto(u.nome)}${esc(UI.iniciais(u.nome))}</div>
          <div><div class="font-bold text-slate-800 dark:text-slate-100">${esc(u.nome)}</div><div class="text-xs text-slate-400">${esc(u.email)}</div></div></div></td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${esc(u.setor)}</td>
        <td class="text-sm text-slate-500 dark:text-slate-400">${esc(u.cargo)}</td>
        <td>${roleBadge(u.role)}</td>
        <td>${u.status === "Ativo" ? badge("green", "Ativo") : badge("gray", "Inativo")}${u.senhaTemporaria ? `<div class="mt-1">${badge("amber", "Senha temporária")}</div>` : ""}</td>
        <td><div class="flex items-center gap-1.5 justify-end pr-4">
          <button class="act-btn" data-action="open-usuario" data-id="${esc(u.id)}" title="Editar">${icon("edit","w-4 h-4")}</button>
          <button class="act-btn" data-action="open-senha" data-id="${esc(u.id)}" title="Redefinir senha">${icon("key","w-4 h-4")}</button>
          ${u.status === "Inativo"
            ? `<button class="act-btn" data-action="reactivate-usuario" data-id="${esc(u.apiId)}" data-nome="${esc(u.nome)}" title="Reativar usuário">${icon("rotate-ccw","w-4 h-4")}</button>`
            : u.apiId === eu.id ? "" : `<button class="act-btn act-btn-danger" data-action="deactivate-usuario" data-id="${esc(u.apiId)}" data-nome="${esc(u.nome)}" title="Desativar usuário">${icon("trash","w-4 h-4")}</button>`}</div></td>
      </tr>`).join("");
    const setoresLista = App.setoresAll();
    const setores = setoresLista.map((s) => {
      const qtd = App.state.api.usuariosRaw.filter((u) => u.setor_id === s.id).length;
      return `
      <div class="card p-4 flex items-center justify-between gap-3">
        <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100 truncate">${esc(s.nome)}</div>
        <div class="text-xs text-slate-400">ramal ${esc(s.ramal || "—")}</div></div>
        <div class="flex items-center gap-1.5 shrink-0"><span class="badge badge-blue">${qtd} ${qtd === 1 ? "ativo" : "ativos"}</span>
          <button class="act-btn" data-action="open-setor" data-id="${esc(s.id)}" title="Editar setor">${icon("edit","w-4 h-4")}</button>
          <button class="act-btn act-btn-danger" data-action="delete-setor" data-id="${esc(s.id)}" data-nome="${esc(s.nome)}" title="Excluir setor">${icon("trash","w-4 h-4")}</button></div>
      </div>`;
    }).join("") || `<div class="card p-6 text-center text-sm text-slate-400">Nenhum setor cadastrado.</div>`;

    return {
      title: "Gestão de Usuários & Setores",
      html: `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><div class="text-sm text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Usuários & Setores</h2></div>
        <button data-action="open-usuario" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus","w-4 h-4")} Novo Usuário</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        ${statCard("USUÁRIOS ATIVOS", conta((u) => u.status === "Ativo"), lista.length + " cadastrados (" + conta((u) => u.status === "Inativo") + " inativos)", "users")}
        ${statCard("COLABORADORES", conta((u) => u.role === "normal"), conta((u) => u.role === "rh") + " RH · " + conta((u) => u.role === "leitura") + " leitura", "user")}
        ${statCard("PERFIS ADMIN", conta((u) => u.role === "admin"), "acesso total", "shield")}
        ${statCard("SETORES", setoresLista.length, "cadastrados", "users")}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="font-bold text-slate-800 dark:text-slate-100">Colaboradores e Papéis de Acesso</h3>
            <div class="flex gap-2 flex-wrap">
              <div class="search-box w-48"><span>${icon("search","w-4 h-4 text-slate-400")}</span><input id="us-busca" placeholder="Buscar..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200"></div>
              <select id="us-role" class="select-field"><option value="">Papel: Todos</option>${App.ROLE_ORDER.map((r) => `<option value="${r}">${DB.roles[r].label}</option>`).join("")}</select>
              <select id="us-status" class="select-field"><option value="">Status: Todos</option><option value="Ativo" selected>Status: Ativos</option><option value="Inativo">Status: Inativos</option></select>
            </div>
          </div>
          <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
            <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <th class="py-3 pl-4">USUÁRIO</th><th>SETOR</th><th>CARGO</th><th>PAPEL</th><th>STATUS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
            <tbody id="us-rows">${rows}</tbody></table></div>
          <div class="flex items-center justify-between text-sm text-slate-400 mt-4 flex-wrap gap-3">
            <span id="us-info"></span><div class="flex gap-1.5" id="us-pager"></div>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-3 gap-2"><h3 class="font-bold text-slate-800 dark:text-slate-100">Setores & Ramais</h3>
            <button data-action="open-setor" class="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">${icon("plus","w-3.5 h-3.5")} Novo setor</button></div>
          <div class="space-y-3">${setores}</div>
        </div>
      </div>`,
      init() {
        wireList({ containerId: "us-rows", itemSel: ".user-row", size: 8, pagerId: "us-pager", infoId: "us-info", label: "usuários", crimson: true,
          controls: ["#us-busca", "#us-role", "#us-status"], onEmpty: "Nenhum usuário encontrado.",
          filterFn: (el) => { const q = sel("us-busca").trim().toLowerCase(), r = sel("us-role"), st = sel("us-status");
            return (!r || el.dataset.role === r) && (!st || el.dataset.status === st) && (!q || el.dataset.busca.includes(q)); } });
      },
    };
  }

  Object.assign(PagesAdmin, { adminUsuarios });
})();
