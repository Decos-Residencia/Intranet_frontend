/* =========================================================================
   Tela: Criar / Editar Notícia
   Rota: #/admin/noticias/nova · #/admin/noticias/:id/editar
   ========================================================================= */
(function () {
  const { icon, badge, breadcrumb, esc } = UI;
  const { opts, TIPOS_NOTICIA, wireDrop } = AdminUI;

  function adminNoticiaNova(id) {
    const n = id ? App.findItem("noticias", id) : null;
    const prio = n?.prioridade || "normal";
    const img = typeof n?.imagem === "string" ? n.imagem : "";
    return {
      title: n ? "Editar Notícia" : "Criar Notícia",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Notícias",route:"#/admin/noticias"},{label: n ? "Editar" : "Nova notícia"}])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${n ? "Editar Notícia" : "Criar Notícia Institucional"}</h2></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form class="lg:col-span-2 space-y-5" id="form-noticia" data-id="${n?.id || ""}" data-action="prevent">
          <div><label class="field-label" for="nt-titulo">TÍTULO DA NOTÍCIA *</label><input class="field-input" id="nt-titulo" maxlength="140" placeholder="Digite o título da notícia..." value="${esc(n?.titulo || "")}"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="field-label" for="nt-tipo">CATEGORIA</label><select id="nt-tipo" class="field-input">${opts(TIPOS_NOTICIA, n?.tipo || "Comunicado")}</select></div>
            <div><label class="field-label" for="nt-agenda">AGENDAR PUBLICAÇÃO</label><select id="nt-agenda" class="field-input">${opts([{ value: "agora", label: "Imediata (Agora)" }, { value: "amanha", label: "Amanhã às 08:00" }], n?.status === "Agendado" ? "amanha" : "agora")}</select></div>
          </div>
          <div><label class="field-label">NÍVEL DE PRIORIDADE</label>
            <div class="grid grid-cols-3 gap-3" data-filter-group="prio">
              <button type="button" class="prio-opt ${prio === "normal" ? "prio-active" : ""}" data-filter="normal">✓ Normal</button>
              <button type="button" class="prio-opt ${prio === "relevante" ? "prio-active" : ""}" data-filter="relevante">★ Relevante</button>
              <button type="button" class="prio-opt prio-danger ${prio === "urgente" ? "prio-active" : ""}" data-filter="urgente">🔥 Urgente</button>
            </div>
          </div>
          <div><label class="field-label" for="nt-corpo">CONTEÚDO DA NOTÍCIA *</label>
            <textarea class="field-input" id="nt-corpo" rows="8" placeholder="Escreva o comunicado. Cada linha em branco separa um parágrafo.">${esc(n?.corpo || "")}</textarea>
            <div class="field-hint" id="nt-contador"></div>
          </div>
          <div><label class="field-label">IMAGEM DE DESTAQUE</label>
            <label class="dropzone" for="nt-img" id="nt-drop"><span class="text-wine mb-2">${icon("upload","w-7 h-7")}</span>
            <div class="font-bold text-wine">Clique para fazer upload ou arraste um arquivo</div>
            <div class="text-xs text-slate-400">PNG, JPG ou WEBP de até 5MB. A imagem é redimensionada automaticamente.</div></label>
            <input type="file" id="nt-img" accept="image/png,image/jpeg,image/webp" class="hidden">
            <div id="nt-img-box" class="${img ? "" : "hidden"} mt-3 flex items-center gap-3">
              <img id="nt-img-thumb" src="${img}" alt="" class="w-24 h-16 object-cover rounded-lg">
              <button type="button" id="nt-img-rm" class="text-sm font-bold text-crimson">Remover imagem</button>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2 flex-wrap">
            <a href="#/admin/noticias" class="btn-outline px-6 py-2.5">Cancelar</a>
            <button type="button" data-action="save-noticia" data-status="Rascunho" class="btn-outline px-6 py-2.5">Salvar Rascunho</button>
            <button type="button" data-action="save-noticia" data-status="Publicado" class="btn-crimson px-6 py-2.5">${n ? "Salvar e publicar" : "Publicar Notícia"}</button>
          </div>
        </form>
        <aside class="space-y-4">
          <div class="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">PRÉVIA EM TEMPO REAL NO MURAL <span class="text-crimson flex items-center gap-1">● Visualização Ativa</span></div>
          <div class="card overflow-hidden ring-1 ring-crimson/30">
            <img id="pv-img" src="${img}" alt="" class="${img ? "" : "hidden"} w-full h-36 object-cover">
            <div class="p-5">
              <div class="flex items-center justify-between mb-2"><div class="flex gap-2" id="pv-badges"></div><span class="text-xs text-slate-400">Hoje, Agora mesmo</span></div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2" id="pv-titulo"></h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-3" id="pv-corpo"></p>
              <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${UI.foto(DB.usuario.nome)}${DB.usuario.iniciais}</span> ${DB.usuario.nome}</span><span class="text-sm font-bold text-crimson">Ver completo ›</span></div>
            </div>
          </div>
          <div class="card p-5 ring-1 ring-crimson/20">
            <div class="font-bold text-crimson mb-1">Diretrizes de Publicação Decós</div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Avisos marcados como <b>Urgente</b> aparecem com destaque vermelho no mural e no início de todos os colaboradores.</p>
          </div>
        </aside>
      </div>`,
      init() {
        const $ = (i) => document.getElementById(i);
        const f = $("form-noticia");
        f.dataset.imagem = img;
        const prioAtual = () => document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal";
        const preview = () => {
          $("pv-titulo").textContent = $("nt-titulo").value || "Título da notícia";
          const c = $("nt-corpo").value;
          $("pv-corpo").textContent = c ? (c.length > 150 ? c.slice(0, 150) + "…" : c) : "O texto da notícia aparece aqui.";
          const p = prioAtual();
          $("pv-badges").innerHTML = (p === "urgente" ? badge("red", "🔥 URGENTE") + " " : p === "relevante" ? badge("red-soft", "★ RELEVANTE") + " " : "") + badge("blue", $("nt-tipo").value.toUpperCase());
          $("nt-contador").textContent = `${c.length} caracteres`;
        };
        document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((x) => x.classList.remove("prio-active"));
          b.classList.add("prio-active"); preview();
        }));
        ["nt-titulo", "nt-corpo", "nt-tipo"].forEach((i) => $(i).addEventListener("input", preview));
        const setImg = (url) => {
          f.dataset.imagem = url;
          $("nt-img-thumb").src = url; $("pv-img").src = url;
          $("nt-img-box").classList.toggle("hidden", !url); $("pv-img").classList.toggle("hidden", !url);
        };
        const carregar = (file) => {
          if (!file) return;
          if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { App.toast("Formato inválido — use PNG, JPG ou WEBP"); return; }
          if (file.size > 5 * 1024 * 1024) { App.toast("Imagem maior que 5MB"); return; }
          reduzirImagem(file, 1000).then(setImg);
        };
        $("nt-img").addEventListener("change", (e) => carregar(e.target.files[0]));
        wireDrop($("nt-drop"), carregar);
        $("nt-img-rm").addEventListener("click", () => { setImg(""); $("nt-img").value = ""; });
        preview();
      },
    };
  }
  // Redimensiona no navegador (canvas) para caber no armazenamento local.
  function reduzirImagem(file, max) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => {
        const k = Math.min(1, max / im.width), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      }; im.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  function submitNoticia(status) {
    const f = document.getElementById("form-noticia");
    if (!f) return;
    const titulo = document.getElementById("nt-titulo").value.trim();
    const corpo = document.getElementById("nt-corpo").value.trim();
    if (titulo.length < 5) { App.toast("Informe um título com pelo menos 5 caracteres"); document.getElementById("nt-titulo").focus(); return; }
    if (status !== "Rascunho" && corpo.length < 10) { App.toast("Escreva o conteúdo da notícia antes de publicar"); document.getElementById("nt-corpo").focus(); return; }
    if (status === "Publicado" && document.getElementById("nt-agenda").value === "amanha") status = "Agendado";
    const antigo = f.dataset.id ? App.findItem("noticias", f.dataset.id) : null;
    App.saveNoticia({
      ...(antigo ? { id: antigo.id } : {}), titulo, corpo, status, own: true,
      tipo: document.getElementById("nt-tipo").value,
      prioridade: document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal",
      imagem: f.dataset.imagem || "", quando: "Agora mesmo", autor: DB.usuario.nome, leituras: antigo?.leituras || 0,
    });
    App.toast({ Rascunho: "Rascunho salvo!", Agendado: "Notícia agendada para amanhã às 08:00", Publicado: "Notícia publicada no mural!" }[status]);
    setTimeout(() => App.go("#/admin/noticias"), 500);
  }

  Object.assign(PagesAdmin, { adminNoticiaNova, submitNoticia });
})();
