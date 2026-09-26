/* =========================================================================
   Ações globais (delegação de eventos)
   Todo botão/link com data-action="..." é tratado aqui.
   ========================================================================= */
(function () {
  const { state, ROLE_ORDER, THEMES } = App;

  function wireGlobal() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#quick-fab")) App.toggleFab(false);
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      if (a === "cycle-theme") { const order = Object.keys(THEMES); const i = order.indexOf(state.theme);
        state.theme = order[(i + 1) % order.length]; App.save();
        App.toast("Aparência: " + THEMES[state.theme].label); App.applyThemeLive(); }
      else if (a === "open-theme") { e.preventDefault(); App.openThemePanel(); }
      else if (a === "set-theme") { state.theme = el.dataset.theme; App.save(); App.closePanel();
        App.toast("Aparência: " + THEMES[state.theme].label); App.applyThemeLive(); }
      else if (a === "toggle-submenu") { el.closest(".nav-group")?.classList.toggle("nav-group-open"); }
      else if (a === "toggle-sidebar") {
        if (window.innerWidth <= 860) {
          const open = document.querySelector(".sidebar")?.classList.toggle("sidebar-open");
          document.querySelector(".drawer-backdrop")?.classList.toggle("show", !!open);
        } else {
          state.sidebarCollapsed = !state.sidebarCollapsed; App.save();
          document.querySelector(".sidebar")?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
          const handle = document.querySelector(".sidebar-handle");
          if (handle) handle.title = state.sidebarCollapsed ? "Expandir menu" : "Minimizar menu";
        }
      }
      else if (a === "cycle-role") { const i = ROLE_ORDER.indexOf(state.role); state.role = ROLE_ORDER[(i + 1) % ROLE_ORDER.length]; App.save();
        App.toast("Papel: " + App.roleInfo().label); App.render(); }
      else if (a === "set-role") { state.role = el.dataset.role; App.save(); App.closePanel(); App.toast("Papel: " + App.roleInfo().label); App.render(); }
      else if (a === "set-aniversario") { state.aniversarianteHoje = el.dataset.val === "true"; App.save(); App.closePanel();
        App.toast(state.aniversarianteHoje ? "🎉 Cenário: hoje é seu aniversário" : "Cenário: dia normal"); App.render(); }
      else if (a === "open-roles") { e.preventDefault(); App.openRolePanel(); }
      else if (a === "open-notif") { e.preventDefault(); App.openNotifPanel(); }
      else if (a === "close-panel") { App.closePanel();
        App.marcarLida(el.dataset.nid); }
      else if (a === "toggle-fab") { App.onFabClick(); }
      else if (a === "close-fab") { App.toggleFab(false); }
      else if (a === "logout") { state.auth = false; App.save(); App.go("#/login"); }
      else if (a === "save-noticia") { e.preventDefault(); PagesAdmin.submitNoticia(el.dataset.status); }
      else if (a === "save-documento") { e.preventDefault(); PagesAdmin.submitDocumento(el.dataset.status); }
      else if (a === "delete-row") { e.preventDefault();
        const row = el.closest("tr"), alvo = el.dataset.alvo, tipo = el.dataset.tipo, { coll, id } = el.dataset;
        App.openConfirm("Excluir item?", `Tem certeza que deseja excluir <b>${UI.esc(alvo || "este item")}</b>?<br>Esta ação será registrada na auditoria.`, () => {
          App.logAudit("excluiu", alvo || "item", tipo || "item");
          if (coll && id) App.removeItem(coll, id);
          if (row) { row.style.transition = ".25s"; row.style.opacity = "0"; row.style.transform = "translateX(20px)"; setTimeout(() => App.render(), 250); }
          App.toast("Item removido");
        }); }
      else if (a === "open-chamado") { e.preventDefault(); App.toggleFab(false); App.openChamadoPanel(el.dataset.tipo || "geral"); }
      else if (a === "open-usuario") { e.preventDefault(); App.openUsuarioPanel(el.dataset.id); }
      else if (a === "open-pedido") { e.preventDefault(); App.openPedidoPanel(); }
      else if (a === "preview-noticia") { e.preventDefault(); PagesAdmin.previewNoticia(el.dataset.id); }
      else if (a === "preview-doc") { e.preventDefault(); PagesAdmin.previewDocumento(el.dataset.id); }
      else if (a === "toggle-inscricao") { e.preventDefault(); const id = +el.dataset.id, ev = DB.eventos.find((x) => x.id === id);
        const on = state.inscricoes.includes(id);
        state.inscricoes = on ? state.inscricoes.filter((x) => x !== id) : [...state.inscricoes, id]; App.save();
        App.toast(on ? "Inscrição cancelada" : `Inscrição confirmada: ${ev?.titulo || "evento"}`); App.render(); }
      else if (a === "add-agenda") { e.preventDefault(); App.baixarIcs(DB.eventos.find((x) => x.id === +el.dataset.id)); }
      else if (a === "download-doc") { e.preventDefault(); App.baixarDocumento(el.dataset.id); }
      else if (a === "print-doc") { e.preventDefault(); window.print(); }
      else if (a === "zoom") { e.preventDefault(); const box = el.closest(".doc-viewer"); if (!box) return;
        const z = Math.min(1.6, Math.max(0.6, (+box.dataset.zoom || 1) + (+el.dataset.dir) * 0.1));
        box.dataset.zoom = z.toFixed(1); box.style.setProperty("--zoom", z);
        box.querySelector(".zoom-label").textContent = Math.round(z * 100) + "%"; }
      else if (a === "copy-ramal") { e.preventDefault(); App.copiar(el.dataset.ramal, `Ramal ${el.dataset.ramal} (${el.dataset.nome}) copiado`); }
      else if (a === "export-audit") { e.preventDefault(); PagesAdmin.exportarAuditoria(); }
      else if (a === "read-notif") { App.marcarLida(el.dataset.nid); }
      else if (a === "confirm-yes") { App.confirmYes(); }
      else if (a === "confirm-no") { App.closeModal(); }
      else if (a === "toast") { e.preventDefault(); App.toast(el.dataset.msg || "Feito!");
        if (el.dataset.goto) setTimeout(() => App.go(el.dataset.goto), 650); }
      else if (a === "celebrate") { e.preventDefault(); App.confettiBurst(el); App.toast(el.dataset.msg || "🎉");
        // Parabéns a um colega fica registrado: o botão vira "enviado" e não repete.
        if (el.dataset.nome && !state.parabens.includes(el.dataset.nome)) {
          state.parabens.push(el.dataset.nome); App.save();
          el.disabled = true; el.innerHTML = UI.icon("check", "w-4 h-4") + " Parabéns enviado";
        } }
      else if (a === "prevent") { e.preventDefault(); }
      else if (a === "open-menu") { document.querySelector(".sidebar")?.classList.add("sidebar-open"); document.querySelector(".drawer-backdrop")?.classList.add("show"); }
      else if (a === "close-menu") { App.closeMenu(); }
      else if (a === "mark-read") { state.readNotifs = App.notificacoesAll().map((n) => n.id); App.save(); App.toast("Todas marcadas como lidas"); App.render(); }
    });
    window.addEventListener("hashchange", () => { App.closeMenu(); App.closePanel(); App.closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") App.toggleFab(false); });
    document.addEventListener("submit", (e) => {
      const sf = e.target.closest('[data-action="search"]');
      if (sf) { e.preventDefault(); const q = sf.querySelector("input")?.value?.trim();
        if (q) { App.openSearchPanel(q); } else { App.toast("Digite algo para buscar"); } return; }
      if (e.target.closest('[data-action="prevent"]')) e.preventDefault();
      const pf = e.target.closest("[data-form]");
      if (pf) { e.preventDefault(); App.submitPanelForm(pf); }
    });
  }

  function closeMenu() {
    document.querySelector(".sidebar")?.classList.remove("sidebar-open");
    document.querySelector(".drawer-backdrop")?.classList.remove("show");
  }

  Object.assign(App, { wireGlobal, closeMenu });
})();
