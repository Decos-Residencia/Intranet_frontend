/* =========================================================================
   Tela: FAQ
   Rota: #/faq
   ========================================================================= */
(function () {
  const { icon, breadcrumb, esc } = UI;
  const { wireFilters } = Lib;

  function faq() {
    const faqs = App.faqsAll();
    const categorias = [{ key: "todas", label: "Todas" }, ...[...new Set(faqs.map((f) => f.cat))].filter(Boolean).map((cat) => ({ key: cat, label: cat }))];
    const nova = App.can("manage_faq") ? `<div class="flex justify-end mb-4"><a href="#/admin/faqs" class="btn-outline px-5 py-2.5 mr-2">Gerenciar FAQ</a><button data-action="open-faq-nova" class="btn-crimson px-5 py-2.5 flex items-center gap-2">${icon("plus","w-4 h-4")} Nova pergunta</button></div>` : "";
    const items = faqs.map((f, i) => `
      <div class="card faq-item" data-cat="${esc(f.cat)}">
        <button class="faq-q" data-action="faq-toggle">
          <span class="font-bold text-slate-800 dark:text-slate-100">${esc(f.pergunta)}</span>
          <span class="text-slate-400 faq-chevron">${icon("chevron-down","w-5 h-5")}</span>
        </button>
        <div class="faq-a ${i<2?"":"hidden"}"><p class="text-sm text-slate-500 dark:text-slate-400" style="white-space:pre-line">${esc(f.resposta)}</p></div>
      </div>`).join("");

    return {
      title: "Central de Dúvidas (FAQ)",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"FAQ"}])}
      <div class="faq-hero mb-6">
        <h2 class="text-2xl font-extrabold text-white text-center mb-4">Como podemos te ajudar hoje?</h2>
        <div class="faq-search"><span class="text-slate-400">${icon("search","w-5 h-5")}</span><input id="faq-busca" placeholder="Buscar perguntas frequentes e ajuda geral..." class="bg-transparent outline-none flex-1 text-slate-600 dark:text-slate-200"></div>
      </div>
      ${nova}
      <div class="flex gap-2 flex-wrap mb-5" data-filter-group="faq">
        ${categorias.map((c,i)=>`<button class="chip ${i===0?"chip-active":""}" data-filter="${esc(c.key)}">${esc(c.label)}</button>`).join("")}
      </div>
      <div id="faq-list" class="space-y-3">${items}</div>
      <div class="card p-5 mt-6 flex items-center justify-between flex-wrap gap-3 ring-1 ring-wine/20">
        <div><div class="font-bold text-wine">Ainda possui alguma dúvida?</div><div class="text-sm text-slate-500 dark:text-slate-400">Fale diretamente com o setor administrativo responsável ou com o suporte de TI.</div></div>
        ${App.can("interact") ? `<button data-action="open-chamado" data-tipo="geral" class="btn-wine px-6 py-2.5">Abrir Chamado</button>` : ""}
      </div>`,
      init() {
        document.querySelectorAll('[data-action="faq-toggle"]').forEach((b) => {
          b.addEventListener("click", () => {
            const item = b.closest(".faq-item");
            item.querySelector(".faq-a").classList.toggle("hidden");
            item.querySelector(".faq-chevron").classList.toggle("rotate-180");
          });
        });
        // Categoria (chips) + busca livre no texto da pergunta e da resposta.
        let cat = "todas";
        const busca = document.getElementById("faq-busca");
        const aplicar = () => {
          const q = (busca?.value || "").trim().toLowerCase();
          let vis = 0;
          document.querySelectorAll("#faq-list .faq-item").forEach((el) => {
            const ok = (cat === "todas" || el.dataset.cat === cat) && (!q || el.textContent.toLowerCase().includes(q));
            el.style.display = ok ? "" : "none";
            if (ok) vis++;
            if (ok && q) { el.querySelector(".faq-a").classList.remove("hidden"); }
          });
          let vazio = document.getElementById("faq-vazio");
          if (!vazio) { vazio = document.createElement("div"); vazio.id = "faq-vazio"; vazio.className = "empty-state"; document.getElementById("faq-list").after(vazio); }
          vazio.innerHTML = faqs.length
            ? `<div class="text-4xl mb-2">🔍</div><div class="font-bold text-slate-600 dark:text-slate-300">Nenhuma pergunta encontrada</div><div class="text-sm text-slate-400">Tente outras palavras ou abra um chamado.</div>`
            : `<div class="text-4xl mb-2">🗂️</div><div class="font-bold text-slate-600 dark:text-slate-300">Nenhuma pergunta cadastrada</div><div class="text-sm text-slate-400">As perguntas frequentes aparecerão aqui.</div>`;
          vazio.style.display = vis ? "none" : "";
        };
        wireFilters("faq", (key) => { cat = key; aplicar(); });
        busca && busca.addEventListener("input", aplicar);
        aplicar();
      },
    };
  }

  Object.assign(Pages, { faq });
})();
