/* =========================================================================
   Tela: Trocar senha
   Rota: #/trocar-senha
   Serve ao primeiro acesso OBRIGATÓRIO (senha temporária definida pelo ADMIN: sem menu, só
   esta tela e "Sair") e à troca voluntária de quem já está logado.
   Fonte: POST /auth/change-password (exige a senha atual e devolve um token novo).
   ========================================================================= */
(function () {
  const { icon, logo } = UI;

  const REGRAS = [
    ["len", "Pelo menos 8 caracteres"],
    ["max", "No máximo 72 bytes (cerca de 72 caracteres sem acento)"],
    ["dif", "Diferente da senha atual"],
    ["eq", "Confirmação igual à nova senha"],
  ];

  const pwd = (id, label, ph, auto) => `<div><label class="field-label" for="${id}">${label}</label>
    <div class="relative"><input id="${id}" name="${id}" type="password" class="field-input pr-12" autocomplete="${auto}" placeholder="${ph}" required maxlength="1024">
    <button type="button" data-toggle-pass="${id}" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Mostrar ou ocultar">${icon("eye", "w-5 h-5")}</button></div></div>`;

  function formHtml(obrigatorio) {
    return `<form id="form-trocar-senha" class="space-y-4" novalidate>
      ${pwd("ts-atual", obrigatorio ? "SENHA TEMPORÁRIA (A QUE VOCÊ RECEBEU)" : "SENHA ATUAL", obrigatorio ? "Senha informada pelo administrador" : "Digite sua senha atual", "current-password")}
      ${pwd("ts-nova", "NOVA SENHA", "Mínimo de 8 caracteres", "new-password")}
      ${pwd("ts-conf", "CONFIRMAR NOVA SENHA", "Repita a nova senha", "new-password")}
      <ul class="text-xs space-y-1" id="ts-regras">${REGRAS.map(([k, t]) => `<li data-regra="${k}">• ${t}</li>`).join("")}</ul>
      <button type="submit" class="btn-wine w-full py-3">${obrigatorio ? "Definir senha e entrar" : "Atualizar senha"}</button>
    </form>`;
  }

  function trocarSenha() {
    const obrigatorio = !!App.state.user?.must_change_password;
    const intro = obrigatorio
      ? `<p class="text-slate-500 dark:text-slate-400 mb-6">Seu acesso foi criado pelo administrador com uma <b>senha temporária</b>. Por segurança, defina agora a sua própria senha para continuar.</p>`
      : `<p class="text-slate-500 dark:text-slate-400 mb-6">Informe sua senha atual e escolha a nova. Seus outros acessos abertos serão encerrados.</p>`;
    const corpo = `${intro}${formHtml(obrigatorio)}`;

    const html = obrigatorio
      ? `<div class="login-wrap">
          <header class="login-topbar">${logo()}
            <button data-action="logout" class="btn-outline px-4 py-2 text-sm flex items-center gap-2">${icon("log-out", "w-4 h-4")} Sair</button>
          </header>
          <main class="login-main"><div class="login-card" style="max-width:34rem"><div class="login-form" style="width:100%">
            <h2 class="text-hero text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-2"><span class="w-1 h-7 bg-wine rounded-full"></span>Defina sua <strong class="text-slate-800 dark:text-white font-extrabold">nova senha</strong></h2>
            ${corpo}
          </div></div></main>
        </div>`
      : `<div class="max-w-xl"><div class="card p-6">
          <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Alterar senha</h3>${corpo}</div></div>`;

    return { title: "Alterar senha", shell: !obrigatorio, html, init };
  }

  function init() {
    const f = document.getElementById("form-trocar-senha");
    if (!f) return;
    const v = (id) => document.getElementById(id).value;
    const bytes = (s) => new TextEncoder().encode(s).length;
    const regras = () => ({
      len: v("ts-nova").length >= 8,
      max: bytes(v("ts-nova")) <= 72,
      dif: !!v("ts-nova") && v("ts-nova") !== v("ts-atual"),
      eq: !!v("ts-nova") && v("ts-nova") === v("ts-conf"),
    });
    const pintar = () => {
      const r = regras();
      f.querySelectorAll("[data-regra]").forEach((li) => { li.className = r[li.dataset.regra] ? "text-green-600 dark:text-green-400" : "text-slate-400"; });
    };
    f.addEventListener("input", pintar);
    f.querySelectorAll("[data-toggle-pass]").forEach((b) => b.addEventListener("click", () => {
      const i = document.getElementById(b.dataset.togglePass); i.type = i.type === "password" ? "text" : "password";
    }));

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!v("ts-atual")) { App.toast("Informe a senha atual."); return; }
      const r = regras();
      if (!r.len) { App.toast("A nova senha deve ter pelo menos 8 caracteres."); return; }
      if (!r.max) { App.toast("A nova senha deve ter no máximo 72 bytes."); return; }
      if (!r.dif) { App.toast("A nova senha deve ser diferente da atual."); return; }
      if (!r.eq) { App.toast("A confirmação não confere com a nova senha."); return; }
      const botao = f.querySelector('button[type="submit"]');
      botao.disabled = true;
      try {
        const eraObrigatorio = !!App.state.user?.must_change_password;
        await App.changePassword(v("ts-atual"), v("ts-nova"));
        f.reset(); // as senhas não ficam no campo
        App.toast(eraObrigatorio ? "Senha definida! Bem-vindo à Intranet Decós." : "Senha alterada com sucesso.");
        App.go(eraObrigatorio ? "#/dashboard" : "#/perfil");
      } catch (err) {
        App.toast(err.message || "Não foi possível alterar a senha.");
      } finally { botao.disabled = false; }
    });
    pintar();
  }

  Object.assign(Pages, { trocarSenha });
})();
