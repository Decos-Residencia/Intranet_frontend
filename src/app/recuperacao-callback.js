/* =========================================================================
   Retorno do e-mail de recuperação de senha (template PADRÃO do Supabase Auth)

   O {{ .ConfirmationURL }} passa pelo Supabase, que valida e consome o link e redireciona para cá
   com o resultado no FRAGMENTO da URL:
     #access_token=...&refresh_token=...&type=recovery      (sucesso, template padrão)
     ?token_hash=...&type=recovery                          (sucesso, template customizado)
     #error=access_denied&error_code=otp_expired&...        (link inválido/expirado)

   Este arquivo roda ANTES do roteador: lê o fragmento uma única vez, guarda só o access_token em
   MEMÓRIA (nunca localStorage/sessionStorage), descarta o refresh_token e limpa a URL, que passa a
   ser #/redefinir-senha. O access_token só é enviado ao nosso backend (que confirma no Supabase),
   nunca usado pelo frontend para falar com o Supabase.
   ========================================================================= */
(function () {
  let pendente = null; // { accessToken } | { tokenHash } | { erro } — vive só nesta página

  // Lê as duas formas em que o retorno pode chegar, em QUALQUER caminho (a Vercel serve o
  // index.html para /redefinir-senha, /auth/confirm etc.):
  //   • fragmento:  #access_token=...&type=recovery   (template padrão do Supabase)
  //   • query:      ?token_hash=...&type=recovery     (template customizado do Supabase)
  //   • erro:       #error=...&error_code=otp_expired  (ou na query)
  // O fragmento de rota da intranet (#/algo) nunca é tocado.
  function ler() {
    const bruto = location.hash.replace(/^#/, "");
    const fontes = [];
    if (bruto && !bruto.startsWith("/")) fontes.push(new URLSearchParams(bruto));
    if (location.search) fontes.push(new URLSearchParams(location.search));
    for (const p of fontes) {
      if (p.get("type") === "recovery" && p.get("access_token")) { pendente = { accessToken: p.get("access_token") }; break; }
      if (p.get("type") === "recovery" && p.get("token_hash")) { pendente = { tokenHash: p.get("token_hash") }; break; }
      if (p.get("error_code") || (p.get("error") && p.get("error_description"))) { pendente = { erro: p.get("error_code") || p.get("error") }; break; }
    }
    if (!pendente) return;
    // Limpa de imediato a barra de endereço e o histórico (token/erro, caminho e query).
    try { history.replaceState(null, "", "/#/redefinir-senha"); }
    catch (_) { location.hash = "#/redefinir-senha"; }
  }
  ler();

  // A tela consome uma vez; depois disso o token não fica em lugar nenhum.
  App.recuperacao = {
    obter() { return pendente; },
    limpar() { pendente = null; },
  };
})();
