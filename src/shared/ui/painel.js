/* =========================================================================
   Painel lateral (slide-over)
   É um diálogo: recebe o foco ao abrir, fecha com Esc e devolve o foco a quem o abriu.
   ========================================================================= */
(function () {
  let openFrame = 0; // frame pendente que adiciona .open (cancelado se o painel for fechado antes)
  let voltarFoco = null;
  function openPanel(title, html) {
    let p = document.getElementById("side-panel");
    if (!p) {
      p = document.createElement("div"); p.id = "side-panel";
      p.innerHTML = `<div class="panel-backdrop" data-action="close-panel"></div><div class="panel-body" role="dialog" aria-modal="true" aria-labelledby="side-panel-title" tabindex="-1"></div>`;
      document.body.appendChild(p);
      p.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closePanel(); } });
    }
    if (!p.classList.contains("open")) voltarFoco = document.activeElement;
    p.querySelector(".panel-body").innerHTML = `
      <div class="panel-head"><h3 id="side-panel-title" class="font-extrabold text-slate-800 dark:text-slate-100">${title}</h3>
        <button type="button" data-action="close-panel" class="icon-btn w-9 h-9" aria-label="Fechar painel">${UI.icon("x","w-5 h-5")}</button></div>
      <div class="panel-content">${html}</div>`;
    cancelAnimationFrame(openFrame);
    openFrame = requestAnimationFrame(() => {
      p.classList.add("open");
      const alvo = p.querySelector(".panel-content :is(input, select, textarea, button, a[href])") || p.querySelector(".panel-body");
      alvo?.focus({ preventScroll: true });
    });
  }
  function closePanel() {
    cancelAnimationFrame(openFrame);
    const p = document.getElementById("side-panel");
    if (!p?.classList.contains("open")) return;
    p.classList.remove("open");
    if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus({ preventScroll: true });
    voltarFoco = null;
  }

  Object.assign(App, { openPanel, closePanel });
})();
