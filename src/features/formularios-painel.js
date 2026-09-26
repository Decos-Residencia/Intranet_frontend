/* =========================================================================
   Formulários em painel
   Chamados (TI, evento adverso, geral), pedido de alteração cadastral e
   cadastro/edição de usuário.
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
      ${fld(tipo === "evento-adverso" ? "LOCAL DA OCORRÊNCIA" : "SETOR / LOCAL", `<input name="local" class="field-input" required placeholder="Ex: UTI Adulto, leito 12" value="${tipo === "evento-adverso" ? "" : UI.esc(DB.usuario.andar)}">`)}
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
  function openUsuarioPanel(id) {
    const u = id ? App.findItem("usuarios", id) : null;
    const setores = [...new Set([...DB.setores.map((s) => s.nome), ...state.usuarios.map((x) => x.setor)])];
    const papeis = ["leitura", "normal", "rh", "admin"];
    App.openPanel(u ? "Editar usuário" : "Novo usuário", `<form data-form="usuario" data-id="${u?.id || ""}" class="space-y-4">
      ${fld("NOME COMPLETO", `<input name="nome" class="field-input" required value="${UI.esc(u?.nome || "")}">`)}
      ${fld("E-MAIL CORPORATIVO", `<input name="email" type="email" class="field-input" required pattern=".+@decos\\.com" title="Use um e-mail @decos.com" value="${UI.esc(u?.email || "")}" placeholder="nome.sobrenome@decos.com">`)}
      ${fld("SETOR", `<select name="setor" class="field-input">${opts(setores, u?.setor)}</select>`)}
      ${fld("CARGO", `<input name="cargo" class="field-input" required value="${UI.esc(u?.cargo || "")}">`)}
      ${fld("PAPEL DE ACESSO", `<select name="role" class="field-input">${papeis.map((r) => `<option value="${r}" ${r === (u?.role || "normal") ? "selected" : ""}>${DB.roles[r].label}</option>`).join("")}</select>`)}
      ${fld("STATUS", `<select name="status" class="field-input">${opts(["Ativo", "Inativo"], u?.status || "Ativo")}</select>`)}
      <button type="submit" class="btn-crimson w-full py-3">${u ? "Salvar alterações" : "Cadastrar usuário"}</button>
    </form>`);
  }
  function submitPanelForm(f) {
    const v = Object.fromEntries(new FormData(f).entries());
    const kind = f.dataset.form;
    if (kind === "chamado") {
      const c = CHAMADOS[f.dataset.tipo] || CHAMADOS.geral;
      const protocolo = "#" + (f.dataset.tipo === "evento-adverso" ? "EA" : "CH") + Math.floor(100000 + Math.random() * 900000);
      state.chamados.unshift({ protocolo, tipo: c.titulo, categoria: v.categoria, local: v.local, prioridade: v.prioridade,
        descricao: v.descricao, anonimo: !!v.anonimo, quando: "Agora mesmo", status: "Aberto" });
      App.save(); App.closePanel(); App.toast(`${c.titulo} registrado — protocolo ${protocolo}`);
    } else if (kind === "pedido") {
      state.perfilPedidos.unshift({ campo: v.campo, valor: v.valor, motivo: v.motivo, quando: "Agora mesmo", status: "Em análise" });
      App.save(); App.closePanel(); App.toast("Solicitação enviada ao RH");
    } else if (kind === "usuario") {
      const dup = state.usuarios.find((x) => x.email.toLowerCase() === v.email.toLowerCase() && x.id !== f.dataset.id);
      if (dup) { App.toast("Já existe um usuário com esse e-mail"); return; }
      const verbo = App.upsert("usuarios", { ...(f.dataset.id ? { id: f.dataset.id } : {}), ...v });
      App.logAudit(verbo, `Usuário: ${v.nome} (${DB.roles[v.role].curto})`, "usuario");
      App.closePanel(); App.toast(verbo === "criou" ? "Usuário cadastrado" : "Usuário atualizado");
    }
    App.render();
  }

  Object.assign(App, { openChamadoPanel, openPedidoPanel, openUsuarioPanel, submitPanelForm });
})();
