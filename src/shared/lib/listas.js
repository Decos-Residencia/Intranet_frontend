/* =========================================================================
   Listas com filtro (chips) e paginação
   ========================================================================= */
(function () {
  /* ---------- utilidades de filtro (chips) ---------- */
  function wireFilters(group, onChange) {
    const wrap = document.querySelector(`[data-filter-group="${group}"]`);
    if (!wrap) return;
    wrap.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        wrap.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("chip-active"));
        btn.classList.add("chip-active");
        onChange(btn.dataset.filter);
      });
    });
  }

  /* ---------- lista com filtro + paginação reais ----------
     cfg: { containerId, itemSel, size, pagerId, infoId, label, crimson,
            filterGroup, filterFn(el, filterValue)->bool, initialFilter, onEmpty } */
  function wireList(cfg) {
    const cont = document.getElementById(cfg.containerId);
    if (!cont) return;
    const items = [...cont.querySelectorAll(cfg.itemSel)];
    let page = 1, filter = cfg.initialFilter || "all";

    const matching = () => items.filter((el) => !cfg.filterFn || cfg.filterFn(el, filter));

    function render() {
      const vis = matching();
      const total = vis.length;
      const pages = Math.max(1, Math.ceil(total / cfg.size));
      if (page > pages) page = pages;
      items.forEach((el) => { el.style.display = "none"; });
      vis.forEach((el, i) => { if (i >= (page - 1) * cfg.size && i < page * cfg.size) el.style.display = ""; });

      // estado vazio
      let empty = document.getElementById((cfg.containerId) + "-empty");
      if (total === 0) {
        if (!empty) { empty = document.createElement("div"); empty.id = cfg.containerId + "-empty"; empty.className = "empty-state"; cont.after(empty); }
        empty.innerHTML = `<div class="text-4xl mb-2">🗂️</div><div class="font-bold text-slate-600 dark:text-slate-300">Nada por aqui</div><div class="text-sm text-slate-400">${cfg.onEmpty || "Nenhum item para este filtro."}</div>`;
        empty.style.display = "";
      } else if (empty) { empty.style.display = "none"; }

      const info = cfg.infoId && document.getElementById(cfg.infoId);
      if (info) { const a = total ? (page - 1) * cfg.size + 1 : 0, b = Math.min(page * cfg.size, total); info.textContent = `Exibindo ${a}–${b} de ${total} ${cfg.label}`; }

      const pager = cfg.pagerId && document.getElementById(cfg.pagerId);
      if (pager) {
        let h = `<button class="pg" data-pg="prev">Anterior</button>`;
        for (let p = 1; p <= pages; p++) h += `<button class="pg ${p === page ? (cfg.crimson ? "pg-crimson" : "pg-active") : ""}" data-pg="${p}">${p}</button>`;
        h += `<button class="pg" data-pg="next">Próximo</button>`;
        pager.innerHTML = h;
        pager.querySelectorAll("[data-pg]").forEach((b) => b.addEventListener("click", () => {
          const v = b.dataset.pg;
          if (v === "prev") page = Math.max(1, page - 1);
          else if (v === "next") page = Math.min(pages, page + 1);
          else page = +v;
          render();
        }));
      }
    }

    if (cfg.filterGroup) {
      const wrap = document.querySelector(`[data-filter-group="${cfg.filterGroup}"]`);
      wrap && wrap.querySelectorAll("[data-filter]").forEach((btn) => btn.addEventListener("click", () => {
        wrap.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("chip-active"));
        btn.classList.add("chip-active"); filter = btn.dataset.filter; page = 1; render();
      }));
    }
    (cfg.controls || []).forEach((sel) => {
      const c = document.querySelector(sel);
      if (!c) return;
      c.addEventListener("input", () => { page = 1; render(); });
      c.addEventListener("change", () => { page = 1; render(); });
    });
    render();
    return { refilter: (f) => { filter = f; page = 1; render(); } };
  }

  Object.assign(Lib, { wireFilters, wireList });
})();
