/* =========================================================================
   Tela: Meu Perfil
   Rota: #/perfil
   ========================================================================= */
(function () {
  const { icon, badge, foto, esc, kv, iniciais } = UI;
  const { wireFilters } = Lib;

  function perfil() {
    const u = App.state.user;
    const st = App.state;
    // Matrícula, unidade, andar e admissão ainda não existem no backend (BACKEND FUTURO).
    const nascimento = u.data_nascimento ? u.data_nascimento.split("-").reverse().join("/") : "—";
    const setorNome = u.setor?.nome || "—";
    // Dados cadastrais são mantidos pelo RH: só leitura aqui, alteração via pedido.
    const field = (label, value) => `<div><label class="field-label">${label}</label><input class="field-input opacity-80" value="${esc(value)}" readonly></div>`;
    const statusTone = { "Aberto": "blue", "Em análise": "amber", "Concluído": "green" };
    const item = (titulo, sub, status) => `<div class="flex items-start justify-between gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div class="min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100">${titulo}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${sub}</div></div>
      ${badge(statusTone[status] || "gray", status)}</div>`;
    const inscricoes = DB.eventos.filter((e) => st.inscricoes.includes(e.id));
    const atividades = [
      ...st.chamados.map((c) => item(`${esc(c.tipo)} ${esc(c.protocolo)}`, `${esc(c.categoria)} · ${esc(c.descricao)}`, c.status)),
      ...st.perfilPedidos.map((p) => item(`Alteração: ${esc(p.campo)}`, `Novo valor: ${esc(p.valor)}`, p.status)),
      ...inscricoes.map((e) => `<a href="#/eventos/${e.id}" class="block">${item(`Inscrição: ${e.titulo}`, `${e.dia}/${e.mes} · ${e.horario} · ${e.local}`, "Confirmada")}</a>`),
    ];
    return {
      title: "Meu Perfil",
      html: `
      <div class="flex gap-2 mb-6" data-filter-group="perfil">
        <button class="chip chip-active" data-filter="dados">Dados Pessoais</button>
        <button class="chip" data-filter="seguranca">Segurança & Conta</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="space-y-6">
          <div class="card p-6 text-center">
            <div class="avatar-birthday w-28 h-28 text-3xl mx-auto mb-3">${foto(u.nome)}${esc(iniciais(u.nome))}</div>
            <div class="font-extrabold text-lg text-slate-800 dark:text-slate-100">${esc(u.nome)}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">${esc(u.cargo || "—")}</div>
            <div class="text-sm font-bold text-wine mb-4">Matrícula: —</div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-sm text-left">
              ${kv("SETOR",esc(setorNome))}${kv("UNIDADE","—")}${kv("ADMISSÃO","—")}
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">${icon("clock","w-5 h-5 text-wine")} Minhas atividades</h3>
            <p class="text-xs text-slate-400 mb-2">Chamados, pedidos ao RH e inscrições em eventos.</p>
            ${atividades.length ? `<div>${atividades.join("")}</div>` : `<div class="text-sm text-slate-400 py-4 text-center">Nada por aqui ainda.</div>`}
            ${App.can("interact") ? `<button data-action="open-chamado" data-tipo="geral" class="btn-outline w-full mt-3 py-2 text-sm">Abrir novo chamado</button>` : ""}
          </div>
        </div>
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6" data-perfil-tab="dados">
            <div class="flex items-center justify-between mb-5 flex-wrap gap-3"><h3 class="font-bold text-slate-800 dark:text-slate-100">Dados de Cadastro</h3>
            ${App.can("edit_profile") ? `<button data-action="open-pedido" class="btn-outline text-sm px-4 py-2 flex items-center gap-2">${icon("edit","w-4 h-4")} Solicitar Alteração</button>` : ""}</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${field("NOME COMPLETO",u.nome)}${field("E-MAIL CORPORATIVO",u.email)}
              ${field("CARGO",u.cargo || "—")}${field("SETOR",setorNome)}
              ${field("ANDAR / ALA","—")}${field("RAMAL INTERNO",u.setor?.ramal || "—")}
              ${field("DATA DE ADMISSÃO","—")}${field("DATA DE NASCIMENTO",nascimento)}
            </div>
          </div>
          <div class="card p-6" data-perfil-tab="seguranca">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Segurança de Acesso</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Troque a senha da sua conta. Você precisará informar a senha atual e, depois da troca, os outros acessos abertos serão encerrados.</p>
            <a href="#/trocar-senha" class="btn-wine px-6 py-2.5 inline-flex items-center gap-2">${icon("key","w-4 h-4")} Alterar senha</a>
          </div>
        </div>
      </div>`,
      init() {
        wireFilters("perfil", (f) => {
          document.querySelectorAll("[data-perfil-tab]").forEach((el) => el.classList.toggle("hidden", el.dataset.perfilTab !== f));
        });
        document.querySelector('[data-perfil-tab="seguranca"]').classList.add("hidden");
      },
    };
  }

  Object.assign(Pages, { perfil });
})();
