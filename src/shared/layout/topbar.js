/* =========================================================================
   Topbar
   ========================================================================= */
(function () {
  const { icon, foto, esc, iniciais } = UI;

  // Conteúdo do botão do sino (ícone + contador REAL de não lidas). Reutilizado ao atualizar o contador.
  function sinoConteudo() {
    return `${icon("bell", "w-5 h-5")}
    ${App.unreadCount() ? `<span class="absolute top-1 right-1 min-w-[16px] h-4 px-1 ${App.unreadUrgent() ? "bg-red-600 bell-urgent" : "bg-wine"} text-white text-[10px] font-bold rounded-full flex items-center justify-center">${App.unreadCount()}</span>` : ""}`;
  }

  function topbar(state, title) {
    const u = state.user || { nome: "—", cargo: "" };
    const themeIcon = App.THEMES[state.theme]?.icon || "sun";
    const sidebarTitle = state.sidebarCollapsed ? "Expandir menu" : "Minimizar menu";
    return `<header class="topbar">
      <button data-action="toggle-sidebar" class="icon-btn sidebar-toggle ${state.sidebarCollapsed ? "sidebar-toggle-collapsed" : ""}" title="${sidebarTitle}" aria-label="${sidebarTitle}" aria-expanded="${!state.sidebarCollapsed}">
        ${icon("chevron-left","w-5 h-5")}
      </button>
      <h1 class="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate">${title}</h1>
      <form data-action="search" class="topbar-search flex-1 max-w-md mx-6 hidden md:block" autocomplete="off">
        <div class="search-box">
          ${icon("search", "w-4 h-4 text-slate-400")}
          <input type="search" data-search-input placeholder="Buscar avisos, documentos, ramais..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200 placeholder:text-slate-400">
        </div>
        <div class="search-preview hidden" data-search-preview></div>
      </form>
      <div class="flex items-center gap-2 md:gap-3 ml-auto">
        <button type="button" data-action="open-theme" aria-haspopup="menu" aria-expanded="false" class="icon-btn" title="Aparência: ${App.THEMES[state.theme]?.label || "Claro"}" aria-label="Aparência: ${App.THEMES[state.theme]?.label || "Claro"}. Trocar tema">
          ${icon(themeIcon, "w-5 h-5")}
        </button>
        ${state.auth ? `<button type="button" data-action="open-notif" class="icon-btn relative" title="${App.unreadUrgent() ? "Você tem notificação urgente" : "Notificações"}" aria-label="Notificações${App.unreadCount() ? ` (${App.unreadCount()} não lidas)` : ""}">${UI.sinoConteudo()}</button>
        <a href="#/perfil" class="flex items-center gap-2.5 pl-2 md:pl-3 md:border-l border-slate-200 dark:border-slate-700" aria-label="Meu perfil: ${esc(u.nome)}, perfil de acesso ${esc(App.roleInfo().label)}">
          <div class="text-right hidden sm:block leading-tight">
            <div class="text-sm font-bold text-slate-800 dark:text-slate-100">${esc(u.nome)}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1.5">${u.cargo ? `<span>${esc(u.cargo)}</span>` : ""}
              <span class="topbar-perfil" title="Perfil de acesso definido pelo administrador">${icon(App.roleInfo().icon, "w-3 h-3")} ${esc(App.roleInfo().label)}</span></div>
          </div>
          <div class="avatar avatar-wine">${foto(u.nome)}${esc(iniciais(u.nome))}</div>
        </a>` : `<a href="#/login" data-action="entrar" class="btn-wine px-5">${icon("lock", "w-4 h-4")} Entrar</a>`}
      </div>
    </header>`;
  }

  Object.assign(UI, { topbar, sinoConteudo });
})();
