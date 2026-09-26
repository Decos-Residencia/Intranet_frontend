/* =========================================================================
   Boot da aplicação
   ========================================================================= */
(function () {
  const { state } = App;

  function boot() {
    App.wireGlobal();
    App.wireFabDrag();
    window.addEventListener("hashchange", App.render);
    if (!location.hash) location.hash = state.auth ? "#/dashboard" : "#/login";
    App.render();
  }

  Object.assign(App, { boot });
})();

document.addEventListener("DOMContentLoaded", () => App.boot());
