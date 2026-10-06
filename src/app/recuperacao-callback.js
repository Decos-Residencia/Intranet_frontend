/* =========================================================================
   Retorno do e-mail de recuperação de senha (template PADRÃO do Supabase Auth)

   O {{ .ConfirmationURL }} passa pelo Supabase, que valida e consome o link e redireciona para cá
   com o resultado no FRAGMENTO da URL:
     #access_token=...&refresh_token=...&type=recovery      (sucesso)
     #error=access_denied&error_code=otp_expired&...        (link inválido/expirado)

   Este arquivo roda ANTES do roteador: lê o fragmento uma única vez, guarda só o access_token em
   MEMÓRIA (nunca localStorage/sessionStorage), descarta o refresh_token e limpa a URL, que passa a
   ser #/redefinir-senha. O access_token só é enviado ao nosso backend (que confirma no Supabase),
   nunca usado pelo frontend para falar com o Supabase.
   ========================================================================= */
(function () {
  let pendente = null; // { accessToken } | { erro } — vive só nesta página

  function ler() {
    const bruto = location.hash.replace(/^#/, "");
    if (!bruto || bruto.startsWith("/")) return; // rota normal da intranet (#/algo)
    const params = new URLSearchParams(bruto);
    if (params.get("type") === "recovery" && params.get("access_token")) {
      pendente = { accessToken: params.get("access_token") };
    } else if (params.get("error") || params.get("error_code")) {
      pendente = { erro: params.get("error_code") || params.get("error") };
    } else {
      return;
    }
    try { history.replaceState(null, "", location.pathname + location.search + "#/redefinir-senha"); }
    catch (_) { location.hash = "#/redefinir-senha"; }
  }
  ler();

  // A tela consome uma vez; depois disso o token não fica em lugar nenhum.
  App.recuperacao = {
    obter() { return pendente; },
    limpar() { pendente = null; },
  };
})();
