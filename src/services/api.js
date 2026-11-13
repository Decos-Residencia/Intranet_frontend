/* =========================================================================
   Cliente HTTP da API (FastAPI)
   Único lugar que chama fetch(): URL base, JSON, Bearer, timeout, erros e
   expiração e renovação de sessão. Os tokens são mantidos como um par.
   ========================================================================= */
(function () {
  const SESSION_KEY = "decos_intranet_session";
  const LEGACY_TOKEN_KEY = "decos_intranet_token";
  const TIMEOUT_MS = 20000;
  const REFRESH_MARGIN_MS = 30000;
  let memorySession = null; // fallback quando o localStorage está indisponível
  let refreshInFlight = null;

  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = "ApiError";
      this.status = status; // 0 = sem resposta (rede/timeout)
      this.payload = payload;
    }
  }

  function baseUrl() {
    return (App.config?.apiBaseUrl || "").replace(/\/+$/, "");
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.accessToken && session.refreshToken) return session;
      }
    } catch (_) { /* usa o fallback em memória */ }
    return memorySession;
  }

  function getToken() { return getSession()?.accessToken || ""; }
  function getRefreshToken() { return getSession()?.refreshToken || ""; }

  // A resposta de login, refresh e troca de senha sempre substitui o par inteiro.
  // Persistir um único objeto evita deixar access/refresh de rotações diferentes.
  function setTokens(tokens) {
    const accessToken = tokens?.access_token;
    const refreshToken = tokens?.refresh_token;
    if (!accessToken || !refreshToken) throw new Error("Resposta de autenticação inválida.");
    const expiresIn = Number(tokens.expires_in);
    const session = {
      accessToken,
      refreshToken,
      accessExpiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : 0,
    };
    memorySession = session;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch (_) { /* sem localStorage: segue só em memória */ }
  }

  // Compatibilidade com chamadas antigas: não deve ser usado para criar sessões novas.
  function setToken(token) {
    if (!token) return clearToken();
    const session = getSession();
    if (!session?.refreshToken) throw new Error("Não é possível iniciar uma sessão sem refresh token.");
    setTokens({ access_token: token, refresh_token: session.refreshToken });
  }

  function clearToken() {
    memorySession = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch (_) { /* sem localStorage */ }
  }

  function accessTokenExpiring() {
    const expiresAt = getSession()?.accessExpiresAt || 0;
    return expiresAt > 0 && Date.now() >= expiresAt - REFRESH_MARGIN_MS;
  }

  /* ---------- mensagens de erro ---------- */
  const CAMPOS = {
    nome: "Nome", email: "E-mail", senha: "Senha", setor_id: "Setor", cargo: "Cargo",
    data_nascimento: "Data de nascimento", perfil: "Perfil", ativo: "Status",
    titulo: "Título", conteudo: "Conteúdo", categoria: "Categoria", url_arquivo: "URL do arquivo",
    pergunta: "Pergunta", resposta: "Resposta", ramal: "Ramal",
  };

  function mensagemDoCampo(item) {
    const msg = String(item.msg || "");
    const n = (msg.match(/(\d+)/) || [])[1];
    switch (item.type) {
      case "missing": return "é obrigatório";
      case "string_too_short": return n && n !== "1" ? `deve ter pelo menos ${n} caracteres` : "não pode ficar vazio";
      case "string_too_long": return n ? `deve ter no máximo ${n} caracteres` : "é muito longo";
      case "url_parsing":
      case "url_scheme":
      case "url_type": return "informe uma URL válida (https://...)";
      case "value_error":
        if (/email/i.test(msg)) return "é inválido";
        return msg.replace(/^Value error,\s*/i, "");
      default: return msg || "valor inválido";
    }
  }

  function mensagem422(detail) {
    const vistos = new Set();
    const partes = [];
    for (const item of detail) {
      const campo = [...(item.loc || [])].reverse().find((p) => typeof p === "string" && p !== "body");
      // value_error com frase própria do backend (ex.: regras da senha) já é uma mensagem completa.
      const propria = item.type === "value_error" && !/email/i.test(String(item.msg || ""));
      const texto = propria ? mensagemDoCampo(item).replace(/\.$/, "") : `${CAMPOS[campo] || campo || "Campo"} ${mensagemDoCampo(item)}`;
      if (!vistos.has(texto)) { vistos.add(texto); partes.push(texto); }
    }
    return partes.length ? partes.slice(0, 3).join("; ") + "." : "Verifique os campos informados.";
  }

  function errorMessage(status, payload, method) {
    const detail = payload && typeof payload === "object" ? payload.detail : null;
    if (status === 422 && Array.isArray(detail)) return mensagem422(detail);
    // Exclusão bloqueada por vínculo: o backend responde 422/409 com texto genérico.
    // (Mensagens específicas do backend, como "arquive em vez de excluir", são mantidas.)
    const generico = typeof detail !== "string" || /conflitam com um registro|referência informada/i.test(detail);
    if ((status === 422 || status === 409) && method === "DELETE" && generico) return "Não foi possível excluir: o registro está em uso.";
    if (typeof detail === "string" && detail) return detail;
    return ({
      400: "Requisição inválida.",
      401: "Sessão expirada. Faça login novamente.",
      403: "Você não tem permissão para esta ação.",
      404: "Registro não encontrado.",
      409: "Esse registro conflita com um já existente.",
      422: "Verifique os campos informados.",
      429: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      500: "Erro interno do servidor.",
      503: "Serviço temporariamente indisponível.",
    })[status] || "Não foi possível concluir a operação.";
  }

  async function refreshSession() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new ApiError("Sessão expirada. Faça login novamente.", 401, null);
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = request("/auth/refresh", {
      method: "POST",
      auth: false,
      skipRefresh: true,
      body: { refresh_token: refreshToken },
    }).then((tokens) => {
      setTokens(tokens);
      return tokens;
    }).finally(() => { refreshInFlight = null; });
    return refreshInFlight;
  }

  /* ---------- requisição ---------- */
  async function request(path, options = {}) {
    if (!baseUrl()) throw new ApiError(App.config?.notConfiguredMessage || "API não configurada para este ambiente.", 0, null);

    // Renova antes de enviar chamadas protegidas que estejam próximas da expiração.
    // Login, refresh e rotas públicas não entram neste fluxo.
    if (options.auth !== false && !options.skipRefresh && !options.retried && getToken() && accessTokenExpiring()) {
      try { await refreshSession(); }
      catch (err) {
        App.expireSession?.();
        throw err;
      }
    }

    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    const token = getToken();
    const hasBody = options.body !== undefined && options.body !== null;
    const isForm = hasBody && options.body instanceof FormData;

    headers.set("Accept", "application/json");
    if (hasBody && !isForm) headers.set("Content-Type", "application/json");
    if (token && options.auth !== false) headers.set("Authorization", `Bearer ${token}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || App.config?.apiTimeoutMs || TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${baseUrl()}${path}`, {
        method, headers, signal: controller.signal,
        body: hasBody && !isForm ? JSON.stringify(options.body) : options.body,
      });
    } catch (err) {
      throw new ApiError(
        err.name === "AbortError"
          ? "O servidor demorou demais para responder. Tente novamente."
          : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        0, null);
    } finally {
      clearTimeout(timer);
    }

    const type = response.headers.get("content-type") || "";
    let payload = null;
    if (response.status !== 204) {
      try {
        // `blob: true` (ex.: PDF de evidências): o arquivo volta como Blob; erros continuam em JSON.
        payload = type.includes("application/json") ? await response.json()
          : options.blob && response.ok ? await response.blob() : await response.text();
      }
      catch (_) { payload = null; }
    }

    if (!response.ok) {
      // Um 401 de rota protegida pode ser access token vencido. A requisição
      // original é repetida uma única vez depois de rotacionar o par de tokens.
      if (response.status === 401 && options.auth !== false && token && !options.retried) {
        try {
          // Outra chamada pode já ter concluído a rotação enquanto esta aguardava.
          if (getToken() === token) await refreshSession();
          return request(path, { ...options, retried: true, skipRefresh: true });
        } catch (err) {
          const detalhe = payload && typeof payload === "object" ? payload.detail : "";
          App.expireSession?.(typeof detalhe === "string" && /senha/i.test(detalhe) ? detalhe : undefined);
          throw err;
        }
      }
      // Depois de uma repetição, ou em uma chamada sem possibilidade de refresh,
      // um 401 encerra a sessão sem tentar novamente.
      if (response.status === 401 && options.auth !== false && token) {
        const detalhe = payload && typeof payload === "object" ? payload.detail : "";
        App.expireSession?.(typeof detalhe === "string" && /senha/i.test(detalhe) ? detalhe : undefined);
      }
      if (response.status === 403 && payload && payload.code === "PASSWORD_CHANGE_REQUIRED") App.requirePasswordChange?.();
      throw new ApiError(errorMessage(response.status, payload, method), response.status, payload);
    }
    return payload;
  }

  // "Acorda" a API (Render gratuito) sem bloquear nada: usado enquanto o usuário vê o login.
  function wake() { return request("/health", { auth: false }).catch(() => {}); }

  Object.assign(App, {
    API: { ApiError, request, getToken, getRefreshToken, setToken, setTokens, clearToken, refreshSession, baseUrl, wake },
  });
})();
