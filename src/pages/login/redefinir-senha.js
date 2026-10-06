/* =========================================================================
   Tela: Redefinir senha por e-mail
   Rota: #/redefinir-senha?token_hash=...&type=recovery (link do e-mail do Supabase Auth)
   ========================================================================= */
(function () {
  const { icon, logo } = UI;

  const REGRAS = [
    ["len", "Pelo menos 8 caracteres"],
    ["max", "No máximo 72 bytes"],
    ["eq", "Confirmação igual à nova senha"],
  ];

  function redefinirSenha(query) {
    const params = new URLSearchParams(query || "");
    const token = params.get("type") === "recovery" ? params.get("token_hash") || "" : "";
    // O token só precisa estar na URL até aqui: some da barra de endereço e do histórico.
    if (token) { try { history.replaceState(null, "", location.pathname + location.search + "#/redefinir-senha"); } catch (_) { /* sem history */ } }
    return {
      shell: false,
      html: `
      <div class="login-wrap">
        <header class="login-topbar">
          ${logo()}
          <a href="#/login" class="btn-outline px-4 py-2 text-sm flex items-center gap-2">${icon("chevron-left", "w-4 h-4")} Voltar ao login</a>
        </header>
        <main class="login-main">
          <div class="login-card" style="max-width:34rem">
            <div class="login-form" style="width:100%">
              <h2 class="text-hero text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2">
                <span class="w-1 h-7 bg-wine rounded-full"></span>Criar <strong class="text-slate-800 dark:text-white font-extrabold">nova senha</strong>
              </h2>
              <p class="text-slate-500 dark:text-slate-400 mb-6">Informe sua nova senha para recuperar o acesso à Intranet Hospital Decós.</p>
              ${token ? "" : `<p class="text-sm text-red-600 mb-4" id="rs-sem-token">Link inválido ou incompleto. Solicite uma nova recuperação de senha na tela de login.</p>`}
              <form id="form-redefinir-senha" class="space-y-4" data-token="${UI.esc(token)}" novalidate>
                <div>
                  <label class="field-label" for="rs-nova">NOVA SENHA</label>
                  <div class="relative">
                    <input id="rs-nova" type="password" class="field-input pr-12" autocomplete="new-password" required maxlength="1024" placeholder="Mínimo de 8 caracteres">
                    <button type="button" data-toggle-pass="rs-nova" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Mostrar ou ocultar">${icon("eye", "w-5 h-5")}</button>
                  </div>
                </div>
                <div>
                  <label class="field-label" for="rs-conf">CONFIRMAR NOVA SENHA</label>
                  <div class="relative">
                    <input id="rs-conf" type="password" class="field-input pr-12" autocomplete="new-password" required maxlength="1024" placeholder="Repita a nova senha">
                    <button type="button" data-toggle-pass="rs-conf" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Mostrar ou ocultar">${icon("eye", "w-5 h-5")}</button>
                  </div>
                </div>
                <ul class="text-xs space-y-1" id="rs-regras">${REGRAS.map(([k, t]) => `<li data-regra="${k}">• ${t}</li>`).join("")}</ul>
                <button type="submit" class="btn-wine w-full py-3">Salvar nova senha</button>
              </form>
            </div>
          </div>
        </main>
      </div>`,
      init,
    };
  }

  function init() {
    const f = document.getElementById("form-redefinir-senha");
    if (!f) return;
    const v = (id) => document.getElementById(id).value;
    const bytes = (s) => new TextEncoder().encode(s).length;
    const regras = () => ({
      len: v("rs-nova").length >= 8,
      max: bytes(v("rs-nova")) <= 72,
      eq: !!v("rs-nova") && v("rs-nova") === v("rs-conf"),
    });
    const pintar = () => {
      const r = regras();
      f.querySelectorAll("[data-regra]").forEach((li) => {
        li.className = r[li.dataset.regra] ? "text-green-600 dark:text-green-400" : "text-slate-400";
      });
    };
    f.addEventListener("input", pintar);
    f.querySelectorAll("[data-toggle-pass]").forEach((b) => b.addEventListener("click", () => {
      const input = document.getElementById(b.dataset.togglePass);
      input.type = input.type === "password" ? "text" : "password";
    }));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = f.dataset.token;
      if (!token) { App.toast("Link inválido. Solicite uma nova recuperação."); return; }
      const r = regras();
      if (!r.len) { App.toast("A nova senha deve ter pelo menos 8 caracteres."); return; }
      if (!r.max) { App.toast("A nova senha deve ter no máximo 72 bytes."); return; }
      if (!r.eq) { App.toast("A confirmação não confere com a nova senha."); return; }
      const button = f.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await Services.auth.resetPassword(token, v("rs-nova"));
        f.reset();
        delete f.dataset.token; // o token não fica em lugar nenhum depois do uso
        App.toast("Senha redefinida com sucesso. Entre novamente.");
        App.go("#/login");
      } catch (err) {
        App.toast(err.message || "Não foi possível redefinir a senha.");
      } finally {
        button.disabled = false;
      }
    });
    pintar();
  }

  Object.assign(Pages, { redefinirSenha });
})();
