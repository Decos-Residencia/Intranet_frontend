/* =========================================================================
   Trocar papel de acesso + cenário do dia
   ========================================================================= */
(function () {
  const { state, ROLE_ORDER } = App;

  function openRolePanel() {
    const items = ROLE_ORDER.map((k) => {
      const r = DB.roles[k], on = k === state.role;
      return `<button data-action="set-role" data-role="${k}" class="role-opt ${on ? "role-opt-on" : ""}">
        <span class="role-ic">${UI.icon(r.icon, "w-5 h-5")}</span>
        <span class="text-left flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${r.label}</span>
        <span class="block text-xs text-slate-500 dark:text-slate-400">${r.desc}</span></span>
        ${on ? UI.icon("check", "w-5 h-5 text-wine") : ""}</button>`;
    }).join("");

    const cenarios = [
      { val: false, icon: "user", label: "Normal", desc: "Tela de início padrão" },
      { val: true, icon: "gift", label: "Aniversariante", desc: "Tela de início comemorativa" },
    ];
    const cenarioItems = cenarios.map((c) => {
      const on = state.aniversarianteHoje === c.val;
      return `<button data-action="set-aniversario" data-val="${c.val}" class="role-opt ${on ? "role-opt-on" : ""}">
        <span class="role-ic">${UI.icon(c.icon, "w-5 h-5")}</span>
        <span class="text-left flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${c.label}</span>
        <span class="block text-xs text-slate-500 dark:text-slate-400">${c.desc}</span></span>
        ${on ? UI.icon("check", "w-5 h-5 text-wine") : ""}</button>`;
    }).join("");

    App.openPanel("Trocar papel de acesso", `
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Simule os 4 níveis de acesso do sistema. Cada papel muda o menu, as permissões e a auditoria.</p>
      <div class="space-y-2">${items}</div>
      <div class="text-xs font-bold tracking-widest text-slate-400 mt-6 mb-3">CENÁRIO DO DIA</div>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Simule se hoje é o seu aniversário para ver a tela de início comemorativa.</p>
      <div class="space-y-2">${cenarioItems}</div>`);
  }

  Object.assign(App, { openRolePanel });
})();
