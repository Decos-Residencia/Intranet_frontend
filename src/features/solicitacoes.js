/* =========================================================================
   Solicitações cadastrais e parabéns (ações com API)
   - Colaborador: "Solicitar alteração" (um campo por pedido) → POST /solicitacoes-cadastrais.
   - ADMIN: aprovar / rejeitar (a aprovação atualiza o cadastro no servidor, na mesma transação).
   - Parabéns: POST /parabens (uma vez por pessoa e ano; gera notificação real para o aniversariante).
   ========================================================================= */
(function () {
  const { state } = App;
  const esc = (v) => UI.esc(v);
  const fld = (label, html) => `<div><label class="field-label">${label}</label>${html}</div>`;

  // Lista fechada de campos que podem ser pedidos (o backend repete essa validação).
  const CAMPOS = [
    { value: "nome", label: "Nome completo", tipo: "text", max: 150 },
    { value: "email", label: "E-mail", tipo: "email", max: 254 },
    { value: "cargo", label: "Cargo", tipo: "text", max: 150 },
    { value: "setor", label: "Setor", tipo: "setor" },
    { value: "ramal", label: "Ramal interno", tipo: "text", max: 20 },
    { value: "matricula", label: "Matrícula", tipo: "text", max: 30 },
    { value: "unidade", label: "Unidade", tipo: "text", max: 100 },
    { value: "andar", label: "Andar / Ala", tipo: "text", max: 40 },
    { value: "data_nascimento", label: "Data de nascimento", tipo: "date" },
    { value: "data_admissao", label: "Data de admissão", tipo: "date" },
  ];
  const campoInfo = (c) => CAMPOS.find((x) => x.value === c) || { label: c, tipo: "text" };
  const STATUS = {
    PENDENTE: { label: "Em análise", tone: "amber" },
    APROVADA: { label: "Aprovada", tone: "green" },
    REJEITADA: { label: "Rejeitada", tone: "red" },
  };
  const dataBr = (iso) => (iso ? String(iso).split("-").reverse().join("/") : "—");
  const valorExibido = (campo, valor) => (valor == null || valor === "" ? "—" : campoInfo(campo).tipo === "date" ? dataBr(valor) : valor);

  function entradaDoCampo(campo) {
    const info = campoInfo(campo);
    if (info.tipo === "setor") {
      const opts = App.setoresAll().filter((s) => s.id !== state.user.setor_id)
        .map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("");
      return fld("NOVO SETOR", `<select name="setor_id" class="field-input" required><option value="">Selecione…</option>${opts}</select>`);
    }
    const tipo = info.tipo === "date" ? `type="date" max="${new Date().toISOString().slice(0, 10)}"` : info.tipo === "email" ? 'type="email"' : 'type="text"';
    return fld("NOVO VALOR", `<input name="valor" class="field-input" required ${tipo} ${info.max ? `maxlength="${info.max}"` : ""}>`);
  }

  function openPedidoPanel() {
    const pendentes = new Set(state.api.solicitacoes.filter((s) => s.status === "PENDENTE").map((s) => s.campo));
    const opts = CAMPOS.map((c) => `<option value="${c.value}" ${pendentes.has(c.value) ? "disabled" : ""}>${esc(c.label)}${pendentes.has(c.value) ? " (já há pedido em análise)" : ""}</option>`).join("");
    const primeiro = CAMPOS.find((c) => !pendentes.has(c.value));
    if (!primeiro) { App.toast("Todos os campos já têm um pedido em análise."); return; }
    App.openPanel("Solicitar alteração cadastral", `<form data-form="pedido" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">Cada pedido altera <b>um campo</b>. O RH/administrador analisa; se aprovar, seu cadastro é atualizado e você recebe uma notificação.</p>
      ${fld("CAMPO", `<select name="campo" class="field-input">${opts}</select>`)}
      <div id="pedido-valor">${entradaDoCampo(primeiro.value)}</div>
      ${fld("JUSTIFICATIVA", `<textarea name="justificativa" class="field-input" rows="3" maxlength="500" placeholder="Opcional"></textarea>`)}
      <button type="submit" class="btn-wine w-full py-3">Enviar solicitação</button>
    </form>`);
    const sel = document.querySelector('#side-panel select[name="campo"]');
    if (sel) {
      sel.value = primeiro.value;
      sel.addEventListener("change", () => { document.getElementById("pedido-valor").innerHTML = entradaDoCampo(sel.value); });
    }
  }

  async function submitPedido(f, v) {
    const campo = v.campo;
    const body = { campo };
    if (campoInfo(campo).tipo === "setor") {
      if (!v.setor_id) { App.toast("Selecione o novo setor."); return false; }
      body.setor_id = Number(v.setor_id);
    } else {
      const valor = (v.valor || "").trim();
      if (!valor) { App.toast("Informe o novo valor."); return false; }
      body.valor = valor;
    }
    const just = (v.justificativa || "").trim();
    if (just) body.justificativa = just;
    await Services.cadastro.criar(body);
    App.toast("Solicitação enviada ao RH");
    return true;
  }

  /* ---------- ADMIN: decisão ---------- */
  function aprovarSolicitacao(el) {
    const { id, nome, campo } = el.dataset;
    App.openConfirm("Aprovar solicitação?", `A alteração de <b>${esc(campoInfo(campo).label)}</b> de <b>${esc(nome)}</b> será aplicada ao cadastro agora.`, async () => {
      try {
        await Services.cadastro.aprovar(id);
        App.toast("Solicitação aprovada e cadastro atualizado");
      } catch (err) { App.toast(err.message || "Não foi possível aprovar."); }
      await App.loadApiData(); App.render();
    }, "Sim, aprovar", "btn-wine");
  }

  function openRejeitarPanel(el) {
    const { id, nome, campo } = el.dataset;
    App.openPanel("Rejeitar solicitação", `<form data-form="rejeitar" data-id="${esc(id)}" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">Pedido de <b>${esc(nome)}</b> para alterar <b>${esc(campoInfo(campo).label)}</b>. O colaborador será notificado com o motivo.</p>
      ${fld("MOTIVO DA REJEIÇÃO", `<textarea name="observacao" class="field-input" rows="4" required maxlength="500" placeholder="Explique o motivo"></textarea>`)}
      <button type="submit" class="btn-crimson w-full py-3">Rejeitar solicitação</button>
    </form>`);
  }

  async function submitRejeicao(f, v) {
    const motivo = (v.observacao || "").trim();
    if (!motivo) { App.toast("Informe o motivo da rejeição."); return false; }
    await Services.cadastro.rejeitar(f.dataset.id, motivo);
    App.toast("Solicitação rejeitada");
    return true;
  }

  /* ---------- parabéns ---------- */
  async function enviarParabens(el) {
    const id = Number(el.dataset.id), nome = el.dataset.nome || "colega";
    let enviado = false;
    el.disabled = true;
    try {
      await App.parabenizar(id);
      enviado = true;
      App.confettiBurst(el);
      App.toast(`🎉 Parabéns enviado para ${nome}!`);
    } catch (err) {
      if (err.status === 409) { App.marcarParabenizado(id); enviado = true; } // já enviado antes: só reflete o estado
      App.toast(err.message || "Não foi possível enviar os parabéns.");
    }
    if (enviado) el.innerHTML = UI.icon("check", "w-4 h-4") + " Parabéns enviado";
    else el.disabled = false;
  }

  Object.assign(App, {
    openPedidoPanel, submitPedido, aprovarSolicitacao, openRejeitarPanel, submitRejeicao, enviarParabens,
    solicitacaoCampos: CAMPOS, solicitacaoCampoInfo: campoInfo, solicitacaoStatus: STATUS, solicitacaoValor: valorExibido, dataBr,
  });
})();
