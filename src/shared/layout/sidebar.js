/* =========================================================================
   Sidebar
   ========================================================================= */
(function () {
  const { icon, logo, foto, menuItems, esc, iniciais } = UI;

  function sidebar(state, activeRoute) {
    const u = state.user || { nome: "—", cargo: "" };
    const role = App.role();
    const items = menuItems(role);
    const rl = App.roleInfo();

    const isActive = (route) => activeRoute && (activeRoute === route || activeRoute.startsWith(route + "/"));
    const link = (it) => `<a href="${it.route}" class="nav-link ${isActive(it.route) ? "nav-link-active" : ""}" title="${it.label}" data-label="${esc(it.label)}">
        <span class="nav-ic shrink-0">${icon(it.icon, "w-5 h-5")}</span>
        <span class="sb-label flex-1">${it.label}</span>
        ${it.count ? `<span class="sb-label nav-count">${it.count}</span>` : ""}
        ${isActive(it.route) ? `<span class="sb-label w-1.5 h-1.5 rounded-full bg-wine"></span>` : ""}
      </a>`;
    const sublink = (c) => `<a href="${c.route}" class="nav-sublink ${isActive(c.route) ? "nav-sublink-active" : ""}">
        <span class="nav-sub-icon">${icon(c.icon || "chevron-right", "w-4 h-4")}</span><span class="sb-label flex-1">${c.label}</span>
        ${c.count ? `<span class="sb-label nav-count">${c.count}</span>` : ""}
      </a>`;
    const group = (it) => {
      const active = it.children.some((c) => isActive(c.route));
      const open = active && !state.sidebarCollapsed;
      return `<div class="nav-group ${open ? "nav-group-open" : ""}">
        <button type="button" data-action="toggle-submenu" class="nav-link nav-group-toggle ${active ? "nav-link-active" : ""}" title="${it.label}" data-label="${esc(it.label)}">
          <span class="nav-ic shrink-0">${icon(it.icon, "w-5 h-5")}</span>
          <span class="sb-label flex-1 text-left">${it.label}</span>
          <span class="sb-label">${icon("chevron-down", "w-4 h-4 nav-caret")}</span>
        </button>
        <div class="nav-submenu"><div class="nav-submenu-inner">${it.children.map(sublink).join("")}</div></div>
      </div>`;
    };
    const navLinks = items.map((it) => (it.children ? group(it) : link(it))).join("");

    return `<aside class="sidebar ${state.sidebarCollapsed ? "sidebar-collapsed" : ""}">
      <div class="sidebar-accent"></div>
      <div class="sidebar-brand-row px-5 pt-5 pb-4 flex items-center justify-between">${logo()}
        <button data-action="close-menu" class="icon-btn w-9 h-9 md:hidden">${icon("x","w-5 h-5")}</button>
      </div>

      <div class="px-4 mb-4">
        <div class="role-badge" title="Perfil: ${rl.label}">
          ${icon(rl.icon, "w-3.5 h-3.5")} <span class="sb-label">PERFIL: ${rl.curto}</span>
        </div>
      </div>

      <div class="sb-label px-5 mb-2 text-[11px] font-extrabold tracking-wide sb-muted">MENU PRINCIPAL</div>
      <nav class="px-3 space-y-1 flex-1 overflow-y-auto">${navLinks}</nav>

      <div class="sidebar-footer mt-auto px-4 pt-4 pb-4 sb-border-t">
        <a href="#/perfil" class="profile-link flex items-center gap-3 mb-3" title="${esc(u.nome)}" data-label="Meu perfil">
          <div class="avatar avatar-soft text-xs profile-avatar">${foto(u.nome)}${esc(iniciais(u.nome))}</div>
          <div class="sb-label min-w-0">
            <div class="font-bold text-sm truncate sb-text">${esc(u.nome)}</div>
            <div class="text-xs sb-muted truncate">${esc(u.cargo || "")}</div>
          </div>
        </a>
        <button data-action="logout" class="logout-link flex items-center gap-2 text-sm sb-muted hover:text-wine transition-colors" title="Sair da Conta" data-label="Sair da conta">
          ${icon("log-out", "w-4 h-4")} <span class="sb-label">Sair da Conta</span>
        </button>
      </div>
    </aside>`;
  }

  Object.assign(UI, { sidebar });
})();
