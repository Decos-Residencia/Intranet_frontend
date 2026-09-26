/* =========================================================================
   Topbar
   ========================================================================= */
(function () {
  const { icon, foto } = UI;

  function topbar(state, title) {
    const u = DB.usuario;
    const rl = DB.roles[state.role];
    const roleTag = `<span class="ml-2 text-[10px] font-bold text-wine">${rl.curto}</span>`;
    const themeIcon = { light: "sun", dark: "moon", red: "wine" }[state.theme] || "sun";
    return `<header class="topbar">
      <button data-action="toggle-sidebar" class="icon-btn" title="Recolher/expandir menu">${icon("menu","w-5 h-5")}</button>
      <h1 class="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate">${title}</h1>
      <form data-action="search" class="flex-1 max-w-md mx-6 hidden md:block">
        <div class="search-box">
          ${icon("search", "w-4 h-4 text-slate-400")}
          <input type="text" placeholder="Buscar avisos, documentos, ramais..." class="bg-transparent outline-none flex-1 text-sm text-slate-600 dark:text-slate-200 placeholder:text-slate-400">
        </div>
      </form>
      <div class="flex items-center gap-2 md:gap-3 ml-auto">
        <button data-action="cycle-theme" class="icon-btn" title="Aparência: ${state.theme === "light" ? "Claro" : state.theme === "dark" ? "Escuro" : "Vinho"} — clique para trocar">
          ${icon(themeIcon, "w-5 h-5")}
        </button>
        <button data-action="open-notif" class="icon-btn relative" title="${App.unreadUrgent() ? "Você tem notificação urgente" : "Notificações"}">
          ${icon("bell", "w-5 h-5")}
          ${App.unreadCount() ? `<span class="absolute top-1 right-1 min-w-[16px] h-4 px-1 ${App.unreadUrgent() ? "bg-red-600 bell-urgent" : "bg-wine"} text-white text-[10px] font-bold rounded-full flex items-center justify-center">${App.unreadCount()}</span>` : ""}
        </button>
        <button data-action="open-roles" class="icon-btn ${state.role === "rh" || state.role === "admin" ? "icon-btn-on" : ""}" title="Trocar papel de acesso">
          ${icon(rl.icon, "w-5 h-5")}
        </button>
        <a href="#/perfil" class="flex items-center gap-2.5 pl-2 md:pl-3 md:border-l border-slate-200 dark:border-slate-700">
          <div class="text-right hidden sm:block leading-tight">
            <div class="text-sm font-bold text-slate-800 dark:text-slate-100">${u.nome}${roleTag}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${u.cargoCurto}</div>
          </div>
          <div class="avatar avatar-wine">${foto(u.nome)}${u.iniciais}</div>
        </a>
      </div>
    </header>`;
  }

  Object.assign(UI, { topbar });
})();
