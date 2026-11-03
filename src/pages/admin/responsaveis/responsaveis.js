/* =========================================================================
   Tela: Responsáveis por setor (ADMIN)
   Rota: #/admin/responsaveis-setor
   Fonte: GET/POST /chamados/responsaveis-setor e PUT /chamados/responsaveis-setor/{id}.
   Define quem atende os chamados de cada setor e quem recebe o e-mail de aviso.
   Regra do servidor: sem responsável ativo com "recebe e-mail" no setor, o aviso vai aos ADMIN.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  function linha(v) {
    const semEmailValido = !v.usuario_ativo;
    const interruptor = (campo, ligado, rotulo) => `<label class="inline-flex items-center gap-2 text-xs">
      <input type="checkbox" role="switch" data-rs-campo="${campo}" data-rs-id="${v.id}" ${ligado ? "checked" : ""} ${semEmailValido ? "disabled" : ""}
        aria-label="${rotulo} — ${esc(v.usuario_nome)}"><span>${ligado ? "Sim" : "Não"}</span></label>`;
    return `<tr class="border-b border-slate-100 dark:border-slate-800 ${v.ativo && v.usuario_ativo ? "" : "opacity-60"}">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(v.usuario_nome)}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(v.usuario_email)}</div></td>
      <td class="text-sm text-slate-600 dark:text-slate-300">${esc(v.setor_nome)}</td>
      <td>${interruptor("ativo", v.ativo, "Atende chamados do setor")}</td>
      <td>${interruptor("recebe_email", v.recebe_email, "Recebe e-mail dos chamados")}</td>
      <td>${v.usuario_ativo ? badge("green", "Ativo") : badge("gray", "Conta inativa")}</td></tr>`;
  }

  function adminResponsaveisSetor() {
    const estado = { setor: "", busca: "" };
    const setores = App.setoresAll();
    const opcoesSetor = setores.map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("");

    async function carregar() {
      const corpo = document.getElementById("rs-rows");
      if (!corpo) return;
      try {
        const itens = await Services.responsaveisSetor.list(estado.setor);
        if (!document.getElementById("rs-rows")) return;
        corpo.innerHTML = itens.length ? itens.map(linha).join("")
          : `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">${estado.setor ? "Este setor ainda não tem responsáveis." : "Nenhum responsável configurado."} Os avisos de chamados vão para os administradores.</td></tr>`;
      } catch (err) {
        if (document.getElementById("rs-rows")) corpo.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar os responsáveis. ${esc(err.message || "")}</td></tr>`;
      }
    }

    async function buscarUsuarios() {
      const alvo = document.getElementById("rs-usuario");
      if (!alvo) return;
      try {
        const params = { page_size: 50 };
        if (estado.busca) params.busca = estado.busca;
        const r = await Services.usuarios.list(params);
        // LEITURA não atende chamados: o servidor recusa, então nem é oferecido.
        const elegiveis = r.items.filter((u) => u.perfil !== "LEITURA");
        alvo.innerHTML = `<option value="">Selecione…</option>` + elegiveis.map((u) => `<option value="${u.id}">${esc(u.nome)}${u.email ? ` — ${esc(u.email)}` : ""}</option>`).join("");
        document.getElementById("rs-aviso-busca").textContent = elegiveis.length ? "" : "Nenhuma pessoa elegível encontrada.";
      } catch (err) {
        alvo.innerHTML = `<option value="">Não foi possível carregar</option>`;
      }
    }

    async function adicionar(e) {
      e.preventDefault();
      const erro = document.getElementById("rs-erro");
      erro.classList.add("hidden");
      const setor_id = Number(document.getElementById("rs-setor-novo").value);
      const usuario_id = Number(document.getElementById("rs-usuario").value);
      if (!setor_id || !usuario_id) { erro.textContent = "Escolha o setor e a pessoa."; erro.classList.remove("hidden"); return; }
      try {
        await Services.responsaveisSetor.add({ setor_id, usuario_id, recebe_email: document.getElementById("rs-recebe").checked });
        App.toast("Responsável configurado");
        document.getElementById("rs-form").reset();
        carregar();
      } catch (err) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); }
    }

    return {
      title: "Responsáveis por setor",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Responsáveis por setor</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Quem atende os chamados de cada setor e quem recebe o e-mail de aviso. Sem nenhum responsável ativo com e-mail ligado no setor, o aviso vai para os administradores.</p></div>

      <section class="card p-6 mb-6" aria-labelledby="rs-novo-h">
        <h3 id="rs-novo-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">${icon("plus", "w-5 h-5 text-wine")} Adicionar responsável</h3>
        <form id="rs-form" class="grid gap-3 md:grid-cols-4 items-end" novalidate>
          <div><label class="field-label" for="rs-setor-novo">Setor</label>
            <select id="rs-setor-novo" class="select-field"><option value="">Selecione…</option>${opcoesSetor}</select></div>
          <div><label class="field-label" for="rs-busca">Buscar pessoa</label>
            <input id="rs-busca" type="search" class="field-input" maxlength="100" placeholder="Nome, cargo ou setor…" autocomplete="off"></div>
          <div><label class="field-label" for="rs-usuario">Pessoa</label>
            <select id="rs-usuario" class="select-field"><option value="">Carregando…</option></select>
            <p id="rs-aviso-busca" class="text-xs text-slate-500 dark:text-slate-400 mt-1" aria-live="polite"></p></div>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm"><input id="rs-recebe" type="checkbox" role="switch" checked> Recebe e-mail</label>
            <button type="submit" class="btn-wine px-4">Adicionar</button></div>
        </form>
        <p id="rs-erro" class="hidden text-sm text-red-600 mt-3" role="alert"></p>
      </section>

      <div class="flex gap-2 items-center flex-wrap mb-4">
        <label class="sr-only" for="rs-filtro-setor">Filtrar por setor</label>
        <select id="rs-filtro-setor" class="select-field"><option value="">Todos os setores</option>${opcoesSetor}</select>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <th class="py-3 pl-4">PESSOA</th><th>SETOR</th><th>ATENDE CHAMADOS</th><th>RECEBE E-MAIL</th><th>CONTA</th></tr></thead>
        <tbody id="rs-rows"><tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>`,
      init() {
        document.getElementById("rs-filtro-setor").addEventListener("change", (e) => { estado.setor = e.target.value; carregar(); });
        let t = 0;
        document.getElementById("rs-busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.busca = e.target.value.trim(); buscarUsuarios(); }, 300); });
        document.getElementById("rs-form").addEventListener("submit", adicionar);
        document.getElementById("rs-rows").addEventListener("change", async (e) => {
          const el = e.target.closest("[data-rs-campo]");
          if (!el) return;
          el.disabled = true;
          try {
            await Services.responsaveisSetor.update(el.dataset.rsId, { [el.dataset.rsCampo]: el.checked });
            App.toast("Responsável atualizado");
          } catch (err) {
            el.checked = !el.checked; // desfaz na tela se o servidor recusou
            App.toast(err.message || "Não foi possível atualizar.");
          }
          carregar();
        });
        carregar();
        buscarUsuarios();
      },
    };
  }

  Object.assign(PagesAdmin, { adminResponsaveisSetor });
})();
