/* =========================================================================
   Formulários em painel
   Locais (sem backend): chamados e pedido de alteração cadastral.
   Via API (ADMIN): usuário, setor e FAQ.
   ========================================================================= */
(function () {
  const { state } = App;

  /* ---------- formulários em painel (chamados, pedidos de perfil, usuários) ---------- */
  const CHAMADOS = {
    ti: { titulo: "Chamado de TI", intro: "Descreva o problema. A equipe de TI responde por ordem de prioridade.",
      cats: ["Computador / Impressora", "Sistemas (PEP, e-mail)", "Rede / Internet", "Acesso e senhas", "Outro"] },
    "evento-adverso": { titulo: "Reportar Evento Adverso", intro: "A notificação vai para o Núcleo de Segurança do Paciente. Relatar é cuidar: o objetivo é aprender, não punir.",
      cats: ["Queda de paciente", "Erro de medicação", "Lesão por pressão", "Falha de identificação", "Outro"], anonimo: true },
    geral: { titulo: "Abrir Chamado", intro: "Fale com o setor responsável. Você acompanha o andamento em Meu Perfil.",
      cats: ["Recursos Humanos", "Tecnologia da Informação", "Qualidade", "Administrativo", "Outro"] },
  };
  const opts = (arr, sel) => arr.map((v) => `<option ${v === sel ? "selected" : ""}>${UI.esc(v)}</option>`).join("");
  const fld = (label, html) => `<div><label class="field-label">${label}</label>${html}</div>`;
  function openChamadoPanel(tipo) {
    const c = CHAMADOS[tipo] || CHAMADOS.geral;
    App.openPanel(c.titulo, `<form data-form="chamado" data-tipo="${tipo}" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">${c.intro}</p>
      ${fld("CATEGORIA", `<select name="categoria" class="field-input">${opts(c.cats)}</select>`)}
      ${fld(tipo === "evento-adverso" ? "LOCAL DA OCORRÊNCIA" : "SETOR / LOCAL", `<input name="local" class="field-input" required placeholder="Ex: UTI Adulto, leito 12" value="">`)}
      ${fld("PRIORIDADE", `<select name="prioridade" class="field-input">${opts(["Baixa", "Média", "Alta"], "Média")}</select>`)}
      ${fld("DESCRIÇÃO", `<textarea name="descricao" class="field-input" rows="5" required minlength="10" placeholder="Conte o que aconteceu com o máximo de detalhes possível..."></textarea>`)}
      ${c.anonimo ? `<label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" name="anonimo" class="accent-[#8E1B2E]"> Enviar anonimamente</label>` : ""}
      <button type="submit" class="btn-wine w-full py-3">Enviar</button>
    </form>`);
  }
  function openPedidoPanel() {
    App.openPanel("Solicitar alteração cadastral", `<form data-form="pedido" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">Dados cadastrais são atualizados pelo RH. Envie o pedido e acompanhe em Meu Perfil.</p>
      ${fld("CAMPO", `<select name="campo" class="field-input">${opts(["Andar / Ala", "Ramal interno", "Cargo", "Setor", "Nome completo"])}</select>`)}
      ${fld("NOVO VALOR", `<input name="valor" class="field-input" required>`)}
      ${fld("MOTIVO", `<textarea name="motivo" class="field-input" rows="3" placeholder="Opcional"></textarea>`)}
      <button type="submit" class="btn-wine w-full py-3">Enviar solicitação</button>
    </form>`);
  }
  /* ---------- usuário (API: /auth/register e /usuarios/{id}) ---------- */
  function openUsuarioPanel(id) {
    const u = id ? App.findItem("usuarios", id) : null;
    if (id && !u) { App.toast("Usuário não encontrado"); return; }
    const setores = App.setoresAll();
    if (!setores.length) { App.toast("Cadastre um setor antes de criar ou editar usuários."); return; }
    const proprio = !!u && u.apiId === state.user.id; // não permite rebaixar/desativar a si mesmo
    const setorAtual = u ? u.setorId : setores[0].id;
    const setorOpts = setores.map((s) => `<option value="${s.id}" ${s.id === setorAtual ? "selected" : ""}>${UI.esc(s.nome)}</option>`).join("");
    const papelOpts = ["normal", "admin"].map((r) => `<option value="${r}" ${r === (u?.role || "normal") ? "selected" : ""}>${DB.roles[r].label}</option>`).join("");
    App.openPanel(u ? "Editar usuário" : "Novo usuário", `<form data-form="usuario" data-id="${UI.esc(u?.id || "")}" class="space-y-4" autocomplete="off">
      ${fld("NOME COMPLETO", `<input name="nome" class="field-input" required maxlength="150" value="${UI.esc(u?.nome || "")}">`)}
      ${fld("E-MAIL CORPORATIVO", `<input name="email" type="email" class="field-input" required maxlength="254" ${u ? "" : 'pattern=".+@decos\\.com" title="Use um e-mail @decos.com"'} value="${UI.esc(u?.email || "")}" placeholder="nome@decos.com">`)}
      ${fld("SETOR", `<select name="setor_id" class="field-input">${setorOpts}</select>`)}
      ${fld("CARGO", `<input name="cargo" class="field-input" required maxlength="150" value="${UI.esc(u?.cargo && u.cargo !== "—" ? u.cargo : "")}">`)}
      ${u ? "" : fld("SENHA INICIAL", `<input name="senha" type="password" class="field-input" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"><div class="field-hint">O novo usuário entra como Colaborador. Para torná-lo Administrador, edite-o depois.</div>`)}
      ${u ? fld("PAPEL DE ACESSO", `<select name="role" class="field-input" ${proprio ? "disabled" : ""}>${papelOpts}</select>${proprio ? `<div class="field-hint">Você não pode alterar o próprio papel.</div>` : ""}`) : ""}
      ${u ? fld("STATUS", `<select name="status" class="field-input" ${proprio ? "disabled" : ""}>${opts(["Ativo", "Inativo"], u.status)}</select>${proprio ? `<div class="field-hint">Você não pode desativar a própria conta.</div>` : ""}`) : ""}
      <button type="submit" class="btn-crimson w-full py-3">${u ? "Salvar alterações" : "Cadastrar usuário"}</button>
    </form>`);
  }

  async function submitUsuario(f, v) {
    const nome = (v.nome || "").trim(), email = (v.email || "").trim(), cargo = (v.cargo || "").trim();
    const setor_id = Number(v.setor_id);
    if (!f.dataset.id) {
      const senha = v.senha || "";
      if (senha.length < 8) { App.toast("A senha inicial deve ter pelo menos 8 caracteres."); return false; }
      if (new TextEncoder().encode(senha).length > 72) { App.toast("A senha inicial deve ter no máximo 72 bytes."); return false; }
      await Services.auth.register({ nome, email, senha, setor_id, cargo });
      if (f.elements.senha) f.elements.senha.value = ""; // a senha não fica no DOM nem em lugar nenhum
      App.logAudit("criou", `Usuário: ${nome} (COLABORADOR)`, "usuario");
      App.toast("Usuário cadastrado como Colaborador");
    } else {
      const u = App.findItem("usuarios", f.dataset.id);
      if (!u) { App.toast("Usuário não encontrado"); return false; }
      const payload = { nome, email, setor_id, cargo };
      if (u.apiId !== state.user.id) { // próprio papel/status ficam bloqueados na tela
        payload.perfil = v.role === "admin" ? "ADMIN" : "COLABORADOR";
        payload.ativo = v.status === "Ativo";
      }
      await Services.usuarios.update(u.apiId, payload);
      App.logAudit("editou", `Usuário: ${nome}`, "usuario");
      App.toast("Usuário atualizado");
    }
    return true;
  }

  /* ---------- setor (API: /setores) ---------- */
  function openSetorPanel(id) {
    const s = id ? App.setoresAll().find((x) => String(x.id) === String(id)) : null;
    if (id && !s) { App.toast("Setor não encontrado"); return; }
    App.openPanel(s ? "Editar setor" : "Novo setor", `<form data-form="setor" data-id="${UI.esc(s?.id || "")}" class="space-y-4" autocomplete="off">
      ${fld("NOME DO SETOR", `<input name="nome" class="field-input" required maxlength="150" value="${UI.esc(s?.nome || "")}">`)}
      ${fld("RAMAL", `<input name="ramal" class="field-input" maxlength="20" value="${UI.esc(s?.ramal || "")}" placeholder="Opcional">`)}
      <button type="submit" class="btn-crimson w-full py-3">${s ? "Salvar alterações" : "Criar setor"}</button>
    </form>`);
  }

  async function submitSetor(f, v) {
    const nome = (v.nome || "").trim(), ramal = (v.ramal || "").trim();
    if (!nome) { App.toast("Informe o nome do setor."); return false; }
    if (f.dataset.id) {
      await Services.setores.update(f.dataset.id, { nome, ramal: ramal || null });
      App.logAudit("editou", `Setor: ${nome}`, "setor");
      App.toast("Setor atualizado");
    } else {
      await Services.setores.create({ nome, ramal: ramal || null });
      App.logAudit("criou", `Setor: ${nome}`, "setor");
      App.toast("Setor criado");
    }
    return true;
  }

  /* ---------- FAQ (API: GET/POST /faqs; sem editar/excluir no backend) ---------- */
  function openFaqPanel() {
    const cats = [...new Set(App.faqsAll().map((f) => f.cat))].filter(Boolean);
    App.openPanel("Nova pergunta frequente", `<form data-form="faq" class="space-y-4" autocomplete="off">
      ${fld("PERGUNTA", `<input name="pergunta" class="field-input" required maxlength="500">`)}
      ${fld("RESPOSTA", `<textarea name="resposta" class="field-input" rows="6" required></textarea>`)}
      ${fld("CATEGORIA", `<input name="categoria" class="field-input" required maxlength="100" list="faq-cats" placeholder="Ex: rh, ti, financeiro"><datalist id="faq-cats">${cats.map((c) => `<option value="${UI.esc(c)}">`).join("")}</datalist>`)}
      <button type="submit" class="btn-crimson w-full py-3">Publicar pergunta</button>
    </form>`);
  }

  async function submitFaq(f, v) {
    const pergunta = (v.pergunta || "").trim(), resposta = (v.resposta || "").trim(), categoria = (v.categoria || "").trim();
    if (!pergunta || !resposta || !categoria) { App.toast("Preencha pergunta, resposta e categoria."); return false; }
    await Services.faq.create({ pergunta, resposta, categoria, ativo: true });
    App.logAudit("criou", `FAQ: ${pergunta}`, "faq");
    App.toast("Pergunta publicada");
    return true;
  }

  async function submitPanelForm(f) {
    const v = Object.fromEntries(new FormData(f).entries());
    const kind = f.dataset.form;
    if (kind === "chamado") {
      const c = CHAMADOS[f.dataset.tipo] || CHAMADOS.geral;
      const protocolo = "#" + (f.dataset.tipo === "evento-adverso" ? "EA" : "CH") + Math.floor(100000 + Math.random() * 900000);
      state.chamados.unshift({ protocolo, tipo: c.titulo, categoria: v.categoria, local: v.local, prioridade: v.prioridade,
        descricao: v.descricao, anonimo: !!v.anonimo, quando: "Agora mesmo", status: "Aberto" });
      App.save(); App.closePanel(); App.toast(`${c.titulo} registrado — protocolo ${protocolo}`);
      App.render();
      return;
    }
    if (kind === "pedido") {
      state.perfilPedidos.unshift({ campo: v.campo, valor: v.valor, motivo: v.motivo, quando: "Agora mesmo", status: "Em análise" });
      App.save(); App.closePanel(); App.toast("Solicitação enviada ao RH");
      App.render();
      return;
    }
    // Formulários que gravam na API: bloqueia o botão, mostra o erro e só fecha se der certo.
    const handlers = { usuario: submitUsuario, setor: submitSetor, faq: submitFaq };
    const handler = handlers[kind];
    if (!handler) return;
    const btn = f.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const ok = await handler(f, v);
      if (ok) { App.closePanel(); await App.loadApiData(); App.render(); }
    } catch (err) {
      App.toast(err.message || "Não foi possível salvar.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  Object.assign(App, { openChamadoPanel, openPedidoPanel, openUsuarioPanel, openSetorPanel, openFaqPanel, submitPanelForm });
})();
