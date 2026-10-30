/* =========================================================================
   Preferências — tema e acessibilidade da conta (PUT /auth/me/preferencias)
   Viram atributos data-* no <html>, lidos pelo CSS (acessibilidade.css,
   tokens-e-temas.css). Uma cópia no localStorage é aplicada pelo script do
   <head> antes do CSS, para a tela não "piscar" no visual padrão.
   ========================================================================= */
(function () {
  const LS = "decos_intranet_prefs";

  // chave da preferência → [atributo no <html>, valor quando ligada]
  const ATRIBUTOS = {
    alto_contraste: ["contraste", "alto"],
    reduzir_movimento: ["movimento", "reduzido"],
    reduzir_transparencia: ["transparencia", "reduzida"],
    sublinhar_links: ["links", "sublinhado"],
    foco_reforcado: ["foco", "reforcado"],
    fonte_leitura: ["fonte", "leitura"],
  };

  const maisContraste = window.matchMedia ? matchMedia("(prefers-contrast: more)") : null;
  let atuais = {};
  try { atuais = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (_) { atuais = {}; }

  function guardar() {
    try { localStorage.setItem(LS, JSON.stringify(atuais)); } catch (_) { /* armazenamento indisponível */ }
  }

  function aplicar() {
    const d = document.documentElement.dataset;
    if (atuais.texto && atuais.texto !== 100) d.texto = String(atuais.texto); else delete d.texto;
    if (atuais.escala && atuais.escala !== "normal") d.escala = atuais.escala; else delete d.escala;
    if (atuais.espacamento === "amplo") d.espacamento = "amplo"; else delete d.espacamento;
    Object.entries(ATRIBUTOS).forEach(([chave, [attr, valor]]) => {
      if (atuais[chave]) d[attr] = valor; else delete d[attr];
    });
    // Sem escolha na conta, o alto contraste segue o sistema operacional (prefers-contrast: more).
    if (atuais.alto_contraste === undefined && maisContraste?.matches) d.contraste = "alto";
    if (atuais.tema && App.THEMES[atuais.tema] && App.state.theme !== atuais.tema) {
      App.state.theme = atuais.tema;
      App.save();
      App.applyThemeLive?.();
    }
  }

  // Chamado a cada GET /auth/me: a conta é a fonte da verdade (vale em qualquer aparelho).
  function carregarDoUsuario(user) {
    if (!user?.preferencias) return;
    const { atalhos, ...visuais } = user.preferencias;
    atuais = Object.fromEntries(Object.entries(visuais).filter(([, v]) => v !== null && v !== undefined));
    guardar();
    aplicar();
    // Menu recolhido acompanha a conta: quem recolheu num computador entra recolhido no outro.
    if (typeof atuais.menu_recolhido === "boolean" && App.state.sidebarCollapsed !== atuais.menu_recolhido) {
      App.state.sidebarCollapsed = atuais.menu_recolhido;
      App.save();
    }
  }

  // Rota da tela inicial escolhida (Configurações). Sem escolha: Início.
  const TELAS_INICIAIS = ["dashboard", "painel", "avisos", "eventos", "agenda", "documentos", "diretorio"];
  function telaInicial() {
    return TELAS_INICIAIS.includes(atuais.tela_inicial) ? `#/${atuais.tela_inicial}` : "#/dashboard";
  }

  // Aplica na hora (sem esperar a rede) e salva na conta. Em caso de erro, volta ao que era.
  async function salvarPreferencias(parcial) {
    const antes = { ...atuais };
    Object.entries(parcial).forEach(([k, v]) => { if (v === null) delete atuais[k]; else if (k !== "atalhos") atuais[k] = v; });
    guardar();
    aplicar();
    if (!App.state.auth) return null;
    try {
      const me = await Services.preferencias.salvar(parcial);
      if (App.state.user && me.id === App.state.user.id) App.state.user = me;
      return me;
    } catch (err) {
      atuais = antes;
      guardar();
      aplicar();
      App.toast?.("Não foi possível salvar a preferência. Tente de novo.");
      throw err;
    }
  }

  function preferencia(chave) { return atuais[chave]; }

  maisContraste?.addEventListener?.("change", aplicar);
  aplicar();
  Object.assign(App, { carregarPreferencias: carregarDoUsuario, salvarPreferencias, preferencia, aplicarPreferencias: aplicar, telaInicial });
})();
