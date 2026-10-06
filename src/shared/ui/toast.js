/* =========================================================================
   Toast (mensagem de confirmação)
   ========================================================================= */
(function () {
  let toastTimer;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = `${UI.icon("check", "w-4 h-4")} <span>${UI.esc(msg)}</span>`; // texto puro: mensagens podem conter dados vindos da API
    t.classList.add("toast-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("toast-show"), 2600);
  }

  Object.assign(App, { toast });
})();
