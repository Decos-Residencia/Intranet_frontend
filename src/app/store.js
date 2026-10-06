/* =========================================================================
   Store — estado global, sessão, papéis/permissões e dados da API
   Duas famílias de dados, nunca misturadas:
   • PERSISTIDO (localStorage, decos_intranet_state): só preferências visuais do
     aparelho (tema e menu recolhido). Nenhum dado de negócio.
   • EM MEMÓRIA: sessão (usuário, papel) e tudo que vem da API. Nada disso é
     gravado no navegador; o JWT fica à parte, em decos_intranet_token (api.js).
   O papel da interface vem exclusivamente de GET /auth/me → user.perfil.
   ========================================================================= */
(function () {
  const LS = "decos_intranet_state";
  const ROLE_ORDER = ["normal", "admin"];
  const PERFIL_ROLE = { ADMIN: "admin", COLABORADOR: "normal" };
  const THEMES = {
    light: { label: "Claro", icon: "sun" },
    dark: { label: "Escuro", icon: "moon" },
    red: { label: "Vinho", icon: "wine" },
  };

  // Única lista do que pode ir para o localStorage.
  const PERSISTED = ["theme", "sidebarCollapsed"];

  const emptyApi = () => ({ avisos: [], documentos: [], faqs: [], usuarios: [], usuariosRaw: [], usuariosTodos: [], setores: [], loaded: false,
    aniversariantes: [], aniversariantesHoje: [], aniversariantesProximos: [], solicitacoes: [], solicitacoesPendentes: 0,
    eventosProximos: [], minhasInscricoes: [], chamados: [], chamadosPendentes: 0, avaliacoesPendentes: 0 });

  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (_) { stored = {}; }

  const state = {
    theme: "light", sidebarCollapsed: false,
    // ---- somente em memória ----
    ready: false, auth: false, user: null, loadError: null,
    api: emptyApi(), usuarios: [],
    notificacoes: [], naoLidas: 0,
  };
  PERSISTED.forEach((k) => { if (k in stored) state[k] = stored[k]; });
  if (!THEMES[state.theme]) state.theme = "light";
  state.sidebarCollapsed = !!state.sidebarCollapsed;

  function save() {
    const out = {};
    PERSISTED.forEach((k) => { out[k] = state[k]; });
    try { localStorage.setItem(LS, JSON.stringify(out)); } catch (_) { /* armazenamento indisponível */ }
  }
  save(); // regrava só a lista branca: descarta chaves legadas (token, user, role, api, noticias...)

  /* ---------- papel e permissões (derivados do usuário real) ---------- */
  function role() { return PERFIL_ROLE[state.user?.perfil] || null; }
  // Somente leitura: não existe mais como "preferência" que alguém possa gravar.
  Object.defineProperty(state, "role", { get: role, enumerable: false });
  function can(cap) { const r = role(); return !!r && (DB.roles[r]?.caps || []).includes(cap); }
  function roleInfo() { return DB.roles[role()] || DB.roles.normal; }

  /* ---------- sessão ---------- */
  function resetServerData() {
    state.api = emptyApi();
    state.usuarios = [];
    state.notificacoes = [];
    state.naoLidas = 0;
  }

  function setSession(user) {
    state.auth = true;
    state.user = user;
    save();
  }

  // Remove JWT, usuário, papel e todo cache vindo do servidor. Preferências
  // (tema, menu) e funcionalidades locais permanecem.
  function clearSession() {
    App.API.clearToken();
    stopNotifPolling();
    state.auth = false;
    state.user = null;
    state.loadError = null;
    resetServerData();
    save();
  }

  let expiring = false;
  function expireSession(message) {
    if (expiring || (!state.auth && !App.API.getToken())) return;
    expiring = true;
    try {
      clearSession();
      App.closePanel?.(); App.closeModal?.();
      App.toast?.(message || "Sessão expirada. Faça login novamente.");
      if (location.hash !== "#/login") location.hash = "#/login"; // dispara render
      else App.render();
    } finally { expiring = false; }
  }

  // Valida o token com GET /auth/me e carrega os dados. Lança ApiError se falhar.
  async function startSession(accessToken) {
    App.API.setToken(accessToken);
    let user;
    try { user = await Services.auth.me(); }
    catch (err) { App.API.clearToken(); throw err; }
    App.setSession(user);
    await loadApiData();
    return user;
  }

  async function restoreSession() {
    state.ready = false;
    state.loadError = null;
    const token = App.API.getToken();
    if (!token) {
      clearSession();
      App.API.wake(); // acorda o backend enquanto o usuário digita as credenciais
    } else {
      try {
        const user = await Services.auth.me();
        App.setSession(user);
        await loadApiData();
      } catch (err) {
        if (err.status === 401) { clearSession(); }       // token inválido/expirado
        else { state.loadError = err.message; }           // API fora do ar: mantém o token
      }
    }
    state.ready = true;
    // Se o hash vai mudar, o evento hashchange já renderiza (evita renderizar duas vezes).
    const alvo = state.loadError ? null : !state.auth ? "#/login" : (!location.hash || location.hash === "#/login") ? "#/dashboard" : null;
    if (alvo && location.hash !== alvo) { location.hash = alvo; return; }
    App.render();
  }

  function logout() {
    clearSession();
    App.closePanel?.(); App.closeModal?.();
    App.go("#/login");
  }

  /* ---------- auditoria: gravada pelo backend (GET /auditoria, só ADMIN) ---------- */
  function removeItem(coll, id) { state[coll] = state[coll].filter((x) => x.id !== id); }
  function findItem(coll, id) { return state[coll].find((x) => x.id === id); }
  async function deleteRemoteItem(coll, id) {
    const item = coll && id ? App.findItem(coll, id) : null;
    if (!item?.apiId) return;
  }

  /* ---------- API → formato das telas ---------- */
  const fmtCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  const fmtLonga = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const fmtHora = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  function fmt(formatter, value, vazio = "—") {
    if (!value) return vazio;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? vazio : formatter.format(d);
  }

  const TIPO_DE_CATEGORIA = { comunicado: "Comunicado", evento: "Evento", promocao: "Promoção", noticia: "Notícia", urgente: "Comunicado" };

  // Resolve o autor de um aviso mesmo que a pessoa tenha sido desativada depois.
  function nomeDoUsuario(id) {
    return state.api.usuariosTodos.find((u) => u.id === id)?.nome || null;
  }

  function apiAvisoParaCard(a) {
    const categoria = DB.categorias[a.categoria] ? a.categoria : "comunicado";
    const conteudo = (a.conteudo || "").trim();
    // O backend só devolve autor_id: resolve pelo diretório; sem isso, texto neutro.
    const autor = nomeDoUsuario(a.autor_id) || "Autor não identificado";
    return {
      id: String(a.id), apiId: a.id, source: "api", own: true, categoria, lido: !!a.lido,
      titulo: a.titulo, resumo: conteudo.length > 180 ? conteudo.slice(0, 180) + "…" : conteudo || "Sem conteúdo.",
      data: fmt(fmtLonga, a.data_publicacao), dataCurta: fmt(fmtCurta, a.data_publicacao),
      autor, autorSigla: nomeDoUsuario(a.autor_id) ? UI.iniciais(autor) : "?", imagem: "",
      cta: "Ler comunicado na íntegra", conteudo: conteudo ? conteudo.split(/\n+/) : ["Sem conteúdo."], tags: [],
    };
  }

  const fmtBytes = (n) => {
    if (!Number.isFinite(n)) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  };
  const extDoArquivo = (nome) => ((String(nome || "").split(".").pop() || "").toLowerCase());

  // Metadados reais do documento (GET /documentos). Nada aqui é fictício: o arquivo fica no
  // Storage privado e só é acessado por URL assinada (Services.documentos.download).
  function apiDocumentoParaView(d) {
    const tipo = (d.categoria || "").trim();
    const def = (window.AdminUI?.TIPOS_DOC || []).find((t) => t.value.toLowerCase() === tipo.toLowerCase());
    return {
      id: String(d.id), apiId: d.id, source: "api", tipo, cor: def?.cor || "blue",
      titulo: d.titulo, desc: d.descricao || "", versao: d.versao, setorId: d.setor_id, setor: d.setor || "",
      arquivo: d.arquivo_nome, ext: extDoArquivo(d.arquivo_nome), mime: d.mime_type, tamanhoBytes: d.tamanho_bytes,
      tamanho: fmtBytes(d.tamanho_bytes), enviadoPor: d.enviado_por || "—", ativo: d.ativo !== false,
      data: fmt(fmtLonga, d.data_upload), atualizado: fmt(fmtLonga, d.atualizado_em), atualizadoHora: fmt(fmtHora, d.atualizado_em),
      download: true,
    };
  }

  function apiFaqParaView(f) {
    return { id: String(f.id), cat: f.categoria || "geral", pergunta: f.pergunta, resposta: f.resposta };
  }

  function apiUsuarioParaRamal(u) {
    return {
      id: String(u.id), nome: u.nome, cargo: u.cargo || "—", setor: u.setor?.nome || "—", andar: u.andar || "—",
      unidade: u.unidade || "", email: u.email, setorId: u.setor_id,
      // O ramal do usuário vale; o do setor só entra como alternativa.
      ramal: u.ramal || u.setor?.ramal || "—", ramalProprio: !!u.ramal,
    };
  }

  function apiUsuarioParaAdmin(u) {
    return {
      id: String(u.id), apiId: u.id, source: "api", nome: u.nome, email: u.email, setor: u.setor?.nome || "—", setorId: u.setor_id,
      cargo: u.cargo || "—", ramal: u.ramal || "", matricula: u.matricula || "", unidade: u.unidade || "", andar: u.andar || "",
      admissao: u.data_admissao || "", nascimento: u.data_nascimento || "", role: PERFIL_ROLE[u.perfil] || "normal", status: u.ativo === false ? "Inativo" : "Ativo",
      senhaTemporaria: !!u.must_change_password,
    };
  }

  const ROTULO = {
    avisos: "avisos", documentos: "documentos", faqs: "FAQ", usuarios: "usuários", setores: "setores",
    aniversariantes: "aniversariantes", aniversariantesHoje: "aniversariantes do dia", proximos: "próximos aniversariantes",
    solicitacoes: "solicitações cadastrais", pendentes: "solicitações pendentes",
    eventosProximos: "eventos", minhasInscricoes: "inscrições em eventos", chamados: "meus chamados", chamadosPendentes: "chamados pendentes", avaliacoesPendentes: "avaliações pendentes",
  };

  // Troca de senha pendente (senha temporária): a API só aceita /auth/me e /auth/change-password.
  const trocaPendente = () => !!state.user?.must_change_password;

  // Chamada quando a API responde 403 PASSWORD_CHANGE_REQUIRED (a barreira real é o backend).
  function requirePasswordChange() {
    if (!state.auth || !state.user || trocaPendente()) return;
    state.user.must_change_password = true;
    stopNotifPolling();
    App.closePanel?.(); App.closeModal?.();
    App.go("#/trocar-senha");
  }

  // Troca a senha, guarda o token novo e deixa a sessão consistente (dados carregados).
  async function changePassword(senhaAtual, novaSenha) {
    const token = await Services.auth.changePassword(senhaAtual, novaSenha);
    App.API.setToken(token.access_token);
    const user = await Services.auth.me();
    App.setSession(user);
    await loadApiData();
    return user;
  }

  // Recarrega próximos eventos e inscrições (depois de inscrever/cancelar/administrar).
  async function refreshEventos() {
    if (!state.auth || trocaPendente()) return;
    const [prox, minhas] = await Promise.allSettled([
      Services.eventos.list({ de: new Date().toISOString(), status: "PUBLICADO", page_size: 20 }), Services.eventos.minhas(),
    ]);
    if (prox.status === "fulfilled") state.api.eventosProximos = prox.value.items;
    if (minhas.status === "fulfilled") state.api.minhasInscricoes = minhas.value;
  }

  // Atualiza só o que o Perfil mostra (cadastro + minhas solicitações). Devolve true se algo mudou.
  async function refreshPerfil() {
    if (!state.auth || trocaPendente()) return false;
    const [me, sol] = await Promise.allSettled([Services.auth.me(), Services.cadastro.list({ page_size: 100 })]);
    if (!state.auth) return false;
    const antes = JSON.stringify([state.user, state.api.solicitacoes]);
    if (me.status === "fulfilled" && me.value.id === state.user.id) state.user = me.value;
    if (sol.status === "fulfilled") state.api.solicitacoes = sol.value.items;
    return antes !== JSON.stringify([state.user, state.api.solicitacoes]);
  }

  async function loadApiData() {
    if (!state.auth || !App.API.getToken() || trocaPendente()) return;
    const jobs = {
      // O mural/dashboard só recebem avisos EFETIVAMENTE publicados (inclusive para o ADMIN).
      avisos: () => Services.listAll(Services.avisos.list, { status: "PUBLICADO" }),
      documentos: () => Services.listAll(Services.documentos.list),
      faqs: () => Services.listAll(Services.faq.list),
      // O ADMIN também recebe os desativados (para reativar); os demais só veem ativos.
      usuarios: () => Services.listAll(Services.usuarios.list, can("manage_users") ? { incluir_inativos: true } : {}),
      setores: () => Services.listAll(Services.setores.list),
      // Próximos eventos publicados (dashboard) e as inscrições do usuário (perfil).
      eventosProximos: () => Services.eventos.list({ de: new Date().toISOString(), status: "PUBLICADO", page_size: 20 }).then((r) => r.items),
      minhasInscricoes: () => Services.eventos.minhas(),
      chamados: () => Services.chamados.meus({ page_size: 100 }).then((r) => r.items),
      avaliacoesPendentes: () => Services.avaliacoes.list({ status: "PENDENTE", avaliador_id: state.user.id, page_size: 1 }).then((r) => r.total),
      ...(can("manage_tickets") ? { chamadosPendentes: () => Services.chamados.resumo().then((r) => r.abertos + r.em_analise) } : {}),
      me: () => Services.auth.me(), // dados cadastrais podem ter mudado (aprovação de solicitação, edição do ADMIN)
      aniversariantes: () => Services.aniversariantes.list(),
      aniversariantesHoje: () => Services.aniversariantes.hoje(),
      proximos: () => Services.aniversariantes.proximos(30),
      solicitacoes: () => Services.cadastro.list({ page_size: 100 }).then((r) => r.items),
      // ADMIN: quantas solicitações aguardam análise (selo no menu).
      ...(can("manage_users") ? { pendentes: () => Services.cadastro.list({ status: "PENDENTE", page_size: 1 }).then((r) => r.total) } : {}),
    };
    const keys = Object.keys(jobs);
    const results = await Promise.allSettled(keys.map((k) => jobs[k]()));
    if (!state.auth) return; // um 401 encerrou a sessão no meio do caminho

    const data = {}, falhas = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") data[keys[i]] = r.value;
      else falhas.push(ROTULO[keys[i]]);
    });

    // Usuários primeiro: avisos precisam do diretório para resolver o autor.
    if (data.usuarios) {
      // Diretório, ramais, aniversariantes e contagens usam só quem está ativo.
      const ativos = data.usuarios.filter((u) => u.ativo !== false);
      state.api.usuariosTodos = data.usuarios;
      state.api.usuariosRaw = ativos;
      state.api.usuarios = ativos.map(apiUsuarioParaRamal);
      state.usuarios = can("manage_users") ? data.usuarios.map(apiUsuarioParaAdmin) : [];
    }
    if (data.setores) state.api.setores = data.setores;
    if (data.me && state.user && data.me.id === state.user.id) state.user = data.me;
    if (data.eventosProximos) state.api.eventosProximos = data.eventosProximos;
    if (data.minhasInscricoes) state.api.minhasInscricoes = data.minhasInscricoes;
    if (data.chamados) state.api.chamados = data.chamados;
    if (typeof data.avaliacoesPendentes === "number") state.api.avaliacoesPendentes = data.avaliacoesPendentes;
    if (typeof data.chamadosPendentes === "number") state.api.chamadosPendentes = data.chamadosPendentes;
    if (data.aniversariantes) state.api.aniversariantes = data.aniversariantes;
    if (data.aniversariantesHoje) state.api.aniversariantesHoje = data.aniversariantesHoje;
    if (data.proximos) state.api.aniversariantesProximos = data.proximos;
    if (data.solicitacoes) state.api.solicitacoes = data.solicitacoes;
    if (typeof data.pendentes === "number") state.api.solicitacoesPendentes = data.pendentes;
    if (data.avisos) state.api.avisos = data.avisos.map(apiAvisoParaCard);
    // O backend já filtra por papel e setor (ADMIN: todos; colaborador: gerais e do seu setor, ativos).
    if (data.documentos) state.api.documentos = data.documentos.map(apiDocumentoParaView);
    // O ADMIN recebe também as inativas; a tela de leitura (#/faq) mostra só as ativas.
    if (data.faqs) state.api.faqs = data.faqs.filter((f) => f.ativo !== false).map(apiFaqParaView);
    state.api.loaded = true;
    if (falhas.length) App.toast?.("Não foi possível carregar: " + falhas.join(", ") + ".");
    await loadNotificacoes();
    if (!pollTimer) startNotifPolling();
  }

  /* ---------- avisos: atualização leve, aviso avulso e leitura real ---------- */
  let ultimoAvisos = Date.now();
  // Recarrega só o mural (avisos publicados). Devolve true se algo mudou (ex.: um agendado venceu).
  async function refreshAvisos() {
    if (!state.auth || trocaPendente()) return false;
    try {
      const novos = (await Services.listAll(Services.avisos.list, { status: "PUBLICADO" })).map(apiAvisoParaCard);
      if (JSON.stringify(novos) === JSON.stringify(state.api.avisos)) return false;
      state.api.avisos = novos;
      return true;
    } catch (_) { return false; }
  }
  // Aviso que ainda não está no estado (ex.: link de uma notificação de aviso agendado que acabou de abrir).
  async function carregarAviso(id) {
    const a = await Services.avisos.get(id);
    if (a.status !== "PUBLICADO") throw new Error("Aviso não encontrado.");
    const card = apiAvisoParaCard(a);
    state.api.avisos = [card, ...state.api.avisos.filter((x) => x.id !== card.id)];
    return card;
  }
  // Registra a leitura no servidor (uma vez por usuário; reabrir/recarregar não conta de novo).
  async function registrarLeitura(id) {
    try {
      await Services.avisos.leitura(id);
      const card = state.api.avisos.find((x) => String(x.id) === String(id));
      if (card) card.lido = true;
      return true;
    } catch (_) { return false; }
  }

  /* ---------- coleções exibidas pelas telas (somente API) ---------- */
  function avisosAll() { return state.api.avisos; }
  function documentosAll() { return state.api.documentos; }
  function faqsAll() { return state.api.faqs; }
  function ramaisAll() { return state.api.usuarios; }
  function setoresAll() { return state.api.setores; }

  // Aniversariantes reais (GET /aniversariantes*): só usuários ativos, só dia e mês.
  const apiAniversariante = (a) => ({
    id: a.id, nome: a.nome, cargo: a.cargo || "—", setor: a.setor || "—", dia: a.dia, mes: a.mes,
    hoje: a.hoje, diasRestantes: a.dias_restantes, jaParabenizado: a.ja_parabenizado, podeParabenizar: a.pode_parabenizar,
  });
  function aniversariantesAll() { return state.api.aniversariantes.map(apiAniversariante); }
  function aniversariantesHoje() { return state.api.aniversariantesHoje.map(apiAniversariante); }
  function aniversariantesProximos() { return state.api.aniversariantesProximos.map(apiAniversariante); }
  function hoje() { const d = new Date(); return { dia: d.getDate(), mes: d.getMonth() + 1 }; }
  function souAniversariante() { return !!state.user && state.api.aniversariantesHoje.some((a) => a.id === state.user.id); }

  // Envia parabéns (persistido) e reflete o resultado nas listas em memória.
  async function parabenizar(id) {
    await Services.aniversariantes.parabenizar(id);
    marcarParabenizado(id);
  }
  function marcarParabenizado(id) {
    ["aniversariantes", "aniversariantesHoje", "aniversariantesProximos"].forEach((k) => {
      state.api[k].forEach((a) => { if (a.id === id) { a.ja_parabenizado = true; a.pode_parabenizar = false; } });
    });
  }

  /* ---------- notificações (reais: GET /notificacoes, geradas pelo backend) ---------- */
  const ICONE_NOTIF = { urgente: "alert-triangle", aviso: "megaphone", evento: "calendar", documento: "file-text", aniversario: "gift", chamado: "help-circle", cadastro: "user-cog" };

  function tempoRelativo(iso) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const seg = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (seg < 60) return "agora mesmo";
    const min = Math.floor(seg / 60);
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const dias = Math.floor(h / 24);
    if (dias < 7) return dias === 1 ? "ontem" : `há ${dias} dias`;
    return fmt(fmtCurta, iso);
  }

  // Formato esperado pelos componentes de notificação (painel do sino e central).
  function notifParaView(n) {
    return {
      id: String(n.id), rota: n.rota || "#/notificacoes", tipo: n.tipo, urgente: n.tipo === "urgente",
      icone: ICONE_NOTIF[n.tipo] || "bell", titulo: n.titulo, texto: n.mensagem, tempo: tempoRelativo(n.criada_em), lida: !!n.lida,
    };
  }

  function notificacoesAll() { return state.notificacoes.map(notifParaView); }
  const isLida = (n) => !!n.lida;
  function unreadCount() { return state.naoLidas; }
  function unreadUrgent() { return state.notificacoes.filter((n) => n.tipo === "urgente" && !n.lida).length; }

  async function loadNotificacoes() {
    if (!state.auth || !App.API.getToken() || state.user?.must_change_password) return;
    const [lista, cont] = await Promise.allSettled([Services.notificacoes.list({ page_size: 100 }), Services.notificacoes.contagem()]);
    if (!state.auth) return;
    if (lista.status === "fulfilled") state.notificacoes = lista.value.items || [];
    if (cont.status === "fulfilled") state.naoLidas = cont.value.nao_lidas;
    atualizarSino();
  }

  // Atualiza só o ícone do sino (sem redesenhar a tela inteira).
  function atualizarSino() {
    document.querySelectorAll('[data-action="open-notif"]').forEach((b) => {
      b.innerHTML = UI.sinoConteudo();
      b.title = unreadUrgent() ? "Você tem notificação urgente" : "Notificações";
    });
  }

  async function marcarLida(id) {
    const n = state.notificacoes.find((x) => String(x.id) === String(id));
    if (!n || n.lida) return;
    try {
      const r = await Services.notificacoes.marcarLida(n.id);
      n.lida = true; n.lida_em = r.lida_em;
      state.naoLidas = Math.max(0, state.naoLidas - 1);
      atualizarSino();
    } catch (_) { /* mantém como não lida; 401 já é tratado pela camada de API */ }
  }

  async function marcarTodasLidas() {
    try { await Services.notificacoes.marcarTodas(); } finally { await loadNotificacoes(); }
  }

  // Atualização periódica do contador (sem WebSocket): a cada 60 s e ao navegar (no máximo a cada 15 s).
  let pollTimer = 0, ultimoToque = 0;
  async function refreshNotificacoes() {
    if (!state.auth || state.user?.must_change_password || document.visibilityState === "hidden") return;
    ultimoToque = Date.now();
    try {
      const c = await Services.notificacoes.contagem();
      if (c.nao_lidas !== state.naoLidas) await loadNotificacoes();
    } catch (_) { /* rede/401 tratados em api.js */ }
  }
  function startNotifPolling() { stopNotifPolling(); pollTimer = setInterval(refreshNotificacoes, 60000); }
  function stopNotifPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = 0; }
  function touchNotificacoes() {
    if (!state.auth || state.user?.must_change_password) return;
    if (Date.now() - ultimoToque > 15000) refreshNotificacoes();
    // Um aviso agendado pode ter vencido: atualiza o mural a cada 30 s (sem redesenhar se nada mudou).
    if (Date.now() - ultimoAvisos > 30000) {
      ultimoAvisos = Date.now();
      refreshAvisos().then((mudou) => { if (mudou && ["#/avisos", "#/dashboard"].includes(location.hash)) App.render(); });
    }
  }

  Object.assign(App, {
    ROLE_ORDER, THEMES, state, save, role, can, roleInfo,
    setSession, clearSession, expireSession, startSession, restoreSession, logout, loadApiData, changePassword, requirePasswordChange, refreshPerfil, refreshEventos, refreshAvisos, carregarAviso, registrarLeitura, nomeDoUsuario,
    removeItem, findItem, deleteRemoteItem,
    avisosAll, documentosAll, faqsAll, ramaisAll, setoresAll, aniversariantesAll, aniversariantesHoje, aniversariantesProximos, hoje, souAniversariante, parabenizar, marcarParabenizado,
    notificacoesAll, isLida, marcarLida, marcarTodasLidas, unreadCount, unreadUrgent, loadNotificacoes, atualizarSino, touchNotificacoes,
  });
})();
