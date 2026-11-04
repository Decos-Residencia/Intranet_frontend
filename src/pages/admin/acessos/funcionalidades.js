/* =========================================================================
   Tela: Funcionalidades (ADMIN)
   Rota: #/admin/funcionalidades
   Fonte: GET /funcionalidades · grava em PUT /funcionalidades/{codigo}.
   Cada módulo fica ligado para todos, desligado para todos ou só para alguns perfis
   (Visitante só nos módulos abertos a quem não entrou). Desligar esconde a consulta e a
   gestão do módulo e nunca apaga dados; religar traz tudo de volta. Tudo vai para a auditoria.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  const ROTULO_PUBLICO = { VISITANTE: "Visitante", LEITURA: "Leitura", COLABORADOR: "Colaborador", RH: "RH", ADMIN: "Administrador" };
  const ICONE = {
    agenda: "check-check", vagas: "trending-up", aniversariantes: "gift", eventos: "calendar", calendario: "calendar",
    faq: "help-circle", diretorio: "users", painel: "inbox", chamados: "help-circle",
  };

  const modo = (f) => (f.ligada_para.length === f.publicos.length ? "todos" : f.ligada_para.length ? "alguns" : "nenhum");

  function situacao(f) {
    const m = modo(f);
    if (m === "todos") return badge("green", "Ligado para todos");
    if (m === "nenhum") return badge("gray", "Desligado para todos");
    return badge("amber", "Só para " + f.ligada_para.map((p) => ROTULO_PUBLICO[p]).join(", "));
  }

  function linha(f) {
    const m = modo(f), nome = `fn-modo-${f.codigo}`;
    const opcao = (valor, rotulo) => `<label><input type="radio" name="${nome}" value="${valor}" ${m === valor ? "checked" : ""} data-fn-modo="${f.codigo}"><span>${rotulo}</span></label>`;
    return `<li class="card p-5" data-fn="${esc(f.codigo)}">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-10 h-10 rounded-xl bg-wine/10 text-wine flex items-center justify-center shrink-0">${icon(ICONE[f.codigo] || "settings", "w-5 h-5")}</span>
          <div class="min-w-0"><h3 id="fn-h-${esc(f.codigo)}" class="font-extrabold text-slate-800 dark:text-slate-100">${esc(f.rotulo)}</h3>
            <div class="text-xs mt-1" aria-live="polite">${situacao(f)}</div></div>
        </div>
        <div class="cfg-seg" role="radiogroup" aria-labelledby="fn-h-${esc(f.codigo)}">
          ${opcao("todos", "Ligado para todos")}${opcao("nenhum", "Desligado para todos")}${opcao("alguns", "Só para alguns")}
        </div>
      </div>
      <fieldset class="mt-4 ${m === "alguns" ? "" : "hidden"}" data-fn-alguns="${esc(f.codigo)}">
        <legend class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Ligado para:</legend>
        <div class="flex flex-wrap gap-x-5 gap-y-2">${f.publicos.map((p) => `<label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" class="acc-check" value="${p}" ${f.ligada_para.includes(p) ? "checked" : ""}> ${ROTULO_PUBLICO[p]}</label>`).join("")}</div>
        <button type="button" class="btn-wine px-4 mt-3 text-sm" data-fn-salvar="${esc(f.codigo)}">Salvar</button>
      </fieldset>
    </li>`;
  }

  function adminFuncionalidades() {
    let lista = [];

    async function salvar(codigo, ligadaPara) {
      const atual = lista.find((f) => f.codigo === codigo);
      try {
        const novo = await Services.funcionalidades.definir(codigo, ligadaPara);
        lista = lista.map((f) => (f.codigo === codigo ? novo : f));
        App.toast(`${novo.rotulo}: ${modo(novo) === "todos" ? "ligado para todos" : modo(novo) === "nenhum" ? "desligado para todos" : "ligado só para alguns perfis"}`);
        // O próprio ADMIN pode ter ligado/desligado algo para si: menu e telas se ajustam já.
        await App.atualizarFuncionalidades(true);
        App.render();
      } catch (err) {
        App.toast(err.message || "Não foi possível salvar.");
        if (atual) desenhar();
      }
    }

    function desenhar() {
      const el = document.getElementById("fn-lista");
      if (!el) return;
      el.innerHTML = lista.map(linha).join("");
      el.querySelectorAll("[data-fn-modo]").forEach((r) => r.addEventListener("change", () => {
        const f = lista.find((x) => x.codigo === r.dataset.fnModo);
        const alguns = el.querySelector(`[data-fn-alguns="${f.codigo}"]`);
        alguns.classList.toggle("hidden", r.value !== "alguns");
        if (r.value === "todos") salvar(f.codigo, f.publicos);
        else if (r.value === "nenhum") salvar(f.codigo, []);
        else alguns.querySelector("input")?.focus();
      }));
      el.querySelectorAll("[data-fn-salvar]").forEach((b) => b.addEventListener("click", () => {
        const marcados = [...el.querySelectorAll(`[data-fn-alguns="${b.dataset.fnSalvar}"] input:checked`)].map((i) => i.value);
        salvar(b.dataset.fnSalvar, marcados);
      }));
    }

    return {
      title: "Funcionalidades",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Funcionalidades</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Ligue ou desligue módulos da intranet para todos ou só para alguns perfis. Um módulo desligado some do menu, da Inicial e do Meu painel (inclusive a gestão dele) e nada é apagado: ao religar, tudo volta como estava. Toda mudança fica na auditoria.</p></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">${icon("lock", "w-4 h-4")} Início, Avisos, Documentos, Meu perfil, Configurações, Notificações e a Administração ficam sempre ligados.</p>
      <ul id="fn-lista" class="grid gap-4" aria-live="polite"><li class="card p-6 text-sm text-slate-500 dark:text-slate-400">Carregando…</li></ul>`,
      async init() {
        try { lista = await Services.funcionalidades.listar(); }
        catch (err) {
          const el = document.getElementById("fn-lista");
          if (el) el.innerHTML = `<li class="card p-6 text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar as funcionalidades. ${esc(err.message || "")}</li>`;
          return;
        }
        desenhar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminFuncionalidades });
})();
