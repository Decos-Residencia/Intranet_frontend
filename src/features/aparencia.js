/* =========================================================================
   Aparência — temas Claro / Escuro / Vinho / Automático
   Aplica o tema no <html> e abre o seletor (todas as opções com prévia).
   A escolha vale na hora e fica salva na conta (PUT /auth/me/preferencias).
   ========================================================================= */
(function () {
  const { state, THEMES } = App;
  const escuroDoSistema = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;

  // "auto" segue o sistema operacional; os demais são fixos.
  function temaEfetivo() {
    if (state.theme === "auto") return escuroDoSistema?.matches ? "dark" : "light";
    return state.theme;
  }

  function applyTheme() {
    const r = document.documentElement, t = temaEfetivo();
    // "red" (Vinho) é uma variação CLARA — não herda a classe dark do Tailwind.
    r.classList.toggle("dark", t === "dark");
    r.classList.toggle("theme-red", t === "red");
  }
  escuroDoSistema?.addEventListener?.("change", () => { if (state.theme === "auto") applyThemeLive(); });

  // Troca de tema SEM re-render: só as classes do <html> (crossfade via CSS) e o ícone do botão.
  function applyThemeLive() {
    App.applyTheme();
    document.querySelectorAll('[data-action="open-theme"]').forEach((btn) => {
      btn.classList.add("theme-pop");
      btn.innerHTML = UI.icon(THEMES[state.theme]?.icon || "sun", "w-5 h-5");
      btn.setAttribute("aria-label", `Aparência: ${THEMES[state.theme]?.label || "Claro"}. Trocar tema`);
      btn.title = `Aparência: ${THEMES[state.theme]?.label || "Claro"}`;
      setTimeout(() => btn.classList.remove("theme-pop"), 260);
    });
    document.querySelectorAll("[data-theme-opt]").forEach((opt) => {
      const on = opt.dataset.themeOpt === state.theme;
      opt.setAttribute("aria-checked", String(on));
      opt.classList.toggle("theme-opt-on", on);
    });
  }

  function escolherTema(tema) {
    if (!THEMES[tema] || tema === state.theme) return;
    state.theme = tema;
    App.save();
    applyThemeLive();
    if (state.auth) App.salvarPreferencias?.({ tema }).catch(() => {});
  }

  // Prévia de cada tema: fundo, cartão e cor de destaque (Automático mostra metade clara/metade escura).
  const PREVIA = {
    light: ["#eceef3", "#ffffff", "#8E1B2E"],
    dark: ["#0c0a0d", "#19151b", "#f4a3b2"],
    red: ["#5c1220", "#ffffff", "#C8102E"],
  };
  const DESC = {
    auto: "Segue o modo claro ou escuro do seu computador ou celular.",
    light: "Fundo claro e neutro, ideal durante o dia.",
    dark: "Fundo escuro que cansa menos a vista à noite e em plantões.",
    red: "Claro, com a cor da marca Decós em destaque.",
  };
  function previa(k) {
    if (k === "auto") {
      return `<span class="theme-preview theme-preview-auto" aria-hidden="true"><span style="background:${PREVIA.light[0]}"></span><span style="background:${PREVIA.dark[0]}"></span></span>`;
    }
    const [bg, card, accent] = PREVIA[k];
    return `<span class="theme-preview" style="background:${bg}" aria-hidden="true"><span class="theme-preview-card" style="background:${card}"><span style="background:${accent}"></span></span></span>`;
  }

  function seletorTemas() {
    return `<div role="radiogroup" aria-label="Tema da interface" class="theme-grid">${Object.keys(THEMES).map((k) => {
      const on = k === state.theme;
      return `<button type="button" role="radio" aria-checked="${on}" data-theme-opt="${k}" class="theme-opt ${on ? "theme-opt-on" : ""}">
        ${previa(k)}
        <span class="theme-opt-txt"><span class="font-bold text-slate-800 dark:text-slate-100">${THEMES[k].label}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">${DESC[k]}</span></span>
        <span class="theme-opt-check">${UI.icon("check", "w-4 h-4")}</span></button>`;
    }).join("")}</div>`;
  }

  // Liga o seletor (clique e setas do teclado, padrão de radiogroup) dentro de `raiz`.
  function wireSeletorTemas(raiz) {
    const opts = [...raiz.querySelectorAll("[data-theme-opt]")];
    opts.forEach((opt, i) => {
      opt.tabIndex = opt.dataset.themeOpt === state.theme ? 0 : -1;
      opt.addEventListener("click", () => escolherTema(opt.dataset.themeOpt));
      opt.addEventListener("keydown", (e) => {
        const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!passo) return;
        e.preventDefault();
        const alvo = opts[(i + passo + opts.length) % opts.length];
        opts.forEach((o) => { o.tabIndex = o === alvo ? 0 : -1; });
        alvo.focus();
        escolherTema(alvo.dataset.themeOpt);
      });
    });
    if (!opts.some((o) => o.tabIndex === 0) && opts[0]) opts[0].tabIndex = 0;
  }

  // Menu compacto junto ao botão (sem painel lateral): a troca acontece no clique.
  function fecharMenuTema(devolverFoco = true) {
    const m = document.getElementById("theme-menu");
    if (!m) return;
    const btn = document.querySelector(`[data-action="open-theme"][aria-expanded="true"]`);
    m.remove();
    document.removeEventListener("pointerdown", foraDoMenu, true);
    if (btn) { btn.setAttribute("aria-expanded", "false"); if (devolverFoco) btn.focus(); }
  }
  function foraDoMenu(e) {
    if (!e.target.closest("#theme-menu, [data-action='open-theme']")) fecharMenuTema(false);
  }
  function openThemeMenu(btn) {
    if (document.getElementById("theme-menu")) { fecharMenuTema(); return; }
    const r = btn.getBoundingClientRect();
    const m = document.createElement("div");
    m.id = "theme-menu";
    m.className = "theme-menu";
    m.setAttribute("role", "menu");
    m.setAttribute("aria-label", "Tema da interface");
    m.innerHTML = Object.keys(THEMES).map((k) => `<button type="button" role="menuitemradio" aria-checked="${k === state.theme}" data-tema="${k}" class="theme-menu-item">
        ${UI.icon(THEMES[k].icon, "w-4 h-4")}<span>${THEMES[k].label}</span>${k === state.theme ? UI.icon("check", "w-4 h-4 ml-auto") : ""}</button>`).join("")
      + (state.auth ? `<a href="#/configuracoes" class="theme-menu-mais" role="menuitem">${UI.icon("settings", "w-4 h-4")} Acessibilidade e mais opções</a>` : "");
    document.body.appendChild(m);
    const largura = m.offsetWidth;
    m.style.top = `${r.bottom + 8}px`;
    m.style.left = `${Math.max(8, Math.min(window.innerWidth - largura - 8, r.right - largura))}px`;
    btn.setAttribute("aria-expanded", "true");
    const itens = [...m.querySelectorAll("[role^='menuitem']")];
    (m.querySelector("[aria-checked='true']") || itens[0]).focus();
    m.addEventListener("click", (e) => {
      const it = e.target.closest("[data-tema]");
      if (it) { escolherTema(it.dataset.tema); fecharMenuTema(); }
      else if (e.target.closest(".theme-menu-mais")) fecharMenuTema(false);
    });
    m.addEventListener("keydown", (e) => {
      const i = itens.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); fecharMenuTema(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); itens[(i + 1) % itens.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
      else if (e.key === "Tab") fecharMenuTema(false);
    });
    setTimeout(() => document.addEventListener("pointerdown", foraDoMenu, true), 0);
  }
  window.addEventListener("hashchange", () => fecharMenuTema(false));

  Object.assign(App, { applyTheme, applyThemeLive, openThemeMenu, fecharMenuTema, escolherTema, seletorTemas, wireSeletorTemas, temaEfetivo });
})();
