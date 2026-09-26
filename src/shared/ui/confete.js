/* =========================================================================
   Confete (feedback de ação, não decoração ambiente)
   ========================================================================= */
(function () {
  function confettiBurst(fromEl) {
    const colors = ["#8E1B2E", "#F5334D", "#F2A8B4", "#FCE9ED", "#6E0F22"];
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden;";
    const r = fromEl.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      const angle = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
      p.style.left = r.left + r.width / 2 + "px";
      p.style.top = r.top + "px";
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", (Math.sin(angle) * dist - 30) + "px");
      p.style.setProperty("--rot", Math.random() * 360 + "deg");
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 80 + "ms";
      host.appendChild(p);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 900);
  }

  Object.assign(App, { confettiBurst });
})();
