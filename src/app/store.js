/* =========================================================================
   Store — estado global persistido, papéis/permissões e auditoria
   Estado salvo em localStorage + coleções derivadas (avisos, documentos,
   notificações) que juntam o mock com o que a gestão publicou.
   ========================================================================= */
(function () {
  const LS = "decos_intranet_state";
  const ROLE_ORDER = ["leitura", "normal", "rh", "admin"];
  const THEMES = {
    light: { label: "Claro", icon: "sun" },
    dark: { label: "Escuro", icon: "moon" },
    red: { label: "Vinho", icon: "wine" },
  };

  const state = Object.assign(
    { theme: "light", role: "normal", auth: false, sidebarCollapsed: false, myNoticias: [], myDocs: [], auditLog: [], readNotifs: [],
      inscricoes: [], parabens: [], chamados: [], perfilPedidos: [] },
    JSON.parse(localStorage.getItem(LS) || "{}")
  );
  // migra valores antigos (2 perfis -> 4 papéis)
  if (state.role === "user") state.role = "normal";
  if (state.role === "editor") state.role = "rh";
  if (!ROLE_ORDER.includes(state.role)) state.role = "normal";
  if (!THEMES[state.theme]) state.theme = "light";
  ["myNoticias", "myDocs", "auditLog", "readNotifs", "inscricoes", "parabens", "chamados", "perfilPedidos"].forEach((k) => { if (!Array.isArray(state[k])) state[k] = []; });
  // Coleções editáveis (notícias, documentos e usuários da gestão) vivem no
  // state a partir da primeira visita, semeadas do mock — assim criar, editar
  // e excluir persistem entre recarregamentos. myNoticias/myDocs são o formato
  // antigo (só o que o usuário criou) e entram na semente como "próprios".
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  if (!Array.isArray(state.noticias)) state.noticias = [...state.myNoticias.map((n) => ({ ...n, own: true })), ...DB.adminNoticias].map((n) => ({ id: uid(), ...n }));
  if (!Array.isArray(state.docsAdm)) state.docsAdm = [...state.myDocs.map((d) => ({ ...d, own: true })), ...DB.adminDocumentos].map((d) => ({ id: uid(), ...d }));
  // readNotifs antigo guardava a posição (0..6); converte para os ids atuais.
  state.readNotifs = state.readNotifs.map((x) => typeof x === "number" ? "n" + (x + 1) : x);
  if (!Array.isArray(state.usuarios)) state.usuarios = DB.usuariosAdmin.map((u) => ({ id: uid(), ...u }));
  // cenário "hoje é meu aniversário" — parte do painel de perfil, não da
  // permissão de papel; começa alinhado ao mock (DB.usuario.diaAniversario)
  // mas pode ser alternado manualmente para demonstrar as duas telas.
  if (typeof state.aniversarianteHoje !== "boolean") state.aniversarianteHoje = DB.usuario.diaAniversario === DB.hojeDia;

  function save() { localStorage.setItem(LS, JSON.stringify(state)); }

  /* ---------- permissões ---------- */
  function can(cap) { return (DB.roles[state.role]?.caps || []).includes(cap); }
  function roleInfo() { return DB.roles[state.role]; }

  /* ---------- auditoria ---------- */
  function logAudit(acao, alvo, tipo) {
    state.auditLog.unshift({ quando: "Agora mesmo", autor: DB.usuario.nome, autorRole: state.role, acao, alvo, tipo });
    App.save();
  }
  // Insere (sem id) ou substitui (com id) um item de uma coleção do state.
  function upsert(coll, obj) {
    const list = state[coll], i = obj.id ? list.findIndex((x) => x.id === obj.id) : -1;
    if (i >= 0) list[i] = { ...list[i], ...obj }; else list.unshift({ ...obj, id: obj.id || uid() });
    App.save();
    return i >= 0 ? "editou" : "criou";
  }
  function removeItem(coll, id) { state[coll] = state[coll].filter((x) => x.id !== id); App.save(); }
  function findItem(coll, id) { return state[coll].find((x) => x.id === id); }
  const acaoAudit = (status, verbo) => status === "Rascunho" ? "salvou rascunho" : status === "Agendado" ? "agendou" : verbo === "editou" ? "editou" : "publicou";
  function saveNoticia(obj) { const v = App.upsert("noticias", obj); App.logAudit(acaoAudit(obj.status, v), "Notícia: " + obj.titulo, "noticia"); }
  function saveDocumento(obj) { const v = App.upsert("docsAdm", obj); App.logAudit(acaoAudit(obj.status, v), "Documento: " + obj.titulo, "documento"); }

  /* ---------- conteúdo publicado pela gestão aparece para todos ---------- */
  const CAT_DE_TIPO = { "Comunicado": "comunicado", "Evento": "evento", "Promoção": "promocao", "Notícia": "noticia" };
  function noticiaParaAviso(n) {
    const cat = CAT_DE_TIPO[n.tipo] || "comunicado";
    const corpo = (n.corpo || "").trim();
    return {
      id: n.id, own: true, categoria: n.prioridade === "urgente" ? "urgente" : cat, extra: n.prioridade === "urgente" ? cat : undefined,
      titulo: n.titulo, resumo: corpo.length > 180 ? corpo.slice(0, 180) + "…" : corpo || "Sem conteúdo.",
      data: n.quando, dataCurta: n.quando, autor: n.autor, autorSigla: UI.iniciais(n.autor), imagem: n.imagem,
      cta: "Ler comunicado na íntegra", conteudo: corpo ? corpo.split(/\n+/) : ["Sem conteúdo."], tags: [],
    };
  }
  function avisosAll() {
    return [...state.noticias.filter((n) => n.own && n.status === "Publicado").map(noticiaParaAviso), ...DB.avisos];
  }
  function docParaPublico(d) {
    return {
      id: d.id, own: true, tipo: d.tipo, cor: d.cor, titulo: d.titulo, data: d.quando, desc: d.desc || "Documento publicado pela gestão.",
      tamanho: d.tamanho, download: d.permissao === "download", icone: /\.docx?$/i.test(d.arquivo || "") ? "W" : undefined,
      arquivo: d.arquivo || d.titulo + ".pdf", versao: d.versao || "1.0", criadoPor: d.autor, setor: d.setor || "—", atualizado: d.quando,
    };
  }
  function documentosAll() {
    return [...state.docsAdm.filter((d) => d.own && d.status === "Publicado").map(docParaPublico), ...DB.documentos];
  }
  // Notícia urgente publicada pela gestão vira notificação urgente para todos.
  function notificacoesAll() {
    const urgentes = state.noticias.filter((n) => n.own && n.status === "Publicado" && n.prioridade === "urgente").map((n) => ({
      id: "nt-" + n.id, rota: `#/avisos/${n.id}`, tipo: "urgente", urgente: true, icone: "alert-triangle",
      titulo: n.titulo, texto: (n.corpo || "").slice(0, 160), tempo: n.quando, lida: false,
    }));
    return [...urgentes, ...DB.notificacoes];
  }
  const isLida = (n) => n.lida || state.readNotifs.includes(n.id);
  function marcarLida(id) { if (id && !state.readNotifs.includes(id)) { state.readNotifs.push(id); App.save(); } }
  function unreadCount() { return App.notificacoesAll().filter((n) => !App.isLida(n)).length; }
  function unreadUrgent() { return App.notificacoesAll().filter((n) => n.urgente && !App.isLida(n)).length; }

  Object.assign(App, { ROLE_ORDER, THEMES, state, save, can, roleInfo, logAudit, upsert, removeItem, findItem, saveNoticia, saveDocumento, avisosAll, documentosAll, notificacoesAll, isLida, marcarLida, unreadCount, unreadUrgent });
})();
