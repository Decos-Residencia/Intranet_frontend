/* =========================================================================
   Tela: Login
   Rota: #/login
   ========================================================================= */
(function () {
  const { icon, logo } = UI;

  function login() {
    return {
      shell: false,
      html: `
      <div class="login-wrap">
        <header class="login-topbar">
          ${logo()}
          <div class="flex items-center gap-3">
            <button data-action="cycle-theme" class="icon-btn" title="Aparência: ${{light:"Claro",dark:"Escuro",red:"Vinho"}[App.state.theme]} — clique para trocar">
              ${icon({light:"sun",dark:"moon",red:"wine"}[App.state.theme] || "sun", "w-5 h-5")}
            </button>
            <span class="pill-restrito">${icon("lock", "w-3.5 h-3.5")} Acesso restrito a colaboradores</span>
          </div>
        </header>

        <main class="login-main">
          <div class="login-card">
            <div class="login-photo"></div>
            <div class="login-form">
              <h2 class="text-hero text-slate-500 dark:text-slate-300 mb-1 flex items-center gap-2">
                <span class="w-1 h-7 bg-wine rounded-full"></span>Olá, <strong class="text-slate-800 dark:text-white font-extrabold">colaborador</strong>
              </h2>
              <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Você está na área exclusiva do colaborador. Informe seus dados de acesso para entrar na intranet do Hospital Decós.</p>
              <form data-action="do-login" class="space-y-4">
                <input name="email" type="email" required placeholder="E-mail" class="login-input" autocomplete="email">
                <div class="relative">
                  <input name="senha" type="password" required placeholder="Senha" class="login-input pr-12" autocomplete="current-password">
                  <button type="button" data-action="toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">${icon("eye","w-5 h-5")}</button>
                </div>
                <div class="flex items-center justify-end pt-2">
                  <button type="submit" class="btn-wine px-8 py-3">Acessar</button>
                </div>
              </form>
              <div class="mt-6 space-y-2 text-sm text-slate-500 dark:text-slate-400" id="login-ajuda">
                <p>${icon("lock", "w-4 h-4 inline -mt-0.5")} <b>Acesso criado pelo administrador/RH.</b> No primeiro acesso, entre com a senha temporária que você recebeu e defina a sua.</p>
                <details>
                  <summary class="cursor-pointer font-bold text-wine hover:underline">Esqueci minha senha</summary>
                  <form id="form-esqueceu-senha" class="mt-3 space-y-3">
                    <input name="email" type="email" required placeholder="Digite seu e-mail cadastrado" class="field-input" autocomplete="email">
                    <button type="submit" class="btn-outline w-full py-2 text-sm">Enviar link de recuperação</button>
                    <p class="text-xs text-slate-400">Você receberá um link seguro para criar uma nova senha.</p>
                  </form>
                </details>
              </div>
            </div>
          </div>
        </main>

        <footer class="login-footer">
          <span>Todos os direitos reservados Hospital Decós 2026</span>
          <div class="flex gap-2 opacity-60">
            ${'<span class="w-4 h-4 bg-white/40 rounded-sm"></span>'.repeat(4)}
          </div>
        </footer>
      </div>`,
      init() {
        document.querySelector('[data-action="do-login"]').addEventListener("submit", async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const button = form.querySelector('button[type="submit"]');
          button.disabled = true;
          button.textContent = "Entrando...";
          const lento = setTimeout(() => { button.textContent = "Aguardando o servidor..."; }, 6000);
          try {
            const token = await Services.auth.login({
              email: form.elements.email.value.trim(),
              senha: form.elements.senha.value,
            });
            const user = await App.startSession(token.access_token); // GET /auth/me + dados da API
            form.reset();                                // a senha não fica no campo
            if (user.must_change_password) {
              App.toast("Primeiro acesso: defina sua nova senha para continuar.");
              App.go("#/trocar-senha");
            } else {
              App.toast("Bem-vindo à Intranet Decós!");
              App.go("#/dashboard");
            }
          } catch (err) {
            App.toast(err.message || "Não foi possível entrar.");
          } finally {
            clearTimeout(lento);
            button.disabled = false;
            button.textContent = "Acessar";
          }
        });
        const tp = document.querySelector('[data-action="toggle-pass"]');
        tp && tp.addEventListener("click", () => {
          const inp = tp.previousElementSibling;
          inp.type = inp.type === "password" ? "text" : "password";
        });
        const forgot = document.getElementById("form-esqueceu-senha");
        forgot && forgot.addEventListener("submit", async (e) => {
          e.preventDefault();
          const button = forgot.querySelector('button[type="submit"]');
          const email = forgot.elements.email.value.trim() || document.querySelector('[name="email"]')?.value?.trim();
          button.disabled = true;
          button.textContent = "Enviando...";
          try {
            await Services.auth.forgotPassword(email);
            App.toast("Se o e-mail estiver cadastrado, enviaremos o link de recuperação.");
            forgot.reset();
          } catch (err) {
            App.toast(err.message || "Não foi possível solicitar a recuperação.");
          } finally {
            button.disabled = false;
            button.textContent = "Enviar link de recuperação";
          }
        });
      },
    };
  }

  Object.assign(Pages, { login });
})();
