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
    const pwd = (id, label, ph) => `<div><label class="field-label">${label}</label><input id="${id}" type="password" class="field-input" placeholder="${ph}" autocomplete="new-password"></div>`;
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
          <form class="card p-6" data-perfil-tab="seguranca" id="form-senha" novalidate>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Segurança de Acesso</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-4">Alterar senha da intranet</p>
            <div class="space-y-4">
              ${pwd("pw-atual","SENHA ATUAL","Digite sua senha atual")}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${pwd("pw-nova","NOVA SENHA","Mínimo de 8 caracteres")}${pwd("pw-conf","CONFIRMAR NOVA SENHA","Repita a nova senha")}</div>
              <ul class="text-xs space-y-1" id="pw-regras">
                <li data-regra="len">• Pelo menos 8 caracteres</li>
                <li data-regra="num">• Pelo menos um número</li>
                <li data-regra="mai">• Pelo menos uma letra maiúscula</li>
                <li data-regra="eq">• Confirmação igual à nova senha</li>
              </ul>
            </div>
            <div class="flex gap-3 mt-5"><button type="submit" class="btn-wine px-6 py-2.5">Atualizar Senha</button><button type="reset" class="btn-outline px-6 py-2.5">Cancelar</button></div>
          </form>
        </div>
      </div>`,
      init() {
        wireFilters("perfil", (f) => {
          document.querySelectorAll("[data-perfil-tab]").forEach((el) => el.classList.toggle("hidden", el.dataset.perfilTab !== f));
        });
        document.querySelector('[data-perfil-tab="seguranca"]').classList.add("hidden");
        const f = document.getElementById("form-senha");
        const val = (id) => document.getElementById(id).value;
        const regras = () => ({ len: val("pw-nova").length >= 8, num: /\d/.test(val("pw-nova")), mai: /[A-Z]/.test(val("pw-nova")),
          eq: !!val("pw-nova") && val("pw-nova") === val("pw-conf") });
        const pintar = () => { const r = regras();
          f.querySelectorAll("[data-regra]").forEach((li) => { li.className = r[li.dataset.regra] ? "text-green-600 dark:text-green-400" : "text-slate-400"; }); };
        f.addEventListener("input", pintar);
        f.addEventListener("reset", () => setTimeout(pintar));
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!val("pw-atual")) { App.toast("Informe a senha atual"); return; }
          if (!Object.values(regras()).every(Boolean)) { App.toast("A nova senha não atende aos requisitos"); return; }
          if (val("pw-nova") === val("pw-atual")) { App.toast("A nova senha deve ser diferente da atual"); return; }
          // Não há endpoint para o próprio usuário trocar a senha (BACKEND FUTURO): não simular sucesso.
          f.reset(); App.toast("A alteração de senha pelo próprio usuário ainda não está disponível. Procure o administrador.");
        });
        pintar();
      },
    };
  }

  Object.assign(Pages, { perfil });
})();
