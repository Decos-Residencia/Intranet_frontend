/* =========================================================================
   Ações globais (delegação de eventos)
   Todo botão/link com data-action="..." é tratado aqui.
   ========================================================================= */
(function () {
  const { state, THEMES } = App;

  function wireGlobal() {
    document.addEventListener("click", async (e) => {
      if (!e.target.closest("#quick-fab")) App.toggleFab(false);
      if (document.querySelector(".sidebar-collapsed") && !e.target.closest(".nav-group")) {
        document.querySelectorAll(".sidebar-collapsed .nav-group-open").forEach((g) => g.classList.remove("nav-group-open"));
      }
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      if (a === "cycle-theme") { const order = Object.keys(THEMES); const i = order.indexOf(state.theme);
        state.theme = order[(i + 1) % order.length]; App.save();
        App.toast("Aparência: " + THEMES[state.theme].label); App.applyThemeLive(); }
      else if (a === "open-theme") { e.preventDefault(); App.openThemePanel(); }
      else if (a === "set-theme") { state.theme = el.dataset.theme; App.save(); App.closePanel();
        App.toast("Aparência: " + THEMES[state.theme].label); App.applyThemeLive(); }
      else if (a === "toggle-submenu") {
        const group = el.closest(".nav-group");
        const collapsed = !!document.querySelector(".sidebar-collapsed");
        if (collapsed) {
          const willOpen = !group?.classList.contains("nav-group-open");
          document.querySelectorAll(".sidebar-collapsed .nav-group-open").forEach((g) => g.classList.remove("nav-group-open"));
          group?.classList.toggle("nav-group-open", willOpen);
        } else {
          group?.classList.toggle("nav-group-open");
        }
      }
      else if (a === "toggle-sidebar") {
        const toggle = document.querySelector(".sidebar-toggle");
        if (window.innerWidth <= 860) {
          const open = document.querySelector(".sidebar")?.classList.toggle("sidebar-open");
          document.querySelector(".drawer-backdrop")?.classList.toggle("show", !!open);
          toggle?.classList.toggle("sidebar-toggle-open", !!open);
          toggle?.setAttribute("aria-expanded", open ? "true" : "false");
          if (toggle) {
            toggle.title = open ? "Fechar menu" : "Abrir menu";
            toggle.setAttribute("aria-label", toggle.title);
          }
        } else {
          state.sidebarCollapsed = !state.sidebarCollapsed; App.save();
          document.querySelector(".sidebar")?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
          toggle?.classList.toggle("sidebar-toggle-collapsed", state.sidebarCollapsed);
          toggle?.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
          if (toggle) {
            toggle.title = state.sidebarCollapsed ? "Expandir menu" : "Minimizar menu";
            toggle.setAttribute("aria-label", toggle.title);
          }
        }
      }
      else if (a === "open-notif") { e.preventDefault(); App.openNotifPanel(); }
      else if (a === "close-panel") { App.closePanel();
        App.marcarLida(el.dataset.nid); }
      else if (a === "toggle-fab") { App.onFabClick(); }
      else if (a === "close-fab") { App.toggleFab(false); }
      else if (a === "logout") { App.logout(); }
      else if (a === "retry-session") { e.preventDefault(); App.render(); App.restoreSession(); }
      else if (a === "save-noticia") { e.preventDefault();
        try { await PagesAdmin.submitNoticia(el.dataset.status); }
        catch (err) { App.toast(err.message || "Não foi possível salvar a notícia."); } }
      else if (a === "save-documento") { e.preventDefault();
        try { await PagesAdmin.submitDocumento(el.dataset.status); }
        catch (err) { App.toast(err.message || "Não foi possível salvar o documento."); } }
      else if (a === "delete-row") { e.preventDefault();
        const row = el.closest("tr"), alvo = el.dataset.alvo, tipo = el.dataset.tipo, { coll, id } = el.dataset;
        App.openConfirm("Excluir item?", `Tem certeza que deseja excluir <b>${UI.esc(alvo || "este item")}</b>?<br>Esta ação será registrada na auditoria.`, async () => {
          try {
            await App.deleteRemoteItem(coll, id);
            if (row) { row.style.transition = ".25s"; row.style.opacity = "0"; row.style.transform = "translateX(20px)"; }
            await App.loadApiData();
            setTimeout(() => App.render(), row ? 250 : 0);
            App.toast("Item removido");
          } catch (err) {
            App.toast(err.message || "Não foi possível remover o item.");
          }
        }); }
      else if (a === "deactivate-usuario") { e.preventDefault();
        const { id, nome } = el.dataset;
        App.openConfirm("Desativar usuário?", `<b>${UI.esc(nome || "Este usuário")}</b> não conseguirá mais entrar na intranet. O cadastro não é apagado.`, async () => {
          try {
            await Services.usuarios.remove(id);
            await App.loadApiData(); App.render();
            App.toast("Usuário desativado");
          } catch (err) { App.toast(err.message || "Não foi possível desativar o usuário."); }
        }, "Sim, desativar"); }
      else if (a === "open-senha") { e.preventDefault(); App.openSenhaPanel(el.dataset.id); }
      else if (a === "reactivate-usuario") { e.preventDefault();
        const { id, nome } = el.dataset;
        App.openConfirm("Reativar usuário?", `<b>${UI.esc(nome || "Este usuário")}</b> poderá entrar novamente na intranet com a senha atual.`, async () => {
          try {
            await Services.usuarios.update(id, { ativo: true });
            await App.loadApiData(); App.render();
            App.toast("Usuário reativado");
          } catch (err) { App.toast(err.message || "Não foi possível reativar o usuário."); }
        }, "Sim, reativar", "btn-wine"); }
      else if (a === "delete-setor") { e.preventDefault();
        const { id, nome } = el.dataset;
        App.openConfirm("Excluir setor?", `Tem certeza que deseja excluir o setor <b>${UI.esc(nome)}</b>?<br>Setores com usuários vinculados não podem ser excluídos.`, async () => {
          try {
            await Services.setores.remove(id);
            await App.loadApiData(); App.render();
            App.toast("Setor excluído");
          } catch (err) { App.toast(err.message || "Não foi possível excluir o setor."); }
        }); }
      else if (a === "open-setor") { e.preventDefault(); App.openSetorPanel(el.dataset.id); }
      else if (a === "open-faq-nova") { e.preventDefault(); App.openFaqPanel(); }
      else if (a === "edit-faq") { e.preventDefault(); App.openFaqPanel(el.dataset.id); }
      else if (a === "toggle-faq") { e.preventDefault();
        try { await Services.faq.update(el.dataset.id, { ativo: el.dataset.ativo === "true" });
          App.toast(el.dataset.ativo === "true" ? "Pergunta ativada" : "Pergunta desativada"); }
        catch (err) { App.toast(err.message || "Não foi possível alterar o status."); }
        await App.loadApiData(); App.render(); }
      else if (a === "delete-faq") { e.preventDefault();
        const { id, pergunta } = el.dataset;
        App.openConfirm("Excluir pergunta?", `A pergunta <b>${UI.esc(pergunta)}</b> será excluída definitivamente. Para apenas escondê-la dos colaboradores, use <b>Desativar</b>.`, async () => {
          try { await Services.faq.remove(id); App.toast("Pergunta excluída"); }
          catch (err) { App.toast(err.message || "Não foi possível excluir a pergunta."); }
          await App.loadApiData(); App.render();
        }, "Sim, excluir"); }
      else if (a === "open-doc-url") { e.preventDefault(); App.abrirDocumento(el.dataset.id); }
      else if (a === "open-chamado") { e.preventDefault(); App.toggleFab(false); App.openChamadoPanel(el.dataset.tipo || "geral"); }
      else if (a === "open-usuario") { e.preventDefault(); App.openUsuarioPanel(el.dataset.id); }
      else if (a === "open-pedido") { e.preventDefault(); App.openPedidoPanel(); }
      else if (a === "preview-noticia") { e.preventDefault(); PagesAdmin.previewNoticia(el.dataset.id); }
      else if (a === "aviso-status") { e.preventDefault();
        const { id, status } = el.dataset;
        const msg = { PUBLICADO: "Aviso publicado", ARQUIVADO: "Aviso arquivado", RASCUNHO: "Agendamento cancelado (voltou a rascunho)" }[status] || "Aviso atualizado";
        try { await Services.avisos.update(id, { status }); App.toast(msg); }
        catch (err) { App.toast(err.message || "Não foi possível alterar o aviso."); }
        await App.loadApiData(); App.render(); }
      else if (a === "delete-aviso") { e.preventDefault();
        const { id, alvo } = el.dataset;
        App.openConfirm("Excluir aviso?", `Tem certeza que deseja excluir <b>${UI.esc(alvo || "este aviso")}</b>?<br>Avisos já lidos por colaboradores não podem ser excluídos: arquive-os para preservar o histórico. A ação é registrada na auditoria.`, async () => {
          try { await Services.avisos.remove(id); App.toast("Aviso excluído"); }
          catch (err) { App.toast(err.message || "Não foi possível excluir o aviso."); }
          await App.loadApiData(); App.render();
        }); }
      else if (a === "preview-doc") { e.preventDefault(); PagesAdmin.previewDocumento(el.dataset.id); }
      else if (a === "toggle-inscricao") { e.preventDefault(); const id = +el.dataset.id, ev = DB.eventos.find((x) => x.id === id);
        const on = state.inscricoes.includes(id);
        state.inscricoes = on ? state.inscricoes.filter((x) => x !== id) : [...state.inscricoes, id]; App.save();
        App.toast(on ? "Inscrição cancelada" : `Inscrição confirmada: ${ev?.titulo || "evento"}`); App.render(); }
      else if (a === "add-agenda") { e.preventDefault(); App.baixarIcs(DB.eventos.find((x) => x.id === +el.dataset.id)); }
      else if (a === "download-doc") { e.preventDefault(); App.baixarDocumento(el.dataset.id); }
      else if (a === "copy-ramal") { e.preventDefault(); App.copiar(el.dataset.ramal, `Ramal ${el.dataset.ramal} (${el.dataset.nome}) copiado`); }
      else if (a === "export-audit") { e.preventDefault(); PagesAdmin.exportarAuditoria(); }
      else if (a === "read-notif") { App.marcarLida(el.dataset.nid); }
      else if (a === "confirm-yes") { App.confirmYes(); }
      else if (a === "confirm-no") { App.closeModal(); }
      else if (a === "toast") { e.preventDefault(); App.toast(el.dataset.msg || "Feito!");
        if (el.dataset.goto) setTimeout(() => App.go(el.dataset.goto), 650); }
      else if (a === "celebrate") { e.preventDefault();
        // Parabéns a um colega: persistido no servidor (uma vez por pessoa e ano) e notificado a ele.
        if (el.dataset.id) await App.enviarParabens(el);
        else { App.confettiBurst(el); App.toast(el.dataset.msg || "🎉"); } }
      else if (a === "approve-solicitacao") { e.preventDefault(); App.aprovarSolicitacao(el); }
      else if (a === "reject-solicitacao") { e.preventDefault(); App.openRejeitarPanel(el); }
      else if (a === "prevent") { e.preventDefault(); }
      else if (a === "open-menu") { document.querySelector(".sidebar")?.classList.add("sidebar-open"); document.querySelector(".drawer-backdrop")?.classList.add("show"); }
      else if (a === "close-menu") { App.closeMenu(); }
      else if (a === "mark-read") { e.preventDefault();
        try { await App.marcarTodasLidas(); App.closePanel(); App.toast("Todas marcadas como lidas"); App.render(); }
        catch (err) { App.toast(err.message || "Não foi possível marcar como lidas."); } }
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
    const toggle = document.querySelector(".sidebar-toggle");
    toggle?.classList.remove("sidebar-toggle-open");
    toggle?.setAttribute("aria-expanded", "false");
    if (toggle && window.innerWidth <= 860) {
      toggle.title = "Abrir menu";
      toggle.setAttribute("aria-label", toggle.title);
    }
  }

  Object.assign(App, { wireGlobal, closeMenu });
})();
