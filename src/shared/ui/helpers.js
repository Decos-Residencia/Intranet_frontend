/* =========================================================================
   Helpers de interface
   Texto seguro, iniciais/foto, badges, breadcrumb e categorias.
   ========================================================================= */
(function () {
  const { icon } = UI;

  /* ---------- helpers ---------- */
  function iniciais(nome) {
    const p = nome.trim().split(/\s+/);
    return ((p[0]?.[0] || "") + (p[p.length - 1]?.[0] || "")).toUpperCase();
  }

  function foto(nome) {
    return "";
  }

  // Escapa texto digitado pelo usuário antes de ir para o innerHTML.
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Saudação dinâmica de acordo com a hora do dia
  function saudacao(d = new Date()) {
    const hora = d.getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
  }

  // cor e rótulo da categoria de um aviso
  const tone = (cat) => (DB.categorias[cat] ? DB.categorias[cat].tone : "blue");
  const catLabel = (cat) => (DB.categorias[cat] ? DB.categorias[cat].label : cat);

  // chips de filtro por categoria (Início e Mural de Avisos)
  const CAT_FILTRO = { "Todos": "all", "Comunicado": "comunicado", "Promoção": "promocao", "Evento": "evento", "Urgente": "urgente" };

  function badge(tone, label, extraCls = "") {
    return `<span class="badge badge-${tone} ${extraCls}">${label}</span>`;
  }

  /* ---------- Breadcrumb ---------- */
  function breadcrumb(parts) {
    return `<nav class="flex items-center gap-2 text-sm mb-6 flex-wrap">
      ${parts.map((p, i) => {
        const last = i === parts.length - 1;
        const el = p.route ? `<a href="${p.route}" class="text-slate-500 dark:text-slate-400 hover:text-wine">${p.label}</a>`
          : `<span class="${last ? "text-wine font-semibold" : "text-slate-500 dark:text-slate-400"}">${p.label}</span>`;
        return el + (last ? "" : `<span class="text-slate-300 dark:text-slate-600">${icon("chevron-right", "w-3.5 h-3.5")}</span>`);
      }).join("")}
    </nav>`;
  }

  Object.assign(UI, { iniciais, foto, esc, saudacao, tone, catLabel, CAT_FILTRO, badge, breadcrumb });
})();
