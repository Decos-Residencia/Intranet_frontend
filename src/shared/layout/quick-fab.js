/* =========================================================================
   Bola flutuante de Acessos Rápidos
   HTML + comportamento: arrastável, posição salva em state.fabPos.
   ========================================================================= */
(function () {
  const { state } = App;
  const { icon, qaLink } = UI;

  // Botão flutuante (FAB) de Acessos Rápidos — presente em todas as telas
  // internas; abre um menu com os mesmos atalhos da tela de Início.
  function quickFab(canInteract) {
    const item = (it) => qaLink(it, "fab-item",
      `<span class="qa-icon">${icon(it.icon, "w-4 h-4")}</span><span>${it.titulo}</span>`, canInteract, 'data-action="close-fab"');
    return `<div class="quick-fab" id="quick-fab">
      <div class="fab-menu" role="menu" aria-label="Acessos rápidos">
        <div class="fab-menu-head">${icon("zap", "w-4 h-4 text-wine")} Acessos Rápidos</div>
        <div class="fab-menu-list">${DB.acessosRapidos.map(item).join("")}</div>
      </div>
      <span class="fab-label">Acesso Rápido</span>
      <button data-action="toggle-fab" class="fab-btn" title="Acessos rápidos" aria-label="Acessos rápidos" aria-expanded="false">
        <span class="fab-ico fab-ico-open"><img src="assets/img/simbolo.png" alt="" class="fab-logo" draggable="false"></span>
        <span class="fab-ico fab-ico-close">${icon("x", "w-6 h-6")}</span>
      </button>
    </div>`;
  }

  /* ---------- bola flutuante: arrastável, posição salva em state.fabPos ---------- */
  const FAB_SIZE = 56, FAB_MARGIN = 12;
  let fabDragged = false;
  function clampFab(x, y) {
    return {
      x: Math.min(Math.max(x, FAB_MARGIN), window.innerWidth - FAB_SIZE - FAB_MARGIN),
      y: Math.min(Math.max(y, FAB_MARGIN), window.innerHeight - FAB_SIZE - FAB_MARGIN),
    };
  }
  // Aplica a posição salva (ou o canto inferior direito padrão) e vira o menu
  // para o lado com mais espaço livre.
  function placeFab() {
    const f = document.getElementById("quick-fab");
    if (!f) return;
    const pos = state.fabPos ? clampFab(state.fabPos.x, state.fabPos.y) : null;
    f.style.left = pos ? pos.x + "px" : "";
    f.style.top = pos ? pos.y + "px" : "";
    const r = f.getBoundingClientRect();
    f.classList.toggle("fab-below", r.top + r.height / 2 < window.innerHeight / 2);
    f.classList.toggle("fab-on-left", r.left + r.width / 2 < window.innerWidth / 2);
  }
  function wireFabDrag() {
    let start = null;
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".fab-btn");
      if (!btn || e.button !== 0) return;
      e.preventDefault(); // evita o arrasto nativo do navegador, que dispararia pointercancel
      const r = btn.closest("#quick-fab").getBoundingClientRect();
      start = { px: e.clientX, py: e.clientY, x: r.left, y: r.top, moved: false };
      btn.setPointerCapture(e.pointerId);
    });
    document.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (!start.moved && Math.hypot(dx, dy) < 6) return;
      if (!start.moved) { start.moved = true; App.toggleFab(false); document.getElementById("quick-fab")?.classList.add("fab-dragging"); }
      state.fabPos = clampFab(start.x + dx, start.y + dy);
      App.placeFab();
    });
    const end = () => {
      if (!start) return;
      if (start.moved) { fabDragged = true; App.save(); setTimeout(() => { fabDragged = false; }, 0); }
      document.getElementById("quick-fab")?.classList.remove("fab-dragging");
      start = null;
    };
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
    window.addEventListener("resize", App.placeFab);
  }

  function toggleFab(force) {
    const f = document.getElementById("quick-fab");
    if (!f) return;
    const open = f.classList.toggle("fab-open", force);
    f.querySelector(".fab-btn")?.setAttribute("aria-expanded", String(open));
  }

  // clique na bola: ignora o clique que encerra um arrasto
  function onFabClick() { if (fabDragged) { fabDragged = false; return; } App.toggleFab(); }

  UI.quickFab = quickFab;
  Object.assign(App, { placeFab, wireFabDrag, toggleFab, onFabClick });
})();
