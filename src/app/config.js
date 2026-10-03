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
  const local = ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname);
  const config = {
    apiBaseUrl: runtime.apiBaseUrl || (local ? "http://localhost:8000" : PRODUCTION_API_URL),
    // Render gratuito "dorme" e a 1ª requisição pode levar ~1 min: timeout maior fora do localhost.
    apiTimeoutMs: runtime.apiTimeoutMs || (local ? 20000 : 60000),
  };

  Object.assign(App, { config });
})();
