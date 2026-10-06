/* =========================================================================
   Formulários em painel
   Via API: chamado, usuário, setor, FAQ (ADMIN) e pedido de alteração cadastral (ver solicitacoes.js).
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
      ${c.anonimo ? `<label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" name="anonimo" class="accent-[#8E1B2E]"> Enviar anonimamente</label>
      <p class="text-xs text-slate-400 -mt-2">Anônimo: ninguém é ligado ao relato (nem o administrador) e você não poderá acompanhá-lo; guarde o protocolo.</p>` : ""}
      <button type="submit" class="btn-wine w-full py-3">Enviar</button>
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
      ${fld("E-MAIL", `<input name="email" type="email" class="field-input" required maxlength="254" value="${UI.esc(u?.email || "")}" placeholder="nome@email.com">`)}
      ${fld("SETOR", `<select name="setor_id" class="field-input">${setorOpts}</select>`)}
      ${fld("CARGO", `<input name="cargo" class="field-input" required maxlength="150" value="${UI.esc(u?.cargo && u.cargo !== "—" ? u.cargo : "")}">`)}
      ${fld("RAMAL", `<input name="ramal" class="field-input" maxlength="20" value="${UI.esc(u?.ramal || "")}" placeholder="Ex: 2210">`)}
      ${fld("MATRÍCULA", `<input name="matricula" class="field-input" maxlength="30" value="${UI.esc(u?.matricula || "")}" placeholder="Opcional (única por pessoa)">`)}
      ${fld("UNIDADE", `<input name="unidade" class="field-input" maxlength="100" value="${UI.esc(u?.unidade || "")}" placeholder="Ex: Unidade Central">`)}
      ${fld("ANDAR / ALA", `<input name="andar" class="field-input" maxlength="40" value="${UI.esc(u?.andar || "")}" placeholder="Ex: 3º andar">`)}
      ${fld("DATA DE ADMISSÃO", `<input name="admissao" type="date" class="field-input" max="${new Date().toISOString().slice(0, 10)}" value="${UI.esc(u?.admissao || "")}">`)}
      ${fld("DATA DE NASCIMENTO", `<input name="nascimento" type="date" class="field-input" max="${new Date().toISOString().slice(0, 10)}" value="${UI.esc(u?.nascimento || "")}"><div class="field-hint">Opcional. Usada nos aniversariantes (a intranet mostra só dia e mês).</div>`)}
      ${u ? "" : fld("SENHA INICIAL", `<input name="senha" type="password" class="field-input" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"><div class="field-hint">A senha é temporária: o novo usuário entra como Colaborador e precisará criar a própria senha no primeiro acesso. Para torná-lo Administrador, edite-o depois.</div>`)}
      ${u ? fld("PAPEL DE ACESSO", `<select name="role" class="field-input" ${proprio ? "disabled" : ""}>${papelOpts}</select>${proprio ? `<div class="field-hint">Você não pode alterar o próprio papel.</div>` : ""}`) : ""}
      ${u ? fld("STATUS", `<select name="status" class="field-input" ${proprio ? "disabled" : ""}>${opts(["Ativo", "Inativo"], u.status)}</select>${proprio ? `<div class="field-hint">Você não pode desativar a própria conta.</div>` : ""}`) : ""}
      <button type="submit" class="btn-crimson w-full py-3">${u ? "Salvar alterações" : "Cadastrar usuário"}</button>
    </form>`);
  }

  async function submitUsuario(f, v) {
    const nome = (v.nome || "").trim(), email = (v.email || "").trim(), cargo = (v.cargo || "").trim(), ramal = (v.ramal || "").trim();
    const setor_id = Number(v.setor_id);
    const extras = {
      matricula: (v.matricula || "").trim() || null, unidade: (v.unidade || "").trim() || null,
      andar: (v.andar || "").trim() || null, data_admissao: v.admissao || null,
    };
    if (!f.dataset.id) {
      const senha = v.senha || "";
      if (senha.length < 8) { App.toast("A senha inicial deve ter pelo menos 8 caracteres."); return false; }
      if (new TextEncoder().encode(senha).length > 72) { App.toast("A senha inicial deve ter no máximo 72 bytes."); return false; }
      const body = { nome, email, senha, setor_id, cargo, ramal: ramal || null };
      Object.entries(extras).forEach(([k, val]) => { if (val) body[k] = val; });
      if (v.nascimento) body.data_nascimento = v.nascimento;
      await Services.auth.register(body);
      if (f.elements.senha) f.elements.senha.value = ""; // a senha não fica no DOM nem em lugar nenhum
      App.toast("Usuário cadastrado como Colaborador");
    } else {
      const u = App.findItem("usuarios", f.dataset.id);
      if (!u) { App.toast("Usuário não encontrado"); return false; }
      const payload = { nome, email, setor_id, cargo, ramal: ramal || null, ...extras, data_nascimento: v.nascimento || null };
      if (u.apiId !== state.user.id) { // próprio papel/status ficam bloqueados na tela
        payload.perfil = v.role === "admin" ? "ADMIN" : "COLABORADOR";
        payload.ativo = v.status === "Ativo";
      }
      await Services.usuarios.update(u.apiId, payload);
      App.toast("Usuário atualizado");
    }
    return true;
  }

  /* ---------- redefinir senha de um usuário (API: PUT /usuarios/{id} com `senha`) ---------- */
  // A senha atual não existe em texto (só o hash bcrypt), então nada é exibido: o ADMIN define uma
  // nova e a informa ao colaborador. A senha não é guardada em lugar nenhum nem aparece na resposta.
  function openSenhaPanel(id) {
    const u = id ? App.findItem("usuarios", id) : null;
    if (!u) { App.toast("Usuário não encontrado"); return; }
    App.openPanel("Redefinir senha", `<form data-form="senha" data-id="${UI.esc(u.id)}" class="space-y-4" autocomplete="off">
      <p class="text-sm text-slate-500 dark:text-slate-400">Defina uma nova senha para <b>${UI.esc(u.nome)}</b> (${UI.esc(u.email)}). A senha atual não pode ser exibida. A nova senha será <b>temporária</b>: informe-a ao colaborador, que precisará definir a própria senha no próximo acesso. As sessões abertas dele serão encerradas.</p>
      ${fld("NOVA SENHA", `<input name="senha" type="password" class="field-input" required minlength="8" maxlength="72" autocomplete="new-password" placeholder="Mínimo de 8 caracteres">`)}
      ${fld("CONFIRMAR NOVA SENHA", `<input name="confirmacao" type="password" class="field-input" required minlength="8" maxlength="72" autocomplete="new-password">`)}
      <button type="submit" class="btn-crimson w-full py-3">Redefinir senha</button>
    </form>`);
  }

  async function submitSenha(f, v) {
    const u = App.findItem("usuarios", f.dataset.id);
    if (!u) { App.toast("Usuário não encontrado"); return false; }
    const senha = v.senha || "";
    if (senha.length < 8) { App.toast("A nova senha deve ter pelo menos 8 caracteres."); return false; }
    if (new TextEncoder().encode(senha).length > 72) { App.toast("A nova senha deve ter no máximo 72 bytes."); return false; }
    if (senha !== v.confirmacao) { App.toast("A confirmação não confere com a nova senha."); return false; }
    await Services.usuarios.update(u.apiId, { senha });
    f.elements.senha.value = ""; f.elements.confirmacao.value = ""; // não fica no DOM
    App.toast("Senha temporária definida. O colaborador deverá criar uma nova senha no próximo acesso.");
    return true;
  }

  /* ---------- setor (API: /setores) ---------- */
  function openSetorPanel(id) {
    const s = id ? App.setoresAll().find((x) => String(x.id) === String(id)) : null;
    if (id && !s) { App.toast("Setor não encontrado"); return; }
    App.openPanel(s ? "Editar setor" : "Novo setor", `<form data-form="setor" data-id="${UI.esc(s?.id || "")}" class="space-y-4" autocomplete="off">
      ${fld("NOME DO SETOR", `<input name="nome" class="field-input" required maxlength="150" value="${UI.esc(s?.nome || "")}">`)}
      ${fld("RAMAL", `<input name="ramal" class="field-input" required maxlength="20" value="${UI.esc(s?.ramal || "")}" placeholder="Ex: 2210">`)}
      <button type="submit" class="btn-crimson w-full py-3">${s ? "Salvar alterações" : "Criar setor"}</button>
    </form>`);
  }

  async function submitSetor(f, v) {
    const nome = (v.nome || "").trim(), ramal = (v.ramal || "").trim();
    if (!nome) { App.toast("Informe o nome do setor."); return false; }
    if (!ramal) { App.toast("Informe o ramal do setor."); return false; }
    if (f.dataset.id) {
      await Services.setores.update(f.dataset.id, { nome, ramal });
      App.toast("Setor atualizado");
    } else {
      await Services.setores.create({ nome, ramal });
      App.toast("Setor criado");
    }
    return true;
  }

  /* ---------- FAQ (API: GET/POST/PUT/DELETE /faqs, só ADMIN) ---------- */
  async function openFaqPanel(id) {
    let faq = null;
    if (id) {
      try { faq = await Services.faq.get(id); }
      catch (err) { App.toast(err.message || "Pergunta não encontrada."); return; }
    }
    let cats = [...new Set(App.faqsAll().map((f) => f.cat))];
    try { cats = (await Services.faq.resumo()).categorias.map((c) => c.categoria); } catch (_) { /* usa as categorias já carregadas */ }
    cats = cats.filter(Boolean);
    App.openPanel(faq ? "Editar pergunta frequente" : "Nova pergunta frequente", `<form data-form="faq" data-id="${UI.esc(faq?.id || "")}" class="space-y-4" autocomplete="off">
      ${fld("PERGUNTA", `<input name="pergunta" class="field-input" required maxlength="500" value="${UI.esc(faq?.pergunta || "")}">`)}
      ${fld("RESPOSTA", `<textarea name="resposta" class="field-input" rows="6" required>${UI.esc(faq?.resposta || "")}</textarea>`)}
      ${fld("CATEGORIA", `<input name="categoria" class="field-input" required maxlength="100" list="faq-cats" value="${UI.esc(faq?.categoria || "")}" placeholder="Ex: rh, ti, financeiro"><datalist id="faq-cats">${cats.map((c) => `<option value="${UI.esc(c)}">`).join("")}</datalist>`)}
      ${fld("STATUS", `<select name="status" class="field-input"><option value="ativa" ${faq?.ativo === false ? "" : "selected"}>Ativa (visível aos colaboradores)</option><option value="inativa" ${faq?.ativo === false ? "selected" : ""}>Inativa (escondida)</option></select>`)}
      <button type="submit" class="btn-crimson w-full py-3">${faq ? "Salvar alterações" : "Publicar pergunta"}</button>
    </form>`);
  }

  async function submitFaq(f, v) {
    const pergunta = (v.pergunta || "").trim(), resposta = (v.resposta || "").trim(), categoria = (v.categoria || "").trim();
    if (!pergunta || !resposta || !categoria) { App.toast("Preencha pergunta, resposta e categoria."); return false; }
    const ativo = v.status !== "inativa";
    if (f.dataset.id) {
      await Services.faq.update(f.dataset.id, { pergunta, resposta, categoria, ativo });
      App.toast("Pergunta atualizada");
    } else {
      await Services.faq.create({ pergunta, resposta, categoria, ativo });
      App.toast(ativo ? "Pergunta publicada" : "Pergunta salva como inativa");
    }
    return true;
  }

  const TIPO_API = { ti: "TI", "evento-adverso": "EVENTO_ADVERSO", geral: "GERAL" };
  const PRIO_API = { Baixa: "BAIXA", "Média": "MEDIA", Alta: "ALTA" };
  async function submitChamado(f, v) {
    const c = CHAMADOS[f.dataset.tipo] || CHAMADOS.geral;
    const anonimo = !!v.anonimo;
    const r = await Services.chamados.create({
      tipo: TIPO_API[f.dataset.tipo] || "GERAL", categoria: v.categoria, local: v.local.trim(),
      prioridade: PRIO_API[v.prioridade] || "MEDIA", descricao: v.descricao.trim(), anonimo,
    });
    App.toast(anonimo ? `${c.titulo} enviado anonimamente — protocolo ${r.protocolo} (guarde-o: não aparece no seu perfil)` : `${c.titulo} registrado — protocolo ${r.protocolo}`);
    return true;
  }

  async function submitPanelForm(f) {
    const v = Object.fromEntries(new FormData(f).entries());
    const kind = f.dataset.form;
    // Formulários que gravam na API: bloqueia o botão, mostra o erro e só fecha se der certo.
    const handlers = {
      usuario: submitUsuario, senha: submitSenha, setor: submitSetor, faq: submitFaq, chamado: submitChamado,
      "chamado-admin": (form, vals) => PagesAdmin.submitChamadoAdmin(form, vals),
      avaliacao: (form, vals) => PagesAdmin.submitAvaliacao(form, vals),
      "avaliacao-resposta": (form, vals) => PagesAvaliacoes.submitResposta(form, vals),
      pedido: (form, vals) => App.submitPedido(form, vals), rejeitar: (form, vals) => App.submitRejeicao(form, vals),
    };
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

  Object.assign(App, { openChamadoPanel, openUsuarioPanel, openSenhaPanel, openSetorPanel, openFaqPanel, submitPanelForm });
})();
