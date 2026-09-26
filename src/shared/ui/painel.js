/* =========================================================================
   Painel lateral (slide-over)
   ========================================================================= */
(function () {
  function openPanel(title, html) {
    let p = document.getElementById("side-panel");
    if (!p) {
      p = document.createElement("div"); p.id = "side-panel";
      p.innerHTML = `<div class="panel-backdrop" data-action="close-panel"></div><div class="panel-body"></div>`;
      document.body.appendChild(p);
    }
    p.querySelector(".panel-body").innerHTML = `
      <div class="panel-head"><h3 class="font-extrabold text-slate-800 dark:text-slate-100">${title}</h3>
        <button data-action="close-panel" class="icon-btn w-9 h-9">${UI.icon("x","w-5 h-5")}</button></div>
      <div class="panel-content">${html}</div>`;
    requestAnimationFrame(() => p.classList.add("open"));
  }
  function closePanel() { document.getElementById("side-panel")?.classList.remove("open"); }

  Object.assign(App, { openPanel, closePanel });
})();
