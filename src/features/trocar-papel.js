/* =========================================================================
   Cenário do dia (simulação local)
   O papel de acesso NÃO é trocável: vem de GET /auth/me (user.perfil).
   Este painel mantém apenas o cenário "hoje é meu aniversário", que é uma
   funcionalidade local sem backend.
   ========================================================================= */
(function () {
  const { state } = App;

  function openScenarioPanel() {
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

    App.openPanel("Cenário do dia", `
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Simule se hoje é o seu aniversário para ver a tela de início comemorativa. É apenas uma simulação visual neste navegador.</p>
      <div class="space-y-2">${cenarioItems}</div>`);
  }

  Object.assign(App, { openScenarioPanel });
})();
