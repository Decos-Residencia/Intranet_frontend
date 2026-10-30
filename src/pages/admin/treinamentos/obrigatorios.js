/* =========================================================================
   Tela: Treinamentos obrigatórios (gestão de eventos)
   Rota: #/admin/treinamentos
   Fonte: GET/POST/PUT/DELETE /treinamentos-obrigatorios. Cada tema vale para setores e/ou
   perfis; as turmas são treinamentos ligados ao tema no formulário do evento. Quem tem
   presença confirmada em qualquer turma sai da lista de pendentes.
   ========================================================================= */
(function () {
  const { icon, esc, badge } = UI;
  const PERFIS = [["COLABORADOR", "Colaborador"], ["RH", "RH"], ["LEITURA", "Leitura"], ["ADMIN", "Administrador"]];
  const nomePerfil = Object.fromEntries(PERFIS);

  function publico(t) {
    const setores = App.setoresAll();
    const nomes = t.setores_ids.map((id) => setores.find((s) => s.id === id)?.nome || `Setor ${id}`);
    return [...nomes, ...t.perfis.map((p) => `Perfil ${nomePerfil[p] || p}`)].join(", ");
  }

  function linha(t) {
    return `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="py-3.5 pl-4"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(t.tema)}</div>
        ${t.descricao ? `<div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">${esc(t.descricao)}</div>` : ""}</td>
      <td class="text-sm text-slate-600 dark:text-slate-300 max-w-xs">${esc(publico(t))}</td>
      <td class="text-sm">${t.turmas}</td>
      <td>${t.ativo ? (t.pendentes ? badge("amber", `${t.pendentes} pendente${t.pendentes === 1 ? "" : "s"}`) : badge("green", "Todos em dia")) : badge("gray", "Desativado")}</td>
      <td class="text-right pr-4"><div class="flex gap-1.5 justify-end">
        <button type="button" class="act-btn" data-tema-editar="${t.id}" aria-label="Editar ${esc(t.tema)}">${icon("edit", "w-4 h-4")}</button>
        ${t.ativo ? `<button type="button" class="act-btn act-btn-danger" data-tema-excluir="${t.id}" aria-label="${t.turmas ? "Desativar" : "Excluir"} ${esc(t.tema)}">${icon("trash", "w-4 h-4")}</button>`
          : `<button type="button" class="act-btn" data-tema-reativar="${t.id}" aria-label="Reativar ${esc(t.tema)}">${icon("rotate-ccw", "w-4 h-4")}</button>`}
      </div></td></tr>`;
  }

  function formulario(t) {
    const setores = App.setoresAll();
    const marcado = (lista, v) => (lista || []).includes(v) ? "checked" : "";
    return `<form id="tema-form" class="space-y-4" novalidate>
      <div><label class="field-label" for="tema-nome">TEMA *</label><input id="tema-nome" class="field-input" maxlength="150" value="${esc(t?.tema || "")}" placeholder="Ex.: NR-32 Biossegurança"></div>
      <div><label class="field-label" for="tema-desc">DESCRIÇÃO</label><textarea id="tema-desc" class="field-input" rows="3" maxlength="1000" placeholder="Por que é obrigatório, periodicidade, a quem procurar">${esc(t?.descricao || "")}</textarea></div>
      <fieldset><legend class="field-label">SETORES</legend>
        <div class="tema-opcoes">${setores.map((s) => `<label><input type="checkbox" name="tema-setor" value="${s.id}" ${marcado(t?.setores_ids, s.id)}> ${esc(s.nome)}</label>`).join("")}</div></fieldset>
      <fieldset><legend class="field-label">PERFIS</legend>
        <div class="tema-opcoes">${PERFIS.map(([v, l]) => `<label><input type="checkbox" name="tema-perfil" value="${v}" ${marcado(t?.perfis, v)}> ${l}</label>`).join("")}</div>
        <p class="field-hint">Vale para quem estiver em qualquer setor marcado OU tiver qualquer perfil marcado.</p></fieldset>
      <p id="tema-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">${t ? "Salvar alterações" : "Criar tema"}</button></form>`;
  }

  function adminTreinamentos() {
    let temas = [];

    async function carregar() {
      const corpo = document.getElementById("tema-rows");
      if (!corpo) return;
      try {
        temas = await Services.treinamentos.listar();
        if (!document.contains(corpo)) return;
        corpo.innerHTML = temas.length ? temas.map(linha).join("")
          : `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Nenhum tema obrigatório ainda. Crie o primeiro e ligue as turmas no formulário do evento.</td></tr>`;
      } catch (err) {
        corpo.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar. ${esc(err.message || "")}</td></tr>`;
      }
    }

    function abrir(t) {
      App.openPanel(t ? "Editar tema obrigatório" : "Novo tema obrigatório", formulario(t));
      const form = document.getElementById("tema-form"), erro = document.getElementById("tema-erro");
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const corpo = {
          tema: document.getElementById("tema-nome").value.trim(),
          descricao: document.getElementById("tema-desc").value.trim() || null,
          setores_ids: [...form.querySelectorAll('[name="tema-setor"]:checked')].map((c) => Number(c.value)),
          perfis: [...form.querySelectorAll('[name="tema-perfil"]:checked')].map((c) => c.value),
        };
        const falha = !corpo.tema ? "Informe o tema." : !corpo.setores_ids.length && !corpo.perfis.length ? "Marque ao menos um setor ou um perfil." : "";
        if (falha) { erro.textContent = falha; erro.classList.remove("hidden"); return; }
        try {
          if (t) await Services.treinamentos.atualizar(t.id, corpo); else await Services.treinamentos.criar(corpo);
          App.closePanel(); App.toast(t ? "Tema atualizado" : "Tema criado"); carregar();
        } catch (err) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); }
      });
      document.getElementById("tema-nome").focus();
    }

    return {
      title: "Treinamentos obrigatórios",
      html: `
      <div class="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Gestão de eventos</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Treinamentos obrigatórios</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Defina quem precisa fazer cada treinamento. As turmas são criadas em Eventos (tipo Treinamento) e ligadas ao tema; a presença confirmada tira a pessoa da lista de pendentes.</p></div>
        <button type="button" id="tema-novo" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Novo tema</button>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <th class="py-3 pl-4">TEMA</th><th>PÚBLICO</th><th>TURMAS</th><th>SITUAÇÃO</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="tema-rows"><tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>`,
      init() {
        document.getElementById("tema-novo").addEventListener("click", () => abrir(null));
        document.getElementById("tema-rows").addEventListener("click", (ev) => {
          const b = ev.target.closest("button"); if (!b) return;
          const t = temas.find((x) => String(x.id) === (b.dataset.temaEditar || b.dataset.temaExcluir || b.dataset.temaReativar));
          if (!t) return;
          if (b.dataset.temaEditar) abrir(t);
          else if (b.dataset.temaReativar) Services.treinamentos.atualizar(t.id, { ativo: true }).then(() => { App.toast("Tema reativado"); carregar(); }).catch((err) => App.toast(err.message));
          else App.openConfirm(t.turmas ? "Desativar tema?" : "Excluir tema?",
            t.turmas ? "O tema tem turmas: ele será desativado e o histórico de presença fica guardado." : "O tema ainda não tem turmas e será excluído.",
            async () => { try { await Services.treinamentos.excluir(t.id); App.toast(t.turmas ? "Tema desativado" : "Tema excluído"); carregar(); } catch (err) { App.toast(err.message); } },
            t.turmas ? "Desativar" : "Excluir");
        });
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminTreinamentos });
})();
