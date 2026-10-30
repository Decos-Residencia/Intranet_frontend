/* =========================================================================
   Telas: Vagas internas (colaborador)
   Rotas: #/vagas (mural) e #/vagas/:id (detalhe)
   Fonte: GET /vagas, GET /vagas/:id. "Tenho interesse" (com mensagem opcional) e "Desistir"
   enquanto a vaga aceita candidatura. Ninguém além do RH vê quem se interessou.
   ========================================================================= */
(function () {
  const { icon, esc, badge, breadcrumb } = UI;
  const TURNOS = { MANHA: "Manhã", TARDE: "Tarde", NOITE: "Noite", DIURNO: "Diurno", "12X36": "12x36", COMERCIAL: "Comercial" };
  const dataBr = (s) => s.split("-").reverse().join("/");

  function situacao(v) {
    if (v.meu_interesse) return badge("green", "✓ Você demonstrou interesse");
    return v.aceita_candidatura ? badge("blue", `Candidaturas até ${dataBr(v.prazo)}`) : badge("gray", "Candidaturas encerradas");
  }

  function cartao(v) {
    return `<a href="#/vagas/${v.id}" class="card block p-5 abre-mouse vaga-card">
      <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
        <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100">${esc(v.cargo)}</h3>${situacao(v)}</div>
      <div class="flex gap-4 flex-wrap text-sm text-slate-600 dark:text-slate-300 mb-2">
        <span class="flex items-center gap-1">${icon("users", "w-4 h-4")} ${esc(v.setor || "—")}</span>
        <span class="flex items-center gap-1">${icon("clock", "w-4 h-4")} ${esc(TURNOS[v.turno] || v.turno)}</span></div>
      <p class="abre-texto text-sm text-slate-500 dark:text-slate-400">${esc(v.descricao)}</p></a>`;
  }

  function vagas() {
    return {
      title: "Vagas internas",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Crescimento no Hospital Decós</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Vagas internas</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Oportunidades abertas para quem já trabalha aqui. Seu interesse é visto só pelo RH: a sua chefia não é avisada.</p></div>
      <div class="flex gap-2 flex-wrap mb-4">
        <select id="vg-setor" class="select-field" aria-label="Filtrar por setor"><option value="">Setor: Todos</option>${App.setoresAll().map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("")}</select>
        <select id="vg-turno" class="select-field" aria-label="Filtrar por turno"><option value="">Turno: Todos</option>${Object.entries(TURNOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
        <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 px-2"><input type="checkbox" id="vg-abertas" checked> Só com candidaturas abertas</label>
      </div>
      <div id="vg-lista" class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="card p-10 text-center text-slate-500 dark:text-slate-400 lg:col-span-2">Carregando…</div></div>`,
      init() {
        const carregar = async () => {
          const alvo = document.getElementById("vg-lista");
          if (!alvo) return;
          try {
            const lista = await Services.vagas.listar({ setor_id: document.getElementById("vg-setor").value || undefined,
              turno: document.getElementById("vg-turno").value || undefined, abertas: document.getElementById("vg-abertas").checked || undefined });
            if (!document.contains(alvo)) return;
            alvo.innerHTML = lista.length ? lista.map(cartao).join("")
              : `<div class="card p-10 text-center text-slate-500 dark:text-slate-400 lg:col-span-2">Nenhuma vaga com esses filtros no momento.</div>`;
          } catch (err) { alvo.innerHTML = `<div class="card p-10 text-center text-slate-500 dark:text-slate-400 lg:col-span-2">Não foi possível carregar as vagas. ${esc(err.message || "")}</div>`; }
        };
        ["vg-setor", "vg-turno", "vg-abertas"].forEach((i) => document.getElementById(i).addEventListener("change", carregar));
        carregar();
      },
    };
  }

  function vagaDetalhe(id) {
    return {
      title: "Vaga interna",
      html: `${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Vagas internas", route: "#/vagas" }, { label: "Detalhes" }])}
        <div id="vg-detalhe" class="max-w-3xl"><div class="card p-10 text-center text-slate-500 dark:text-slate-400">Carregando…</div></div>`,
      async init() {
        const alvo = document.getElementById("vg-detalhe");
        const pintar = (v) => {
          alvo.innerHTML = `<article class="card p-6 space-y-4">
            <div class="flex items-start justify-between gap-3 flex-wrap"><h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${esc(v.cargo)}</h2>${situacao(v)}</div>
            <dl class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><dt class="field-label">SETOR</dt><dd class="text-slate-800 dark:text-slate-100">${esc(v.setor || "—")}</dd></div>
              <div><dt class="field-label">TURNO</dt><dd class="text-slate-800 dark:text-slate-100">${esc(TURNOS[v.turno] || v.turno)}</dd></div>
              <div><dt class="field-label">CANDIDATURAS ATÉ</dt><dd class="text-slate-800 dark:text-slate-100">${dataBr(v.prazo)}</dd></div></dl>
            <section><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Sobre a vaga</h3><p class="text-slate-700 dark:text-slate-200 whitespace-pre-line">${esc(v.descricao)}</p></section>
            <section><h3 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Requisitos</h3><p class="text-slate-700 dark:text-slate-200 whitespace-pre-line">${esc(v.requisitos)}</p></section>
            <div id="vg-acao" class="pt-4 border-t border-slate-100 dark:border-slate-800">${acao(v)}</div>
            <p id="vg-msg" class="text-sm" role="status" aria-live="polite"></p>
          </article>`;
          ligar(v);
        };
        const acao = (v) => {
          if (!v.aceita_candidatura) return `<p class="text-sm text-slate-600 dark:text-slate-300">As candidaturas para esta vaga estão encerradas.</p>`;
          if (!App.can("interact")) return `<p class="text-sm text-slate-600 dark:text-slate-300">Seu perfil é somente de consulta. Para se candidatar, fale com o RH.</p>`;
          if (v.meu_interesse) return `<div class="flex items-center gap-3 flex-wrap"><span class="painel-ok">${icon("check", "w-4 h-4")} O RH já recebeu o seu interesse.</span>
            <button type="button" id="vg-desistir" class="btn-outline px-4">Desistir</button></div>`;
          return `<label class="field-label" for="vg-mensagem">MENSAGEM PARA O RH (OPCIONAL)</label>
            <textarea id="vg-mensagem" class="field-input" rows="3" maxlength="500" placeholder="Conte em poucas palavras por que a vaga combina com você."></textarea>
            <button type="button" id="vg-quero" class="btn-wine px-6 py-2.5 mt-3">${icon("check", "w-4 h-4")} Tenho interesse</button>`;
        };
        const ligar = (v) => {
          document.getElementById("vg-quero")?.addEventListener("click", async (ev) => {
            const botao = ev.currentTarget; botao.disabled = true;
            try { const nova = await Services.vagas.interesse(v.id, document.getElementById("vg-mensagem").value.trim()); pintar(nova); App.toast("Interesse enviado ao RH"); }
            catch (err) { App.toast(err.message || "Não foi possível enviar."); botao.disabled = false; }
          });
          document.getElementById("vg-desistir")?.addEventListener("click", async (ev) => {
            const botao = ev.currentTarget; botao.disabled = true;
            try { const nova = await Services.vagas.retirar(v.id); pintar(nova); App.toast("Interesse retirado"); }
            catch (err) { App.toast(err.message || "Não foi possível desistir."); botao.disabled = false; }
          });
        };
        try { pintar(await Services.vagas.obter(id)); }
        catch (err) { alvo.innerHTML = `<div class="card p-10 text-center text-slate-500 dark:text-slate-400">${esc(err.message || "Vaga não encontrada.")} <a href="#/vagas" class="text-wine underline">Ver vagas</a></div>`; }
      },
    };
  }

  Object.assign(Pages, { vagas, vagaDetalhe });
  Object.assign(UI, { TURNOS_VAGA: TURNOS });
})();
