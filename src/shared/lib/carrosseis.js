/* =========================================================================
   Carrossel do Início e faixa de Acessos Rápidos
   ========================================================================= */
(function () {
  /* ---------- carrossel simples (auto-play + controles manuais) ---------- */
  // Faixa rolável dos Acessos Rápidos: setas rolam uma "página", arrastar com o
  // mouse também rola, e as bordas esmaecem/setas desabilitam nas pontas.
  function wireQuickAccess(id) {
    const root = document.getElementById(id);
    if (!root) return;
    const vp = root.querySelector(".qa-viewport"), strip = root.querySelector(".qa-strip");
    const [prev, next] = root.querySelectorAll(".qa-arrow");
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth - 2;
      prev.disabled = strip.scrollLeft <= 2;
      next.disabled = strip.scrollLeft >= max;
      vp.classList.toggle("qa-fade-l", !prev.disabled);
      vp.classList.toggle("qa-fade-r", !next.disabled);
    };
    root.querySelectorAll(".qa-arrow").forEach((b) => b.addEventListener("click", () =>
      strip.scrollBy({ left: +b.dataset.qaDir * strip.clientWidth * 0.8, behavior: "smooth" })));
    strip.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // roda do mouse vertical vira rolagem horizontal enquanto houver para onde ir
    strip.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if ((e.deltaY < 0 && strip.scrollLeft <= 0) || (e.deltaY > 0 && strip.scrollLeft >= max)) return;
      e.preventDefault(); strip.scrollLeft += e.deltaY;
    }, { passive: false });
    // arrastar com o mouse (no toque a rolagem nativa já resolve)
    let down = false, startX = 0, startLeft = 0, moved = false;
    strip.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft; });
    window.addEventListener("pointermove", (e) => { if (!down) return;
      const dx = e.clientX - startX; if (Math.abs(dx) > 4) { moved = true; strip.classList.add("qa-dragging"); }
      strip.scrollLeft = startLeft - dx; });
    window.addEventListener("pointerup", () => { down = false; strip.classList.remove("qa-dragging"); });
    // se arrastou, não dispara o clique do atalho
    strip.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    update();
  }

  function wireCarousel(id, count) {
    const root = document.getElementById(id);
    if (!root || count <= 1) { if (root) root.querySelectorAll(".carousel-arrow,.carousel-dots").forEach(el=>el.style.display="none"); return; }
    const track = root.querySelector(".carousel-track");
    let i = 0, timer;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(n) {
      i = (n + count) % count;
      track.style.transform = `translateX(-${i * 100}%)`;
      root.querySelectorAll(".carousel-dot").forEach((d, idx) => d.classList.toggle("active", idx === i));
    }
    function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(i + 1), 6000); }

    root.querySelector('[data-carousel="prev"]').addEventListener("click", () => { go(i - 1); restart(); });
    root.querySelector('[data-carousel="next"]').addEventListener("click", () => { go(i + 1); restart(); });
    root.querySelectorAll(".carousel-dot").forEach((d) => d.addEventListener("click", () => { go(+d.dataset.dot); restart(); }));
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", restart);
    restart();
  }

  Object.assign(Lib, { wireQuickAccess, wireCarousel });
})();
