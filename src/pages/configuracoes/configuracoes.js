/* =========================================================================
   Tela: Configurações (todos os perfis, inclusive Leitura)
   Rota: #/configuracoes
   Aparência (tema) e Acessibilidade. Cada mudança vale na hora e fica salva na conta
   (PUT /auth/me/preferencias), valendo em qualquer aparelho.
   ========================================================================= */
(function () {
  const { icon, esc } = UI;

  const TEXTOS = [100, 125, 150, 175, 200];
  const ESCALAS = [["normal", "Normal"], ["confortavel", "Confortável"], ["ampla", "Ampla"]];
  const ESPACAMENTOS = [["normal", "Normal"], ["amplo", "Amplo"]];
  const TELAS = [["dashboard", "Início"], ["painel", "Meu painel"], ["avisos", "Avisos"], ["eventos", "Eventos"], ["agenda", "Minha agenda"], ["documentos", "Documentos & POPs"], ["diretorio", "Diretório & Ramais"]];
  const OPCOES = [
    ["alto_contraste", "Alto contraste", "Cores sólidas, texto e bordas com contraste máximo. Ideal para baixa visão ou telas com reflexo."],
    ["reduzir_movimento", "Reduzir movimento", "Desliga animações e transições. Recomendado para quem sente tontura ou enjoo com movimento."],
    ["reduzir_transparencia", "Reduzir transparência", "Troca o efeito de vidro fosco por fundos sólidos."],
    ["sublinhar_links", "Sublinhar links", "Deixa os links sublinhados, sem depender só da cor para identificá-los."],
    ["foco_reforcado", "Foco reforçado", "Contorno grosso e bem visível no item selecionado ao navegar pelo teclado."],
    ["fonte_leitura", "Fonte de leitura facilitada", "Usa a fonte Atkinson Hyperlegible, desenhada para pessoas com baixa visão."],
  ];

  function segmento(nome, rotulo, opcoes, atual) {
    return `<fieldset><legend class="sr-only">${esc(rotulo)}</legend><div class="cfg-seg">${opcoes.map(([v, l]) =>
      `<label><input type="radio" name="${nome}" value="${v}" ${String(v) === String(atual) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></fieldset>`;
  }

  // Alto contraste pode estar ligado pelo sistema (prefers-contrast) sem escolha na conta.
  const ligado = (chave) => chave === "alto_contraste" ? document.documentElement.dataset.contraste === "alto"
    : chave === "menu_recolhido" ? !!App.state.sidebarCollapsed : !!App.preferencia(chave);

  function interruptor(chave, rotulo, desc) {
    const id = `cfg-${chave}`;
    return `<div class="cfg-row">
      <div class="min-w-0"><label for="${id}" class="font-bold text-slate-800 dark:text-slate-100">${esc(rotulo)}</label>
        <p id="${id}-desc" class="text-sm text-slate-500 dark:text-slate-400">${esc(desc)}</p></div>
      <span class="switch"><input id="${id}" type="checkbox" role="switch" data-pref="${chave}" aria-describedby="${id}-desc" ${ligado(chave) ? "checked" : ""}><span aria-hidden="true"></span></span>
    </div>`;
  }

  function configuracoes() {
    const texto = App.preferencia("texto") || 100;
    const escala = App.preferencia("escala") || "normal";
    const espacamento = App.preferencia("espacamento") || "normal";
    const inicial = App.preferencia("tela_inicial") || "dashboard";
    return {
      title: "Configurações",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Sua conta</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Configurações</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Ajuste a intranet ao seu jeito. As mudanças valem na hora e ficam salvas na sua conta, em qualquer computador ou celular.</p></div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div class="xl:col-span-3 space-y-6">
          <section class="card p-6 cfg-section" aria-labelledby="cfg-aparencia">
            <h3 id="cfg-aparencia" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">${icon("sun", "w-5 h-5 text-wine")} Aparência</h3>
            <div id="cfg-temas">${App.seletorTemas().replace('class="theme-grid"', 'class="theme-grid theme-grid-2"')}</div>
          </section>

          <section class="card p-6 cfg-section" aria-labelledby="cfg-atalhos">
            <div class="flex items-center justify-between gap-3 mb-1 flex-wrap">
              <h3 id="cfg-atalhos" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon("link", "w-5 h-5 text-wine")} Meus atalhos</h3>
              <button type="button" id="cfg-add-atalho" class="btn-outline text-sm px-4">${icon("plus", "w-4 h-4")} Adicionar</button>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Links para sites e sistemas que você usa sempre. Aparecem nos Acessos rápidos só para você (até ${App.MAX_ATALHOS}).</p>
            <div id="cfg-lista-atalhos">${App.listaAtalhos()}</div>
          </section>

          <section class="card p-6 cfg-section" aria-labelledby="cfg-acess">
            <h3 id="cfg-acess" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">${icon("eye", "w-5 h-5 text-wine")} Acessibilidade</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Para todos os colaboradores, inclusive pessoas com deficiência visual, motora ou sensibilidade a movimento.</p>

            <div class="cfg-row flex-wrap">
              <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">Tamanho do texto</div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Aumenta todo o texto e a interface junto.</p></div>
              ${segmento("texto", "Tamanho do texto", TEXTOS.map((t) => [t, `${t}%`]), texto)}
            </div>
            <div class="cfg-row flex-wrap">
              <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">Tamanho dos botões e espaçamento</div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Botões e áreas de clique maiores, mais fáceis de acertar.</p></div>
              ${segmento("escala", "Tamanho dos botões e espaçamento", ESCALAS, escala)}
            </div>
            <div class="cfg-row flex-wrap">
              <div class="min-w-0"><div class="font-bold text-slate-800 dark:text-slate-100">Espaçamento entre linhas</div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Mais espaço entre linhas, letras e parágrafos. Ajuda na dislexia e na leitura de textos longos.</p></div>
              ${segmento("espacamento", "Espaçamento entre linhas", ESPACAMENTOS, espacamento)}
            </div>
            ${OPCOES.map(([k, r, d]) => interruptor(k, r, d)).join("")}
          </section>

          <section class="card p-6 cfg-section" aria-labelledby="cfg-nav">
            <h3 id="cfg-nav" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-1">${icon("home", "w-5 h-5 text-wine")} Navegação</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Como a intranet abre para você.</p>
            <div class="cfg-row flex-wrap">
              <div class="min-w-0"><label for="cfg-tela-inicial" class="font-bold text-slate-800 dark:text-slate-100">Tela ao entrar</label>
                <p id="cfg-tela-inicial-desc" class="text-sm text-slate-500 dark:text-slate-400">A primeira tela depois do login.</p></div>
              <select id="cfg-tela-inicial" class="select-field" aria-describedby="cfg-tela-inicial-desc">${TELAS.map(([v, l]) => `<option value="${v}" ${v === inicial ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
            </div>
            ${interruptor("menu_recolhido", "Menu lateral recolhido", "Mostra só os ícones do menu, deixando mais espaço para o conteúdo. Vale em qualquer aparelho.")}
          </section>
        </div>

        <aside class="xl:col-span-2 space-y-6">
          <section class="card p-6" aria-labelledby="cfg-previa">
            <h3 id="cfg-previa" class="font-extrabold text-slate-800 dark:text-slate-100 mb-3">Prévia</h3>
            <div class="cfg-preview space-y-3">
              <div class="font-bold text-slate-800 dark:text-slate-100">Comunicado de exemplo</div>
              <p class="text-sm text-slate-600 dark:text-slate-300">Este é um texto de exemplo para você conferir o tamanho, o contraste e a fonte. <a href="#/configuracoes" class="text-wine font-semibold">Um link de exemplo</a>.</p>
              <div class="flex gap-2 flex-wrap"><button type="button" class="btn-wine px-4 py-2">Botão principal</button><button type="button" class="btn-outline px-4 py-2">Secundário</button></div>
            </div>
          </section>
          <section class="card p-6">
            <h3 class="font-extrabold text-slate-800 dark:text-slate-100 mb-2">Voltar ao padrão</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Desfaz todas as preferências de aparência e acessibilidade. O sistema volta a seguir as configurações do seu aparelho.</p>
            <button type="button" id="cfg-restaurar" class="btn-outline w-full py-2.5">${icon("rotate-ccw", "w-4 h-4")} Restaurar padrão</button>
          </section>
          <p class="text-xs text-slate-500 dark:text-slate-400 px-1" aria-live="polite" id="cfg-status"></p>
        </aside>
      </div>`,
      init() {
        App.wireSeletorTemas(document.getElementById("cfg-temas"));
        const listaAt = document.getElementById("cfg-lista-atalhos");
        const redesenharAt = () => { listaAt.innerHTML = App.listaAtalhos(); };
        App.ligarListaAtalhos(listaAt, redesenharAt);
        document.getElementById("cfg-add-atalho").addEventListener("click", () => App.abrirNovoAtalho(redesenharAt));
        const status = document.getElementById("cfg-status");
        const salvar = (parcial) => App.salvarPreferencias(parcial)
          .then(() => { if (status) status.textContent = "Preferência salva na sua conta."; })
          .catch(() => { if (status) status.textContent = "Não foi possível salvar. Tente de novo."; });

        document.querySelectorAll('input[name="texto"]').forEach((r) => r.addEventListener("change", () => salvar({ texto: Number(r.value) })));
        document.querySelectorAll('input[name="escala"]').forEach((r) => r.addEventListener("change", () => salvar({ escala: r.value })));
        document.querySelectorAll('input[name="espacamento"]').forEach((r) => r.addEventListener("change", () => salvar({ espacamento: r.value })));
        document.getElementById("cfg-tela-inicial").addEventListener("change", (e) => salvar({ tela_inicial: e.target.value }));
        document.querySelectorAll("[data-pref]").forEach((c) => c.addEventListener("change", () => {
          // O menu muda na hora pela mesma ação da alça (que também salva na conta).
          if (c.dataset.pref === "menu_recolhido") {
            if (App.state.sidebarCollapsed !== c.checked) document.querySelector(".sidebar-alca")?.click();
            if (status) status.textContent = "Preferência salva na sua conta.";
            return;
          }
          salvar({ [c.dataset.pref]: c.checked });
        }));
        document.getElementById("cfg-restaurar").addEventListener("click", () => {
          App.openConfirm("Restaurar padrão?", "Tema, acessibilidade e navegação voltam ao padrão.", async () => {
            const tudo = Object.fromEntries(["tema", "texto", "escala", "espacamento", "menu_recolhido", "tela_inicial", ...OPCOES.map(([k]) => k)].map((k) => [k, null]));
            await salvar(tudo);
            App.state.theme = "auto"; App.state.sidebarCollapsed = false; App.save(); App.applyThemeLive();
            App.render();
          }, "Restaurar", "btn-wine");
        });
      },
    };
  }

  Object.assign(Pages, { configuracoes });
})();
