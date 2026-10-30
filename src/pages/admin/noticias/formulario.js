/* =========================================================================
   Tela: Criar / Editar Notícia
   Rota: #/admin/noticias/nova · #/admin/noticias/:id/editar
   Persistido no backend (POST/PUT /avisos): título, conteúdo, categoria (tipo ou "urgente"),
   status (rascunho, agendado, publicado) e data/hora de publicação.
   NÃO existe (nem é simulado): imagem de destaque e prioridade "Relevante".
   ========================================================================= */
(function () {
  const { badge, breadcrumb, esc, icon } = UI;
  const { opts, TIPOS_NOTICIA } = AdminUI;
  const CATEGORIA_DE_TIPO = { "Comunicado": "comunicado", "Evento": "evento", "Promoção": "promocao", "Notícia": "noticia" };
  const TIPO_DE_CATEGORIA = { comunicado: "Comunicado", evento: "Evento", promocao: "Promoção", noticia: "Notícia", urgente: "Comunicado" };
  const fmtHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

  // ISO (UTC) -> valor de <input type="datetime-local"> no fuso do navegador.
  const paraInputLocal = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // Modos de salvamento disponíveis conforme o estado atual (o backend valida as transições).
  const MODOS = { publicar: "Publicar agora", agendar: "Agendar", rascunho: "Rascunho", salvar: "Salvar alterações", revisao: "Enviar para revisão", retirar: "Retirar da revisão" };
  const BOTAO = { publicar: "Publicar Notícia", agendar: "Agendar publicação", rascunho: "Salvar rascunho", salvar: "Salvar alterações", revisao: "Enviar para revisão", retirar: "Retirar da revisão" };
  // Quem aprova publica e agenda; os demais só salvam rascunho ou enviam para revisão (spec 003).
  const modosPara = (status, aprova) => (aprova ? {
    NOVO: ["publicar", "agendar", "rascunho"], RASCUNHO: ["rascunho", "agendar", "publicar"],
    AGENDADO: ["agendar", "rascunho", "publicar"], PUBLICADO: ["salvar"], ARQUIVADO: ["salvar"], EM_REVISAO: ["salvar"],
  } : {
    NOVO: ["revisao", "rascunho"], RASCUNHO: ["revisao", "rascunho"], EM_REVISAO: ["salvar", "retirar"],
    AGENDADO: ["salvar", "rascunho"], PUBLICADO: ["salvar"], ARQUIVADO: ["salvar"],
  })[status] || ["salvar"];

  function adminNoticiaNova(id) {
    const autor = App.state.user.nome;
    return {
      title: id ? "Editar Notícia" : "Criar Notícia",
      html: `
      ${breadcrumb([{label:"Início",route:"#/dashboard"},{label:"Notícias",route:"#/admin/noticias"},{label: id ? "Editar" : "Nova notícia"}])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${id ? "Editar Notícia" : "Criar Notícia Institucional"}</h2></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form class="lg:col-span-2 space-y-5" id="form-noticia" data-id="${esc(id || "")}" data-action="prevent">
          <div><label class="field-label" for="nt-titulo">TÍTULO DA NOTÍCIA *</label><input class="field-input" id="nt-titulo" maxlength="140" placeholder="Digite o título da notícia..."></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="field-label" for="nt-tipo">CATEGORIA</label><select id="nt-tipo" class="field-input">${opts(TIPOS_NOTICIA, "Comunicado")}</select></div>
          </div>
          <div><label class="field-label">NÍVEL DE PRIORIDADE</label>
            <div class="grid grid-cols-2 gap-3" data-filter-group="prio">
              <button type="button" class="prio-opt prio-active" data-filter="normal">✓ Normal</button>
              <button type="button" class="prio-opt prio-danger" data-filter="urgente">🔥 Urgente</button>
            </div>
          </div>
          <div><label class="field-label" for="nt-corpo">CONTEÚDO DA NOTÍCIA *</label>
            <textarea class="field-input" id="nt-corpo" rows="8" placeholder="Escreva o comunicado. Cada linha em branco separa um parágrafo."></textarea>
            <div class="field-hint" id="nt-contador"></div>
          </div>
          <div><label class="field-label" for="nt-destaque">EXIBIR EM DESTAQUE ATÉ</label>
            <input type="datetime-local" id="nt-destaque" class="field-input max-w-xs">
            <div class="field-hint">Opcional. Depois dessa data o aviso sai da Inicial e do topo do mural sozinho, mas continua no histórico e na busca.</div></div>
          <div><span class="field-label" id="nt-foto-lbl">FOTO (OPCIONAL)</span>
            <div class="flex items-center gap-3 flex-wrap">
              <span id="nt-foto-previa" class="nt-foto-previa" hidden><img id="nt-foto-img" alt="Prévia da foto do comunicado"></span>
              <label class="btn-outline px-4 py-2 text-sm cursor-pointer">${icon("upload", "w-4 h-4 inline")} <span id="nt-foto-txt">Escolher foto</span>
                <input type="file" id="nt-foto" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-labelledby="nt-foto-lbl"></label>
              <button type="button" id="nt-foto-remover" class="btn-outline px-4 py-2 text-sm" hidden>Remover foto</button>
            </div>
            <div class="field-hint" id="nt-foto-info">JPG, PNG ou WEBP até 5 MB. Aparece no comunicado, no mural e no bloco de urgentes da Inicial.</div></div>
          <div id="nt-revisao-aviso" class="hidden" role="status"></div>
          <div id="nt-publicacao" class="card p-4 hidden">
            <label class="field-label">PUBLICAÇÃO</label>
            <div class="flex gap-2 flex-wrap mb-3" id="nt-modos"></div>
            <div id="nt-quando-wrap" class="hidden">
              <label class="field-label" for="nt-quando" id="nt-quando-rotulo">DATA E HORA DA PUBLICAÇÃO *</label>
              <input type="datetime-local" id="nt-quando" class="field-input max-w-xs">
              <div class="field-hint">Horário do seu dispositivo. Ao chegar a hora o aviso passa a aparecer no mural automaticamente (sem ação do administrador).</div>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2 flex-wrap">
            <a href="#/admin/noticias" class="btn-outline px-6 py-2.5">Cancelar</a>
            <button type="button" data-action="save-noticia" id="nt-salvar" class="btn-crimson px-6 py-2.5" disabled>Carregando…</button>
          </div>
        </form>
        <aside class="space-y-4">
          <div class="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400">PRÉVIA NO MURAL</div>
          <div class="card overflow-hidden ring-1 ring-crimson/30">
            <div class="p-5">
              <div class="flex items-center justify-between mb-2"><div class="flex gap-2" id="pv-badges"></div><span class="text-xs text-slate-400" id="pv-quando"></span></div>
              <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-2" id="pv-titulo"></h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-3" id="pv-corpo"></p>
              <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span class="flex items-center gap-2 text-xs text-slate-500"><span class="avatar-mini">${UI.foto(autor)}${esc(UI.iniciais(autor))}</span> Publicado por: ${esc(autor)}</span></div>
            </div>
          </div>
          <div class="card p-5 ring-1 ring-crimson/20">
            <div class="font-bold text-crimson mb-1">Diretrizes de Publicação Decós</div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Avisos <b>Urgentes</b> aparecem com destaque no mural e geram uma notificação para todos os colaboradores ativos — uma única vez, quando ficam publicados (nos agendados, no horário marcado).</p>
            <p class="text-xs text-slate-400 mt-3">Rascunhos e agendados ficam invisíveis aos colaboradores. Para tirar um aviso do ar sem perder o histórico, arquive-o na lista.</p>
          </div>
        </aside>
      </div>`,
      init() { iniciar(id); },
    };
  }

  /* ---------- foto opcional: { arquivo } a enviar, { remover: true } ou null (não mexe) ---------- */
  const $ = (i) => document.getElementById(i);
  let fotoPendente = null;
  const MAX_FOTO = 5 * 1024 * 1024;
  function mostrarFoto(url) {
    $("nt-foto-img").src = url; $("nt-foto-previa").hidden = !url; $("nt-foto-remover").hidden = !url;
    $("nt-foto-txt").textContent = url ? "Trocar foto" : "Escolher foto";
  }
  function ligarFoto() {
    fotoPendente = null;
    $("nt-foto").addEventListener("change", () => {
      const f = $("nt-foto").files?.[0];
      if (!f) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > MAX_FOTO) {
        $("nt-foto-info").textContent = "Use JPG, PNG ou WEBP de até 5 MB."; $("nt-foto").value = ""; return;
      }
      fotoPendente = { arquivo: f };
      mostrarFoto(URL.createObjectURL(f));
      $("nt-foto-info").textContent = `${f.name}: será enviada ao salvar.`;
    });
    $("nt-foto-remover").addEventListener("click", () => {
      fotoPendente = { remover: true }; $("nt-foto").value = ""; mostrarFoto("");
      $("nt-foto-info").textContent = "A foto será removida ao salvar.";
    });
  }
  async function salvarFoto(id) {
    if (!fotoPendente) return;
    if (fotoPendente.arquivo) await Services.avisos.definirImagem(id, fotoPendente.arquivo);
    else await Services.avisos.removerImagem(id);
    App.esquecerFotoAviso(id);
  }

  async function iniciar(id) {
    ligarFoto();
    const $ = (i) => document.getElementById(i);
    let atual = null;           // aviso carregado (edição)
    let modo = "publicar";
    const prioAtual = () => document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal";
    const setPrio = (p) => document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((x) => x.classList.toggle("prio-active", x.dataset.filter === p));

    const preview = () => {
      $("pv-titulo").textContent = $("nt-titulo").value || "Título da notícia";
      const c = $("nt-corpo").value;
      $("pv-corpo").textContent = c ? (c.length > 150 ? c.slice(0, 150) + "…" : c) : "O texto da notícia aparece aqui.";
      $("pv-badges").innerHTML = (prioAtual() === "urgente" ? badge("red", "🔥 URGENTE") + " " : "") + badge("blue", esc($("nt-tipo").value.toUpperCase()));
      $("nt-contador").textContent = `${c.length} caracteres`;
      const q = $("nt-quando").value;
      $("pv-quando").textContent = modo === "agendar" ? (q ? `Agendado: ${fmtHora.format(new Date(q))}` : "Agendado") : modo === "rascunho" ? "Rascunho" : modo === "publicar" ? "Publicação imediata" : modo === "revisao" ? "Aguardando aprovação" : "";
    };
    const aplicarModo = (m) => {
      modo = m;
      document.querySelectorAll("#nt-modos [data-modo]").forEach((b) => b.classList.toggle("chip-active", b.dataset.modo === m));
      $("nt-quando-wrap").classList.toggle("hidden", m !== "agendar" && m !== "revisao");
      $("nt-quando-rotulo").textContent = m === "revisao" ? "DATA DESEJADA PARA PUBLICAR (OPCIONAL)" : "DATA E HORA DA PUBLICAÇÃO *";
      $("nt-salvar").textContent = BOTAO[m];
      preview();
    };

    document.querySelectorAll('[data-filter-group="prio"] [data-filter]').forEach((b) => b.addEventListener("click", () => { setPrio(b.dataset.filter); preview(); }));
    ["nt-titulo", "nt-corpo", "nt-tipo", "nt-quando"].forEach((i) => $(i).addEventListener("input", preview));

    if (id) {
      try { atual = await Services.avisos.get(id); }
      catch (err) { App.toast(err.message || "Notícia não encontrada."); App.go("#/admin/noticias"); return; }
      if (!$("form-noticia")) return;
      $("nt-titulo").value = atual.titulo; $("nt-corpo").value = atual.conteudo;
      $("nt-tipo").value = TIPO_DE_CATEGORIA[atual.categoria] || "Comunicado";
      setPrio(atual.categoria === "urgente" ? "urgente" : "normal");
      if (atual.publicar_em && ["AGENDADO", "EM_REVISAO"].includes(atual.status)) $("nt-quando").value = paraInputLocal(atual.publicar_em);
      if (atual.destaque_ate) $("nt-destaque").value = paraInputLocal(atual.destaque_ate);
      if (atual.tem_imagem) App.fotoAviso(atual.id).then((url) => mostrarFoto(url)).catch(() => {});
      const faixa = $("nt-revisao-aviso");
      if (atual.status === "EM_REVISAO") {
        faixa.className = "revisao-faixa revisao-faixa-espera";
        faixa.innerHTML = `${icon("clock", "w-5 h-5 shrink-0")}<span><b>Aguardando aprovação</b>${atual.revisao_enviada_em ? ` desde ${esc(UI.fmtDataHora(atual.revisao_enviada_em))}` : ""}. Você ainda pode corrigir o texto.</span>`;
      } else if (atual.status === "RASCUNHO" && atual.revisao_motivo) {
        faixa.className = "revisao-faixa revisao-faixa-devolvido";
        faixa.innerHTML = `${icon("alert-triangle", "w-5 h-5 shrink-0")}<span><b>Devolvido para ajustes:</b> ${esc(atual.revisao_motivo)}</span>`;
      }
    }
    const status = atual ? atual.status : "NOVO";
    const modos = modosPara(status, App.can("approve"));
    const box = $("nt-publicacao");
    if (modos.length > 1) {
      box.classList.remove("hidden");
      $("nt-modos").innerHTML = modos.map((m) => `<button type="button" class="chip" data-modo="${m}">${MODOS[m]}</button>`).join("");
      $("nt-modos").querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => aplicarModo(b.dataset.modo)));
    }
    $("nt-salvar").disabled = false;
    $("form-noticia").dataset.status = status;
    aplicarModo(modos[0]);
  }

  async function submitNoticia() {
    const f = document.getElementById("form-noticia");
    if (!f) return;
    const $ = (i) => document.getElementById(i);
    const modo = document.querySelector("#nt-modos .chip-active")?.dataset.modo || "salvar";
    const atualStatus = f.dataset.status || "NOVO";
    const titulo = $("nt-titulo").value.trim(), corpo = $("nt-corpo").value.trim();
    const exigeCompleto = modo !== "rascunho";
    if (exigeCompleto && titulo.length < 5) { App.toast("Informe um título com pelo menos 5 caracteres"); $("nt-titulo").focus(); return; }
    if (exigeCompleto && corpo.length < 10) { App.toast("Escreva o conteúdo da notícia antes de continuar"); $("nt-corpo").focus(); return; }
    if (!titulo || !corpo) { App.toast("Informe ao menos o título e o conteúdo do rascunho"); return; }
    const urgente = (document.querySelector('[data-filter-group="prio"] .prio-active')?.dataset.filter || "normal") === "urgente";
    const payload = { titulo, conteudo: corpo, categoria: urgente ? "urgente" : CATEGORIA_DE_TIPO[$("nt-tipo").value] || "comunicado" };

    let quandoIso = null;
    if (modo === "revisao" && $("nt-quando").value) {
      const d = new Date($("nt-quando").value);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) { App.toast("A data desejada deve estar no futuro"); $("nt-quando").focus(); return; }
      quandoIso = d.toISOString();
    }
    if (modo === "agendar") {
      const v = $("nt-quando").value;
      const d = v ? new Date(v) : null;
      if (!d || Number.isNaN(d.getTime())) { App.toast("Informe a data e a hora da publicação"); $("nt-quando").focus(); return; }
      if (d.getTime() <= Date.now()) { App.toast("A data de publicação deve estar no futuro"); $("nt-quando").focus(); return; }
      quandoIso = d.toISOString();
    }
    const destaqueTxt = $("nt-destaque").value;
    const destaque = destaqueTxt ? new Date(destaqueTxt) : null;
    if (destaque && Number.isNaN(destaque.getTime())) { App.toast("Data de destaque inválida"); $("nt-destaque").focus(); return; }
    const inicioPub = quandoIso ? new Date(quandoIso) : new Date();
    if (destaque && !f.dataset.id && destaque <= inicioPub) { App.toast("O destaque precisa terminar depois da publicação"); $("nt-destaque").focus(); return; }
    payload.destaque_ate = destaque ? destaque.toISOString() : null;
    const alvoStatus = { publicar: "PUBLICADO", agendar: "AGENDADO", rascunho: "RASCUNHO", salvar: null, revisao: "EM_REVISAO", retirar: "RASCUNHO" }[modo];
    if (f.dataset.id) {
      if (alvoStatus && (alvoStatus !== atualStatus || alvoStatus === "AGENDADO")) payload.status = alvoStatus;
      if (alvoStatus === "AGENDADO" || (alvoStatus === "EM_REVISAO" && quandoIso)) payload.publicar_em = quandoIso;
    } else {
      payload.status = alvoStatus;
      if (quandoIso) payload.publicar_em = quandoIso;
    }

    const botoes = document.querySelectorAll('[data-action="save-noticia"]');
    botoes.forEach((b) => { b.disabled = true; });
    try {
      const salvo = f.dataset.id ? await Services.avisos.update(f.dataset.id, payload) : await Services.avisos.create(payload);
      try { await salvarFoto(salvo.id); }
      catch (err) { App.toast(`Comunicado salvo, mas a foto não foi enviada: ${err.message || "tente de novo"}`); await App.loadApiData(); return; }
      await App.loadApiData();
      App.toast({ publicar: "Notícia publicada no mural!", agendar: `Notícia agendada para ${fmtHora.format(new Date(quandoIso || Date.now()))}`, rascunho: "Rascunho salvo", salvar: "Alterações salvas", revisao: "Enviado para revisão: você será avisado da decisão", retirar: "Retirado da revisão (voltou a rascunho)" }[modo]);
      setTimeout(() => App.go("#/admin/noticias"), 500);
    } finally {
      botoes.forEach((b) => { b.disabled = false; });
    }
  }

  Object.assign(PagesAdmin, { adminNoticiaNova, submitNoticia });
})();
