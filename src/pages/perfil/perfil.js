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
    // Todos os dados vêm de GET /auth/me (cadastro real). Alterações passam por solicitação ao RH.
    const nascimento = App.dataBr(u.data_nascimento);
    const admissao = App.dataBr(u.data_admissao);
    const setorNome = u.setor?.nome || "—";
    // Dados cadastrais são mantidos pelo RH: só leitura aqui, alteração via pedido.
    const field = (label, value) => `<div><label class="field-label">${label}</label><input class="field-input opacity-80" value="${esc(value)}" readonly></div>`;
    const statusTone = { "Aberto": "blue", "Em análise": "amber", "Concluído": "green" };
    const STATUS_CH = { ABERTO: "Aberto", EM_ANALISE: "Em análise", CONCLUIDO: "Concluído" };
    const TIPO_CH = { TI: "Chamado de TI", EVENTO_ADVERSO: "Evento adverso", GERAL: "Chamado" };
    const solicitacao = (s) => { const st = App.solicitacaoStatus[s.status] || { label: s.status, tone: "gray" };
      const info = App.solicitacaoCampoInfo(s.campo);
      const detalhe = `${esc(App.solicitacaoValor(s.campo, s.valor_atual))} → ${esc(App.solicitacaoValor(s.campo, s.valor_solicitado))}${s.observacao_admin ? ` · ${esc(s.observacao_admin)}` : ""}`;
      return itemTone(`Alteração: ${esc(info.label)}`, detalhe, st.label, st.tone); };
    const item = (titulo, sub, status) => `<div class="flex items-start justify-between gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div class="min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100">${titulo}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${sub}</div></div>
      ${badge(statusTone[status] || "gray", status)}</div>`;
    const itemTone = (titulo, sub, label, tone) => `<div class="flex items-start justify-between gap-3 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div class="min-w-0"><div class="font-semibold text-sm text-slate-800 dark:text-slate-100">${titulo}</div><div class="text-xs text-slate-500 dark:text-slate-400">${sub}</div></div>
      ${badge(tone, label)}</div>`;
    const inscricoes = App.minhasInscricoes().filter((e) => !e.cancelado && !e.encerrado);
    const atividades = [
      ...st.api.chamados.map((c) => item(`${esc(TIPO_CH[c.tipo])} ${esc(c.protocolo)}`, `${esc(c.categoria)} · ${esc(c.resposta_admin ? "Resposta: " + c.resposta_admin : c.descricao)}`, STATUS_CH[c.status])),
      ...st.api.solicitacoes.map(solicitacao),
      ...inscricoes.map((e) => `<a href="#/eventos/${e.id}" class="block">${item(`Inscrição: ${e.titulo}`, `${e.data} · ${e.horario} · ${e.local}`, "Confirmada")}</a>`),
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
            <div class="text-sm font-bold text-wine mb-4">Matrícula: ${esc(u.matricula || "—")}</div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-sm text-left">
              ${kv("SETOR",esc(setorNome))}${kv("UNIDADE",esc(u.unidade || "—"))}${kv("ADMISSÃO",esc(admissao))}
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">${icon("clock","w-5 h-5 text-wine")} Minhas atividades</h3>
            <p class="text-xs text-slate-400 mb-2">Chamados, pedidos de alteração cadastral e inscrições em eventos.</p>
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
              ${field("ANDAR / ALA",u.andar || "—")}${field("MATRÍCULA",u.matricula || "—")}${field("RAMAL INTERNO",u.ramal || u.setor?.ramal || "—")}
              ${field("UNIDADE",u.unidade || "—")}${field("DATA DE ADMISSÃO",admissao)}${field("DATA DE NASCIMENTO",nascimento)}
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
        // Traz o cadastro e os pedidos mais recentes (ex.: pedido aprovado desde a última carga).
        App.refreshPerfil().then((mudou) => { if (mudou && location.hash === "#/perfil") App.render(); }).catch(() => {});
      },
    };
  }

  Object.assign(Pages, { perfil });
})();
