/* =========================================================================
   Lembretes da Minha agenda no navegador
   O servidor cria a notificação no sino quando o lembrete vence (sem cron: na consulta do sino).
   Aqui, com a intranet aberta, agendamos para a hora exata: atualiza o sino e, se a pessoa
   permitiu, mostra o alerta do sistema. A permissão só é pedida num clique (nunca ao abrir).
   ========================================================================= */
(function () {
  let timers = [];
  const suporta = () => "Notification" in window;
  const hojeIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  function limpar() { timers.forEach(clearTimeout); timers = []; }

  function disparar(l) {
    App.refreshNotificacoes?.();
    if (suporta() && Notification.permission === "granted") {
      try {
        const n = new Notification(`Lembrete: ${l.texto}`, { body: "Minha agenda · Intranet Decós", tag: `agenda-${l.id}`, icon: "/assets/img/simbolo.png" });
        n.onclick = () => { window.focus(); location.hash = "#/agenda"; n.close(); };
      } catch (_) { /* alguns navegadores só permitem via service worker: o sino já avisou */ }
    }
  }

  async function agendarLembretes() {
    limpar();
    if (!App.state.auth || App.state.user?.must_change_password) return;
    let lista = [];
    try { lista = await Services.agenda.lembretes(hojeIso()); } catch (_) { return; }
    const agora = Date.now();
    lista.forEach((l) => {
      const espera = new Date(l.dispara_em).getTime() - agora;
      // Pequena folga para o servidor já considerar o lembrete vencido quando o sino consultar.
      if (espera > -60000 && espera < 24 * 3600 * 1000) timers.push(setTimeout(() => disparar(l), Math.max(0, espera) + 2000));
    });
  }

  // Botão/estado dos alertas do navegador (usado na tela da agenda).
  function botaoAlertasNavegador(el) {
    if (!el) return;
    if (!suporta()) { el.innerHTML = `<p class="text-xs text-slate-500 dark:text-slate-400">Este navegador não mostra alertas do sistema; os lembretes chegam no sino.</p>`; return; }
    const estado = Notification.permission;
    if (estado === "granted") { el.innerHTML = `<p class="painel-ok text-sm">${UI.icon("bell", "w-4 h-4")} Alertas do navegador ativados</p>`; return; }
    if (estado === "denied") { el.innerHTML = `<p class="text-xs text-slate-500 dark:text-slate-400">Os alertas do navegador estão bloqueados para este site. Os lembretes continuam chegando no sino.</p>`; return; }
    el.innerHTML = `<button type="button" class="btn-outline w-full py-2" id="ag-alertas-btn">${UI.icon("bell", "w-4 h-4")} Ativar alertas do navegador</button>
      <p class="field-hint">Opcional: além do sino, o computador avisa na hora do lembrete.</p>`;
    el.querySelector("#ag-alertas-btn").addEventListener("click", async () => {
      try { await Notification.requestPermission(); } catch (_) { /* navegador antigo */ }
      botaoAlertasNavegador(el);
      agendarLembretes();
    });
  }

  window.addEventListener("hashchange", () => { if (!App.state.auth) limpar(); });
  Object.assign(App, { agendarLembretes, botaoAlertasNavegador });
})();
