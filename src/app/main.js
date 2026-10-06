/* =========================================================================
   Boot da aplicação
   A sessão só é considerada válida depois de GET /auth/me (restoreSession).
   ========================================================================= */
(function () {
  function boot() {
    App.wireGlobal();
    App.wireFabDrag();
    window.addEventListener("hashchange", App.render);
    App.render();          // tela de "carregando" até a sessão ser validada
    setTimeout(() => { if (!App.state.ready) document.getElementById("loading-hint")?.classList.remove("hidden"); }, 4000);
    App.restoreSession();
  }

  Object.assign(App, { boot });
})();

document.addEventListener("DOMContentLoaded", () => App.boot());
