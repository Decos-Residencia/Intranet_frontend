/* =========================================================================
   Parabéns (ação com API)
   POST /parabens: uma vez por pessoa e ano; gera notificação real para o aniversariante.
   ========================================================================= */
(function () {
  // Parabéns com recado opcional: vai na notificação e no e-mail da conta do aniversariante.
  function enviarParabens(el) {
    const id = Number(el.dataset.id), nome = el.dataset.nome || "colega";
    const primeiro = UI.esc(nome.split(" ")[0]);
    App.openPanel(`Parabéns para ${primeiro} 🎉`, `<form id="pb-form" class="space-y-4" novalidate>
      <p class="text-sm text-slate-600 dark:text-slate-300">${primeiro} recebe uma notificação na intranet e um e-mail no endereço da conta.</p>
      <div><label class="field-label" for="pb-msg">RECADO (OPCIONAL)</label>
        <textarea id="pb-msg" class="field-input" rows="3" maxlength="300" placeholder="Ex.: Feliz aniversário! Muita saúde e sucesso."></textarea>
        <p class="field-hint"><span id="pb-cont">0</span>/300</p></div>
      <p id="pb-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3" id="pb-enviar">${UI.icon("party", "w-4 h-4")} Enviar parabéns</button></form>`);
    const msg = document.getElementById("pb-msg"), erro = document.getElementById("pb-erro");
    msg.focus();
    msg.addEventListener("input", () => { document.getElementById("pb-cont").textContent = msg.value.length; });
    document.getElementById("pb-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const botao = document.getElementById("pb-enviar"); botao.disabled = true;
      let enviado = false;
      try {
        await App.parabenizar(id, msg.value.trim());
        enviado = true;
        App.closePanel();
        App.confettiBurst(el);
        App.toast(`🎉 Parabéns enviado para ${nome}!`);
      } catch (err) {
        if (err.status === 409) { App.marcarParabenizado(id); enviado = true; App.closePanel(); App.toast(err.message); }
        else { erro.textContent = err.message || "Não foi possível enviar os parabéns."; erro.classList.remove("hidden"); botao.disabled = false; }
      }
      if (enviado && document.contains(el)) { el.disabled = true; el.innerHTML = UI.icon("check", "w-4 h-4") + " Parabéns enviado"; }
      // Na tela do Aniversariante do Dia, redesenha para a contagem de parabéns subir (depois do confete).
      if (enviado && location.hash === "#/aniversariantes/hoje") setTimeout(() => App.render(), 900);
    });
  }

  // Data do cadastro (aaaa-mm-dd) em dd/mm/aaaa.
  const dataBr = (iso) => (iso ? String(iso).split("-").reverse().join("/") : "—");

  Object.assign(App, { enviarParabens, dataBr });
})();
