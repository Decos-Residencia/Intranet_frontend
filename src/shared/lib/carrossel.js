/* =========================================================================
   Carrossel acessível (padrão WAI-ARIA "carousel")
   Setas, pontos (alvo de 24 px), teclado (←/→ com o foco dentro), troca automática que
   pausa com mouse ou foco em cima e que NÃO acontece com movimento reduzido (sistema ou conta).
   Marcação esperada: [data-carrossel] > [data-carrossel-trilho] > [data-slide]...,
   [data-carrossel-ant], [data-carrossel-prox], [data-carrossel-pontos], [data-carrossel-pausa].
   ========================================================================= */
(function () {
  const movimentoReduzido = () =>
    document.documentElement.dataset.movimento === "reduzido" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function wireCarrossel(raiz, { intervalo = 7000, aoMostrar } = {}) {
    if (!raiz) return null;
    const trilho = raiz.querySelector("[data-carrossel-trilho]");
    const slides = [...raiz.querySelectorAll("[data-slide]")];
    const pontos = raiz.querySelector("[data-carrossel-pontos]");
    const botaoPausa = raiz.querySelector("[data-carrossel-pausa]");
    const total = slides.length;
    let atual = 0, timer = 0, pausadoPeloUsuario = movimentoReduzido(), pausadoPorInteracao = false;

    if (pontos) {
      pontos.innerHTML = slides.map((_, i) => `<button type="button" class="carrossel-ponto" data-ir="${i}" aria-label="Ir para o slide ${i + 1} de ${total}"></button>`).join("");
    }

    function mostrar(n, foco = false) {
      atual = (n + total) % total;
      trilho.style.transform = `translateX(-${atual * 100}%)`;
      slides.forEach((s, i) => {
        const ativo = i === atual;
        s.setAttribute("aria-hidden", String(!ativo));
        s.querySelectorAll("a, button").forEach((el) => { el.tabIndex = ativo ? 0 : -1; });
      });
      pontos?.querySelectorAll("[data-ir]").forEach((p, i) => p.setAttribute("aria-current", i === atual ? "true" : "false"));
      if (foco) slides[atual].focus({ preventScroll: true });
      aoMostrar?.(slides[atual], atual);
    }

    const rodando = () => !pausadoPeloUsuario && !pausadoPorInteracao && total > 1;
    function agendar() {
      clearInterval(timer);
      // Com troca automática, o leitor de tela não é interrompido a cada slide.
      trilho.setAttribute("aria-live", rodando() ? "off" : "polite");
      if (rodando()) timer = setInterval(() => { if (!document.contains(raiz)) { clearInterval(timer); return; } mostrar(atual + 1); }, intervalo);
      if (botaoPausa) {
        botaoPausa.setAttribute("aria-pressed", String(pausadoPeloUsuario));
        botaoPausa.setAttribute("aria-label", pausadoPeloUsuario ? "Retomar a troca automática" : "Pausar a troca automática");
        botaoPausa.innerHTML = UI.icon(pausadoPeloUsuario ? "play" : "pause", "w-4 h-4");
      }
    }

    raiz.querySelector("[data-carrossel-ant]")?.addEventListener("click", () => { mostrar(atual - 1); agendar(); });
    raiz.querySelector("[data-carrossel-prox]")?.addEventListener("click", () => { mostrar(atual + 1); agendar(); });
    pontos?.addEventListener("click", (e) => { const p = e.target.closest("[data-ir]"); if (p) { mostrar(Number(p.dataset.ir), true); agendar(); } });
    botaoPausa?.addEventListener("click", () => { pausadoPeloUsuario = !pausadoPeloUsuario; agendar(); });
    raiz.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); mostrar(atual - 1, true); agendar(); }
      if (e.key === "ArrowRight") { e.preventDefault(); mostrar(atual + 1, true); agendar(); }
    });
    raiz.addEventListener("mouseenter", () => { pausadoPorInteracao = true; agendar(); });
    raiz.addEventListener("mouseleave", () => { pausadoPorInteracao = raiz.contains(document.activeElement); agendar(); });
    raiz.addEventListener("focusin", () => { pausadoPorInteracao = true; agendar(); });
    raiz.addEventListener("focusout", (e) => { if (!raiz.contains(e.relatedTarget)) { pausadoPorInteracao = raiz.matches(":hover"); agendar(); } });

    mostrar(0);
    agendar();
    return { mostrar };
  }

  Object.assign(Lib, { wireCarrossel });
})();
