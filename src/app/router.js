/* =========================================================================
   Roteador (hash) e casca da página (sidebar + topbar + conteúdo)
   ========================================================================= */
(function () {
  const { state } = App;

  function go(hash) { if (location.hash === hash) App.render(); else location.hash = hash; }

  function render() {
    App.applyTheme();
    const app = document.getElementById("app");

    // Enquanto a sessão não foi validada em GET /auth/me, nada é decidido pelo hash.
    if (!state.ready || state.loadError) { app.innerHTML = state.loadError ? connectionError(state.loadError) : loadingScreen(); return; }

    let hash = location.hash || "#/login";

    const publicRoute = hash === "#/login" || hash.startsWith("#/redefinir-senha");
    if (!state.auth && !publicRoute) { location.hash = "#/login"; return; }
    if (state.auth && hash === "#/login") { location.hash = state.user?.must_change_password ? "#/trocar-senha" : "#/dashboard"; return; }
    // Senha temporária: nenhuma outra tela abre até a troca (também após recarregar a página).
    if (state.auth && state.user?.must_change_password && hash !== "#/trocar-senha") { location.hash = "#/trocar-senha"; return; }

    const match = App.routes.find((r) => r.re.test(hash));
    if (!match) { app.innerHTML = App.shell(App.notFound(), "Página não encontrada"); App.afterRender(); return; }

    // guarda de permissão por papel
    if (match.need && !App.can(match.need)) {
      App.toast("Acesso restrito ao seu perfil (" + App.roleInfo().label + ")");
      location.hash = "#/dashboard"; return;
    }

    const page = match.page(hash.match(match.re));
    if (page.shell === false) {
      app.innerHTML = page.html;
    } else {
      app.innerHTML = App.shell(page.html, page.titleCrimson ? `<span class="text-crimson">${page.title}</span>` : page.title, hash);
    }
    page.init && page.init();
    App.afterRender();
    App.touchNotificacoes?.();
  }

  function shell(inner, title, hash) {
    return `<div class="layout">
      <div class="drawer-backdrop" data-action="close-menu"></div>
      ${UI.sidebar(state, hash || location.hash)}
      <div class="main">
        ${UI.topbar(state, title)}
        <div class="content page-fade">${inner}</div>
      </div>
      ${UI.quickFab(App.can("interact"))}
    </div>`;
  }
  function afterRender() {
    window.scrollTo(0, 0);
    document.querySelector(".content")?.scrollTo(0, 0);
    App.placeFab();
    App.wireSearchPreview?.();
  }

  function loadingScreen() {
    return `<div class="min-h-screen flex flex-col items-center justify-center text-slate-500 dark:text-slate-300 text-center p-8" role="status">
      <img src="assets/img/logo.png" alt="Hospital Decós" class="w-[260px] max-w-[72vw] mb-8 select-none" draggable="false">
      <div class="flex items-center gap-2 font-semibold">
        <span class="inline-block w-2 h-2 rounded-full bg-wine animate-pulse"></span>
        Carregando…
      </div>
      <p id="loading-hint" class="hidden text-sm text-slate-400 mt-2 max-w-sm">Conectando ao servidor… na primeira vez do dia isso pode levar até 1 minuto.</p></div>`;
  }

  function connectionError(message) {
    return `<div class="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <div class="text-5xl mb-3">📡</div>
      <h1 class="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Não foi possível conectar à API</h1>
      <p class="text-slate-500 dark:text-slate-400 mb-6 max-w-md">${UI.esc(message)}</p>
      <button data-action="retry-session" class="btn-wine px-6 py-2.5">Tentar novamente</button></div>`;
  }

  // Página de "não encontrado" para um recurso (aviso, documento...) que não existe na API.
  function missingPage(title, message, href, label) {
    return {
      title,
      html: `<div class="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
        <div class="text-5xl mb-3">🗂️</div>
        <h2 class="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">${UI.esc(title)}</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-6">${UI.esc(message)}</p>
        <a href="${href}" class="btn-wine px-6 py-2.5">${UI.esc(label)}</a></div>`,
    };
  }

  function notFound() {
    return `<div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div class="text-6xl font-extrabold text-wine mb-2">404</div>
      <p class="text-slate-500 mb-6">Tela não encontrada.</p>
      <a href="#/dashboard" class="btn-wine px-6 py-2.5">Voltar ao início</a></div>`;
  }

  Object.assign(App, { go, render, shell, afterRender, notFound, missingPage });
})();
