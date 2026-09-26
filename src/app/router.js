/* =========================================================================
   Roteador (hash) e casca da página (sidebar + topbar + conteúdo)
   ========================================================================= */
(function () {
  const { state } = App;

  function go(hash) { if (location.hash === hash) App.render(); else location.hash = hash; }

  function render() {
    App.applyTheme();
    let hash = location.hash || "#/login";

    if (!state.auth && hash !== "#/login") { location.hash = "#/login"; return; }
    if (state.auth && hash === "#/login") { location.hash = "#/dashboard"; return; }

    const match = App.routes.find((r) => r.re.test(hash));
    const app = document.getElementById("app");
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
  function afterRender() { window.scrollTo(0, 0); document.querySelector(".content")?.scrollTo(0, 0); App.placeFab(); }

  function notFound() {
    return `<div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div class="text-6xl font-extrabold text-wine mb-2">404</div>
      <p class="text-slate-500 mb-6">Tela não encontrada.</p>
      <a href="#/dashboard" class="btn-wine px-6 py-2.5">Voltar ao início</a></div>`;
  }

  Object.assign(App, { go, render, shell, afterRender, notFound });
})();
