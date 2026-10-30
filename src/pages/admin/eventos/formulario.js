/* =========================================================================
   Tela: Novo / Editar Evento (ADMIN)
   Rota: #/admin/eventos/novo · #/admin/eventos/:id/editar
   POST/PUT /eventos. Data e hora no fuso do navegador (enviadas em UTC). Vagas em branco = sem limite.
   ========================================================================= */
(function () {
  const { breadcrumb, esc, icon } = UI;
  const CATEGORIAS = ["Obrigatório", "Treinamento", "Campanha", "Institucional", "SIPAT"];
  // O rótulo aponta para o primeiro campo com id do bloco (leitores de tela anunciam o nome).
  const fld = (label, html, hint) => {
    const alvo = (html.match(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/) || [])[1];
    return `<div><label class="field-label" ${alvo ? `for="${alvo}"` : ""}>${label}</label>${html}${hint ? `<div class="field-hint">${hint}</div>` : ""}</div>`;
  };
  const $ = (i) => document.getElementById(i);
  const paraLocal = (iso) => {
    const d = new Date(iso); const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  function adminEventoForm(id) {
    return {
      title: id ? "Editar Evento" : "Novo Evento",
      html: `
      ${breadcrumb([{ label: "Início", route: "#/dashboard" }, { label: "Eventos", route: "#/admin/eventos" }, { label: id ? "Editar" : "Novo evento" }])}
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet • Painel Administrador</div>
      <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">${id ? "Editar Evento" : "Novo Evento ou Treinamento"}</h2></div>
      <form id="form-evento" data-id="${esc(id || "")}" data-action="prevent" class="max-w-3xl space-y-5">
        <div id="ev-revisao-aviso" class="hidden" role="status"></div>
        <div class="card p-6 space-y-4">
          ${fld("TÍTULO *", `<input id="ev-titulo" class="field-input" maxlength="200" placeholder="Ex: Treinamento Anual NR-32">`)}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("CATEGORIA *", `<input id="ev-categoria" class="field-input" maxlength="60" list="ev-cats" placeholder="Ex: Obrigatório, Campanha"><datalist id="ev-cats">${CATEGORIAS.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>`)}
            ${fld("ORGANIZADOR *", `<input id="ev-org" class="field-input" maxlength="150" placeholder="Ex: SESMT">`)}
          </div>
          ${fld("TIPO *", `<select id="ev-tipo" class="field-input"><option value="EVENTO">Evento</option><option value="TREINAMENTO">Treinamento (educação continuada)</option></select>`)}
          <div id="ev-obrig-box" class="hidden">${fld("TREINAMENTO OBRIGATÓRIO", `<select id="ev-obrig" class="field-input"><option value="">— Não é turma de obrigatório —</option></select>`, "Ligue a turma a um tema obrigatório: quem tiver presença confirmada sai da lista de pendentes. <a href=\"#/admin/treinamentos\" class=\"underline\">Gerenciar temas</a>")}</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("INÍCIO *", `<input id="ev-inicio" type="datetime-local" class="field-input">`)}
            ${fld("FIM *", `<input id="ev-fim" type="datetime-local" class="field-input">`, "Horário do seu dispositivo.")}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("LOCAL *", `<input id="ev-local" class="field-input" maxlength="200" placeholder="Ex: Auditório Central (Bloco A)">`)}
            ${fld("VAGAS", `<input id="ev-vagas" type="number" min="1" max="100000" step="1" inputmode="numeric" class="field-input" placeholder="Em branco = sem limite" aria-describedby="ev-vagas-resumo">`, `Quando as vagas acabam, as inscrições fecham sozinhas. <span id="ev-vagas-resumo" class="font-semibold">Sem limite de vagas.</span>`)}
          </div>
          ${fld("RESUMO *", `<textarea id="ev-desc" class="field-input" rows="2" maxlength="500" placeholder="Uma ou duas frases para a lista de eventos"></textarea>`)}
          ${fld("DESCRIÇÃO COMPLETA", `<textarea id="ev-longa" class="field-input" rows="6" placeholder="Detalhes do evento. Uma linha em branco separa os parágrafos."></textarea>`)}
        </div>
        <div class="card p-6 space-y-5">
          <div><div class="font-bold text-slate-800 dark:text-slate-100">Fotos do evento</div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Envie duas versões. A intranet recorta e ajusta cada uma automaticamente para o formato certo (pelo centro da imagem). JPG, PNG ou WEBP até 5 MB.</p></div>
          ${blocoFoto("banner", "Foto esticada (Inicial)", "Faixa larga do carrossel da Inicial. Prefira fotos horizontais e abertas.")}
          ${blocoFoto("capa", "Foto normal", "Topo da página do evento e cartões do calendário.")}
        </div>
        <div class="card p-4 hidden" id="ev-modos-box"><label class="field-label">PUBLICAÇÃO</label>
          <div class="flex gap-2 flex-wrap" id="ev-modos"></div>
          <div class="field-hint">Ao publicar, todos os colaboradores recebem uma notificação (uma única vez).</div></div>
        <div class="flex items-center justify-between gap-3 flex-wrap"><div id="ev-estado" class="text-sm font-semibold hidden"></div>
          <div class="flex gap-3 ml-auto"><a href="#/admin/eventos" class="btn-outline px-6 py-2.5">Cancelar</a>
            <button type="button" id="ev-salvar" data-action="save-evento" class="btn-crimson px-6 py-2.5" disabled>Carregando…</button></div></div>
      </form>`,
      init() { iniciar(id); },
    };
  }

  const ROTULO_MODO = { publicar: "Publicar agora", rascunho: "Salvar como rascunho", revisao: "Enviar para revisão", salvar: "Salvar alterações", retirar: "Retirar da revisão" };
  const BOTAO = { publicar: "Publicar evento", rascunho: "Salvar rascunho", salvar: "Salvar alterações", revisao: "Enviar para revisão", retirar: "Retirar da revisão" };
  // Quem aprova publica; os demais enviam para revisão (spec 003).
  const modosPara = (status, aprova) => aprova
    ? ({ NOVO: ["publicar", "rascunho"], RASCUNHO: ["rascunho", "publicar"] })[status] || ["salvar"]
    : ({ NOVO: ["revisao", "rascunho"], RASCUNHO: ["revisao", "rascunho"], EM_REVISAO: ["salvar", "retirar"] })[status] || ["salvar"];
  function msg(tipo, texto) {
    const el = $("ev-estado"); if (!el) return;
    el.className = `text-sm font-semibold ${tipo === "erro" ? "text-red-600" : tipo === "ok" ? "text-green-600" : "text-slate-600"} ${texto ? "" : "hidden"}`;
    el.textContent = texto ? (tipo === "erro" ? "⚠ " : tipo === "ok" ? "✓ " : "⏳ ") + texto : "";
  }

  // Foto: { arquivo } a enviar ao salvar, { remover: true } para tirar, ou null para não mexer.
  // Duas fotos: "banner" (esticada, 21:8, carrossel da Inicial) e "capa" (normal, 16:10).
  // Ao escolher, a imagem é recortada pelo centro e redimensionada no navegador antes do envio.
  const FORMATOS = { banner: { w: 1680, h: 640, rotulo: "esticada" }, capa: { w: 1280, h: 800, rotulo: "normal" } };
  const FOTO_MAX = 5 * 1024 * 1024, FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"];
  let pendentes = { banner: null, capa: null };

  function blocoFoto(tipo, titulo, ajuda) {
    const f = FORMATOS[tipo];
    return `<div class="ev-foto-bloco" data-foto-bloco="${tipo}">
      <div class="flex items-baseline justify-between gap-2 flex-wrap"><span class="font-semibold text-slate-800 dark:text-slate-100">${titulo}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400">formato ${f.w / 80 | 0}:${f.h / 80 | 0} · ajustado automaticamente</span></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">${ajuda}</p>
      <div class="ev-foto-previa ev-foto-previa-${tipo}" id="ev-foto-previa-${tipo}" style="aspect-ratio:${f.w}/${f.h}"><span class="ev-foto-vazia">${icon("image", "w-8 h-8")}<span>Sem foto</span></span></div>
      <input id="ev-foto-${tipo}" type="file" class="file-input-hidden" accept="image/jpeg,image/png,image/webp" aria-label="${titulo} do evento" tabindex="-1">
      <div class="flex gap-2 flex-wrap mt-2">
        <button type="button" id="ev-foto-escolher-${tipo}" class="btn-outline px-4">${icon("upload", "w-4 h-4")} Escolher foto</button>
        <button type="button" id="ev-foto-remover-${tipo}" class="btn-outline px-4 hidden">${icon("trash", "w-4 h-4")} Remover</button>
      </div>
      <p id="ev-foto-msg-${tipo}" class="text-sm text-slate-500 dark:text-slate-400 mt-1" aria-live="polite"></p></div>`;
  }

  // Recorta pelo centro (cobre o formato inteiro, sem faixas) e devolve um JPEG.
  function ajustarProporcao(arquivo, { w, h }) {
    return new Promise((ok, falha) => {
      const url = URL.createObjectURL(arquivo), img = new Image();
      img.onload = () => {
        const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const sw = w / escala, sh = h / escala;
        const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
        const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d"); ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não foi possível ajustar a foto."))), "image/jpeg", 0.88);
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error("Arquivo de imagem inválido.")); };
      img.src = url;
    });
  }

  function mostrarPrevia(tipo, url, alt) {
    $(`ev-foto-previa-${tipo}`).innerHTML = url ? `<img src="${url}" alt="${esc(alt)}" class="ev-foto-img">`
      : `<span class="ev-foto-vazia">${icon("image", "w-8 h-8")}<span>Sem foto</span></span>`;
    $(`ev-foto-remover-${tipo}`).classList.toggle("hidden", !url);
  }
  function ligarFoto() {
    pendentes = { banner: null, capa: null };
    Object.keys(FORMATOS).forEach((tipo) => {
      const input = $(`ev-foto-${tipo}`), msg = $(`ev-foto-msg-${tipo}`);
      $(`ev-foto-escolher-${tipo}`).addEventListener("click", () => (input.showPicker ? input.showPicker() : input.click()));
      input.addEventListener("change", async () => {
        const f = input.files?.[0];
        if (!f) return;
        const erro = !FOTO_TIPOS.includes(f.type) ? "Envie JPG, PNG ou WEBP." : f.size > FOTO_MAX ? "A foto passa do limite de 5 MB." : "";
        if (erro) { msg.textContent = erro; input.value = ""; return; }
        msg.textContent = "Ajustando a foto…";
        try {
          const ajustada = await ajustarProporcao(f, FORMATOS[tipo]);
          pendentes[tipo] = { arquivo: new File([ajustada], `${tipo}.jpg`, { type: "image/jpeg" }) };
          mostrarPrevia(tipo, URL.createObjectURL(ajustada), `Prévia da foto ${FORMATOS[tipo].rotulo}`);
          msg.textContent = `Foto ajustada ao formato ${FORMATOS[tipo].rotulo}. Será enviada ao salvar.`;
        } catch (err) { msg.textContent = err.message; input.value = ""; }
      });
      $(`ev-foto-remover-${tipo}`).addEventListener("click", () => {
        pendentes[tipo] = { remover: true }; input.value = "";
        mostrarPrevia(tipo, null); msg.textContent = "A foto será removida ao salvar.";
      });
    });
  }
  async function salvarFoto(id) {
    if (!id) return;
    for (const tipo of Object.keys(FORMATOS)) {
      const p = pendentes[tipo];
      if (!p) continue;
      if (p.remover) await Services.eventos.removerImagem(id, tipo);
      else { const fd = new FormData(); fd.append("arquivo", p.arquivo); await Services.eventos.enviarImagem(id, fd, tipo); }
    }
    App.esquecerFoto(id);
  }

  // Temas obrigatórios ativos no seletor; o vínculo atual aparece mesmo se o tema foi desativado.
  async function carregarTemas(atual) {
    let temas = [];
    try { temas = await Services.treinamentos.listar(); } catch (_) { temas = []; }
    const sel = $("ev-obrig"); if (!sel) return;
    sel.insertAdjacentHTML("beforeend", temas.filter((t) => t.ativo || t.id === atual)
      .map((t) => `<option value="${t.id}">${esc(t.tema)}${t.ativo ? "" : " (desativado)"}</option>`).join(""));
    sel.value = atual ? String(atual) : "";
  }
  // Vagas: número inteiro, null (em branco = sem limite) ou undefined (inválido).
  // Texto que o navegador não entende ("20 vagas", "1,5") chega como "" com badInput: nunca vira "sem limite".
  function lerVagas() {
    const campo = $("ev-vagas");
    if (campo.validity.badInput) return undefined;
    const bruto = campo.value.trim();
    if (!bruto) return null;
    const n = Number(bruto);
    return Number.isInteger(n) && n >= 1 && n <= 100000 ? n : undefined;
  }
  function resumoVagas() {
    const n = lerVagas(), el = $("ev-vagas-resumo"); if (!el) return;
    el.textContent = n === undefined ? "Número inválido." : n === null ? "Sem limite de vagas." : `Limite: ${n} ${n === 1 ? "vaga" : "vagas"}.`;
    el.classList.toggle("text-red-600", n === undefined);
  }
  function alternarObrig() { $("ev-obrig-box")?.classList.toggle("hidden", $("ev-tipo").value !== "TREINAMENTO"); }

  async function iniciar(id) {
    let status = "NOVO", obrigatorio = null;
    ligarFoto();
    $("ev-tipo").addEventListener("change", alternarObrig);
    $("ev-vagas").addEventListener("input", resumoVagas);
    if (id) {
      try {
        const e = await Services.eventos.get(id);
        if (!$("form-evento")) return;
        status = e.status;
        $("ev-titulo").value = e.titulo; $("ev-categoria").value = e.categoria; $("ev-tipo").value = e.tipo || "EVENTO"; $("ev-org").value = e.organizador; $("ev-local").value = e.local;
        $("ev-inicio").value = paraLocal(e.inicio); $("ev-fim").value = paraLocal(e.fim); $("ev-vagas").value = e.vagas ?? "";
        $("ev-desc").value = e.descricao; $("ev-longa").value = e.descricao_longa || "";
        obrigatorio = e.obrigatorio_id || null;
        const faixa = $("ev-revisao-aviso");
        if (e.status === "EM_REVISAO") {
          faixa.className = "revisao-faixa revisao-faixa-espera";
          faixa.innerHTML = `${icon("clock", "w-5 h-5 shrink-0")}<span><b>Aguardando aprovação</b>${e.revisao_enviada_em ? ` desde ${esc(UI.fmtDataHora(e.revisao_enviada_em))}` : ""}. Você ainda pode corrigir os dados.</span>`;
        } else if (e.status === "RASCUNHO" && e.revisao_motivo) {
          faixa.className = "revisao-faixa revisao-faixa-devolvido";
          faixa.innerHTML = `${icon("alert-triangle", "w-5 h-5 shrink-0")}<span><b>Devolvido para ajustes:</b> ${esc(e.revisao_motivo)}</span>`;
        }
        if (e.tem_imagem) App.fotoEvento(e.id, "capa").then((url) => mostrarPrevia("capa", url, `Foto normal atual do evento ${e.titulo}`)).catch(() => {});
        if (e.tem_banner) App.fotoEvento(e.id, "banner").then((url) => mostrarPrevia("banner", url, `Foto esticada atual do evento ${e.titulo}`)).catch(() => {});
      } catch (err) { App.toast(err.message || "Evento não encontrado."); App.go("#/admin/eventos"); return; }
    }
    await carregarTemas(obrigatorio);
    alternarObrig();
    resumoVagas();
    const modos = modosPara(status, App.can("approve"));
    const aplicar = (m) => {
      $("form-evento").dataset.modo = m;
      document.querySelectorAll("#ev-modos [data-modo]").forEach((b) => b.classList.toggle("chip-active", b.dataset.modo === m));
      $("ev-salvar").textContent = BOTAO[m];
    };
    if (modos.length > 1) {
      $("ev-modos-box").classList.remove("hidden");
      $("ev-modos").innerHTML = modos.map((m) => `<button type="button" class="chip" data-modo="${m}">${ROTULO_MODO[m]}</button>`).join("");
      $("ev-modos").querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => aplicar(b.dataset.modo)));
    }
    $("form-evento").dataset.status = status;
    $("ev-salvar").disabled = false;
    aplicar(modos[0]);
  }

  async function submitEvento() {
    const f = $("form-evento"); if (!f) return;
    const v = (i) => $(i).value.trim();
    const modo = f.dataset.modo, id = f.dataset.id, atual = f.dataset.status;
    const obrig = [["ev-titulo", "o título"], ["ev-categoria", "a categoria"], ["ev-org", "o organizador"], ["ev-local", "o local"], ["ev-desc", "o resumo"]];
    for (const [i, nome] of obrig) if (!v(i)) { msg("erro", `Informe ${nome}.`); $(i).focus(); return; }
    const ini = $("ev-inicio").value ? new Date($("ev-inicio").value) : null, fim = $("ev-fim").value ? new Date($("ev-fim").value) : null;
    if (!ini || !fim || Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime())) { msg("erro", "Informe início e fim."); return; }
    if (fim < ini) { msg("erro", "O fim não pode ser anterior ao início."); return; }
    if (modo === "publicar" && ini <= new Date()) { msg("erro", "Não é possível publicar um evento que já começou."); return; }
    const vagas = lerVagas();
    if (vagas === undefined) { msg("erro", "Vagas deve ser um número inteiro de 1 a 100000 (ou em branco para sem limite)."); $("ev-vagas").focus(); return; }
    const corpo = { titulo: v("ev-titulo"), descricao: v("ev-desc"), descricao_longa: v("ev-longa") || null, categoria: v("ev-categoria"), tipo: $("ev-tipo").value, inicio: ini.toISOString(), fim: fim.toISOString(), local: v("ev-local"), organizador: v("ev-org"), vagas,
      obrigatorio_id: $("ev-tipo").value === "TREINAMENTO" && $("ev-obrig").value ? Number($("ev-obrig").value) : null };
    const botao = $("ev-salvar"); botao.disabled = true; msg("enviando", "Salvando…");
    try {
      let salvo;
      if (id) {
        if (modo === "publicar" && atual === "RASCUNHO") corpo.status = "PUBLICADO";
        if (modo === "revisao" && atual !== "EM_REVISAO") corpo.status = "EM_REVISAO";
        if (modo === "retirar") corpo.status = "RASCUNHO";
        salvo = await Services.eventos.update(id, corpo);
      } else {
        salvo = await Services.eventos.create({ ...corpo, status: { publicar: "PUBLICADO", revisao: "EM_REVISAO" }[modo] || "RASCUNHO" });
      }
      try { await salvarFoto(salvo.id); }
      catch (err) { msg("erro", `Evento salvo, mas a foto não foi enviada: ${err.message || "tente de novo"}.`); botao.disabled = false; await App.loadApiData(); return; }
      msg("ok", "Evento salvo.");
      App.toast({ publicar: "Evento publicado — os colaboradores foram avisados", rascunho: "Rascunho salvo", revisao: "Enviado para revisão: você será avisado da decisão", retirar: "Retirado da revisão (voltou a rascunho)" }[modo] || "Alterações salvas");
      await App.loadApiData();
      setTimeout(() => App.go("#/admin/eventos"), 400);
    } catch (err) { msg("erro", err.message || "Não foi possível salvar o evento."); botao.disabled = false; }
  }

  Object.assign(PagesAdmin, { adminEventoForm, submitEvento });
})();
