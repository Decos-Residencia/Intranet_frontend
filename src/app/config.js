/* =========================================================================
   Configuração da aplicação
   API_BASE_URL não é segredo. Nunca coloque senhas, tokens ou chaves aqui.
   Ordem: window.__DECOS_CONFIG__.apiBaseUrl (definido antes deste arquivo) →
   localhost em desenvolvimento → PRODUCTION_API_URL.
   ========================================================================= */
(function () {
  // Preencha com a URL pública do backend (Render) no deploy de produção.
  const PRODUCTION_API_URL = "";

  const runtime = window.__DECOS_CONFIG__ || {};
  const host = location.hostname;

  // `python -m http.server` imprime "http://0.0.0.0:5500", mas 0.0.0.0 não é um endereço de
  // navegação (nunca é um site publicado). Troca por localhost (mesma porta e caminho), que é o
  // que a API local e o CORS esperam.
  // O mesmo vale para *.localhost (ex.: app.localhost), que sempre aponta para a própria máquina.
  if (host === "0.0.0.0" || host.endsWith(".localhost")) {
    location.replace(location.href.replace("//" + host, "//localhost"));
  }

  const local = ["localhost", "127.0.0.1", "[::1]", ""].includes(host);
  // IP de rede privada ou nome .local: a API de desenvolvimento só atende em localhost.
  const redeLocal = !local && (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith(".local"));
  const config = {
    apiBaseUrl: runtime.apiBaseUrl || (local ? "http://localhost:8000" : PRODUCTION_API_URL),
    // Render gratuito "dorme" e a 1ª requisição pode levar ~1 min: timeout maior fora do localhost.
    apiTimeoutMs: runtime.apiTimeoutMs || (local ? 20000 : 60000),
    // Mensagem mostrada quando não há URL de API configurada para este endereço.
    notConfiguredMessage: redeLocal
      ? `Endereço ${host} não é aceito no desenvolvimento. Abra o sistema por ${location.protocol}//localhost${location.port ? ":" + location.port : ""}.`
      : `API não configurada para este ambiente (${location.host || "file"}).`,
  };

  Object.assign(App, { config });
})();
