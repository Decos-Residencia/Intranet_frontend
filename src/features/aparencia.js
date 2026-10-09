/* =========================================================================
   Aparência — temas Claro / Escuro / Vinho
   Aplica o tema no <html> e o painel de escolha.
   ========================================================================= */
(function () {
  const { state, THEMES } = App;

  function applyTheme() {
    const r = document.documentElement;
    // "red" (Vinho) é uma variação CLARA — não herda mais a classe dark do
    // Tailwind, já que agora é ~50/50 branco/vinho, não um reskin do escuro.
    r.classList.toggle("dark", state.theme === "dark");
    r.classList.toggle("theme-red", state.theme === "red");
  }

  // Troca de tema SEM re-render — troca só as classes no <html> (dispara a
  // transição suave de cor via CSS) e atualiza o ícone/tooltip do(s) botão(ões)
  // de aparência já presentes na tela, sem destruir e recriar o DOM inteiro
  // (o que cortaria qualquer animação pela raiz).
  const THEME_ICON = { light: "sun", dark: "moon", red: "wine" };
  const THEME_LABEL = { light: "Claro", dark: "Escuro", red: "Vinho" };
  function applyThemeLive() {
    App.applyTheme();
    document.querySelectorAll('[data-action="cycle-theme"]').forEach((btn) => {
      btn.classList.add("theme-pop");
      btn.innerHTML = UI.icon(THEME_ICON[state.theme] || "sun", "w-5 h-5");
      btn.title = `Aparência: ${THEME_LABEL[state.theme]} — clique para trocar`;
      setTimeout(() => btn.classList.remove("theme-pop"), 260);
    });
  }

  const THEME_SWATCH = {
    light: ["#f1f2f4", "#ffffff", "#8E1B2E"],
    dark: ["#0a0e17", "#121826", "#8E1B2E"],
    red: ["#2b0a12", "#3a0f1a", "#F5334D"],
  };
  function openThemePanel() {
    const items = Object.keys(THEMES).map((k) => {
      const t = THEMES[k], on = k === state.theme, [bg, card, accent] = THEME_SWATCH[k];
      return `<button data-action="set-theme" data-theme="${k}" class="role-opt ${on ? "role-opt-on" : ""}">
        <span class="theme-swatch" style="background:${bg}"><span style="background:${card}"></span><span style="background:${accent}"></span></span>
        <span class="text-left flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${t.label}</span></span>
        ${on ? UI.icon("check", "w-5 h-5 text-wine") : ""}</button>`;
    }).join("");
    App.openPanel("Aparência", `<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Claro e Escuro são os modos padrão. Vinho leva a cor da marca à interface inteira — pense nele como o modo de identidade visual mais forte.</p><div class="space-y-2">${items}</div>`);
  }

  // Os 4 níveis de acesso. O papel real é definido pelo ADMIN no cadastro do usuário. O próprio ADMIN
  // pode SIMULAR a visão dos outros papéis (só interface: o backend segue autorizando como ADMIN).
  function openRolePanel() {
    const atual = App.role(), podeTrocar = App.realRole() === "admin";
    const items = App.ROLE_ORDER.map((k) => {
      const r = DB.roles[k], on = k === atual;
      const inner = `<span class="role-ic">${UI.icon(r.icon, "w-5 h-5")}</span>
        <span class="text-left flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${UI.esc(r.label)}</span>
          <span class="block text-sm text-slate-500 dark:text-slate-400">${UI.esc(r.desc)}</span></span>
        ${on ? UI.icon("check", "w-5 h-5 text-wine") : ""}`;
      return podeTrocar
        ? `<button type="button" data-action="set-role" data-role="${k}" class="role-opt ${on ? "role-opt-on" : ""}">${inner}</button>`
        : `<div class="role-opt ${on ? "role-opt-on" : ""}">${inner}</div>`;
    }).join("");
    const intro = podeTrocar
      ? "Simule os 4 níveis de acesso do sistema. Cada papel muda o menu e as telas. É só uma pré-visualização: suas permissões reais continuam as de Administrador."
      : "O sistema tem 4 níveis de acesso. Cada papel muda o menu, as permissões e a auditoria. O seu papel é definido pelo administrador.";
    const cenarios = [
      { k: "normal", icon: "user", titulo: "Normal", desc: "Tela de início padrão" },
      { k: "aniversariante", icon: "gift", titulo: "Aniversariante", desc: "Tela de início comemorativa" },
    ];
    const cenarioAtual = App.state.previewAniversario ? "aniversariante" : "normal";
    const cenarioHtml = podeTrocar ? `
      <div class="text-[11px] font-extrabold tracking-wide text-slate-400 mt-6 mb-2">CENÁRIO DO DIA</div>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Simule se hoje é o seu aniversário para ver a tela de início comemorativa.</p>
      <div class="space-y-2">${cenarios.map((c) => {
        const on = c.k === cenarioAtual;
        return `<button type="button" data-action="set-cenario" data-cenario="${c.k}" class="role-opt ${on ? "role-opt-on" : ""}">
          <span class="role-ic">${UI.icon(c.icon, "w-5 h-5")}</span>
          <span class="text-left flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100">${c.titulo}</span>
            <span class="block text-sm text-slate-500 dark:text-slate-400">${c.desc}</span></span>
          ${on ? UI.icon("check", "w-5 h-5 text-wine") : ""}</button>`;
      }).join("")}</div>` : "";
    App.openPanel("Trocar papel de acesso", `<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${intro}</p><div class="space-y-2">${items}</div>${cenarioHtml}`);
  }

  Object.assign(App, { applyTheme, applyThemeLive, openThemePanel, openRolePanel });
})();
