/* =========================================================================
   Atalhos pessoais (Acessos rápidos de cada usuário)
   Ficam nas preferências da conta (PUT /auth/me/preferencias → atalhos), até 12.
   Só links http/https; abrem em nova aba. O servidor valida de novo.
   ========================================================================= */
(function () {
  const { esc, icon } = UI;
  const MAX = 12;

  const meus = () => (App.state.user?.preferencias?.atalhos || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const salvar = (lista) => App.salvarPreferencias({ atalhos: lista.map((a, i) => ({ nome: a.nome, url: a.url, icone: a.icone || "link", ordem: i })) });

  function validar(nome, url) {
    if (!nome) return "Dê um nome ao atalho.";
    if (nome.length > 40) return "O nome pode ter até 40 caracteres.";
    if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url)) return "Informe um link completo, começando com https:// (ex.: https://www.site.com.br).";
    return "";
  }

  // Painel "Adicionar atalho". aoSalvar é chamado depois de gravar (ex.: redesenhar a tela).
  function abrirNovoAtalho(aoSalvar) {
    if (meus().length >= MAX) { App.toast(`Você já tem ${MAX} atalhos. Remova um nas Configurações para adicionar outro.`); return; }
    App.openPanel("Adicionar atalho", `<form id="at-form" class="space-y-4" novalidate>
      <p class="text-sm text-slate-500 dark:text-slate-400">Crie um atalho para um site ou sistema que você usa sempre. Ele aparece só para você e abre em nova aba.</p>
      <div><label class="field-label" for="at-nome">NOME *</label><input id="at-nome" class="field-input" maxlength="40" placeholder="Ex.: Escala de plantão" autocomplete="off"></div>
      <div><label class="field-label" for="at-url">LINK *</label><input id="at-url" class="field-input" type="url" inputmode="url" maxlength="500" placeholder="https://" autocomplete="off"></div>
      <p id="at-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">${icon("plus", "w-4 h-4")} Adicionar atalho</button>
    </form>`);
    const form = document.getElementById("at-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("at-nome").value.trim(), url = document.getElementById("at-url").value.trim();
      const erro = validar(nome, url), box = document.getElementById("at-erro");
      if (erro) { box.textContent = erro; box.classList.remove("hidden"); return; }
      try {
        await salvar([...meus(), { nome, url, icone: "link" }]);
        App.closePanel(); App.toast(`Atalho "${nome}" adicionado`);
        aoSalvar?.();
      } catch (err) { box.textContent = err.message || "Não foi possível salvar o atalho."; box.classList.remove("hidden"); }
    });
  }

  // Lista editável (Configurações → Atalhos).
  function listaAtalhos() {
    const lista = meus();
    if (!lista.length) return `<p class="text-sm text-slate-500 dark:text-slate-400 py-2">Você ainda não tem atalhos pessoais.</p>`;
    return `<ol class="space-y-2">${lista.map((a, i) => `<li class="versao-item flex items-center gap-3 flex-wrap">
      <span class="qa-icon">${icon("link", "w-4 h-4")}</span>
      <span class="min-w-0 flex-1"><span class="block font-bold text-slate-800 dark:text-slate-100 truncate">${esc(a.nome)}</span>
        <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" class="block text-xs text-slate-500 dark:text-slate-400 truncate hover:underline">${esc(a.url)}<span class="sr-only"> (abre em nova aba)</span></a></span>
      <span class="flex gap-1">
        <button type="button" class="act-btn" data-at-mover="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Mover ${esc(a.nome)} para cima">${icon("chevron-up", "w-4 h-4")}</button>
        <button type="button" class="act-btn" data-at-mover="${i}" data-dir="1" ${i === lista.length - 1 ? "disabled" : ""} aria-label="Mover ${esc(a.nome)} para baixo">${icon("chevron-down", "w-4 h-4")}</button>
        <button type="button" class="act-btn act-btn-danger" data-at-remover="${i}" aria-label="Remover ${esc(a.nome)}">${icon("trash", "w-4 h-4")}</button>
      </span></li>`).join("")}</ol>`;
  }

  function ligarListaAtalhos(alvo, redesenhar) {
    alvo.addEventListener("click", async (e) => {
      const mover = e.target.closest("[data-at-mover]"), remover = e.target.closest("[data-at-remover]");
      if (!mover && !remover) return;
      const lista = meus();
      if (mover) {
        const i = Number(mover.dataset.atMover), j = i + Number(mover.dataset.dir);
        if (j < 0 || j >= lista.length) return;
        [lista[i], lista[j]] = [lista[j], lista[i]];
      } else {
        lista.splice(Number(remover.dataset.atRemover), 1);
      }
      try { await salvar(lista); redesenhar(); } catch (_) { /* toast já exibido */ }
    });
  }

  Object.assign(App, { abrirNovoAtalho, listaAtalhos, ligarListaAtalhos, MAX_ATALHOS: MAX });
})();
