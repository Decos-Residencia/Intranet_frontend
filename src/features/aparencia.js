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

  Object.assign(App, { applyTheme, applyThemeLive, openThemePanel });
})();
