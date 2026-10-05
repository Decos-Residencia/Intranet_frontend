/* =========================================================================
   Tela: Novo / Editar Evento (ADMIN)
   Rota: #/admin/eventos/novo · #/admin/eventos/:id/editar
   POST/PUT /eventos. Data e hora no fuso do navegador (enviadas em UTC). Vagas em branco = sem limite.
   ========================================================================= */
(function () {
  const { breadcrumb, esc } = UI;
  const CATEGORIAS = ["Obrigatório", "Treinamento", "Campanha", "Institucional", "SIPAT"];
  const fld = (label, html, hint) => `<div><label class="field-label">${label}</label>${html}${hint ? `<div class="field-hint">${hint}</div>` : ""}</div>`;
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
        <div class="card p-6 space-y-4">
          ${fld("TÍTULO *", `<input id="ev-titulo" class="field-input" maxlength="200" placeholder="Ex: Treinamento Anual NR-32">`)}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("CATEGORIA *", `<input id="ev-categoria" class="field-input" maxlength="60" list="ev-cats" placeholder="Ex: Obrigatório, Campanha"><datalist id="ev-cats">${CATEGORIAS.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>`)}
            ${fld("ORGANIZADOR *", `<input id="ev-org" class="field-input" maxlength="150" placeholder="Ex: SESMT">`)}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("INÍCIO *", `<input id="ev-inicio" type="datetime-local" class="field-input">`)}
            ${fld("FIM *", `<input id="ev-fim" type="datetime-local" class="field-input">`, "Horário do seu dispositivo.")}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${fld("LOCAL *", `<input id="ev-local" class="field-input" maxlength="200" placeholder="Ex: Auditório Central (Bloco A)">`)}
            ${fld("VAGAS", `<input id="ev-vagas" type="number" min="1" max="100000" class="field-input" placeholder="Em branco = sem limite">`, "Quando as vagas acabam, as inscrições fecham sozinhas.")}
          </div>
          ${fld("RESUMO *", `<textarea id="ev-desc" class="field-input" rows="2" maxlength="500" placeholder="Uma ou duas frases para a lista de eventos"></textarea>`)}
          ${fld("DESCRIÇÃO COMPLETA", `<textarea id="ev-longa" class="field-input" rows="6" placeholder="Detalhes do evento. Uma linha em branco separa os parágrafos."></textarea>`)}
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

  const ROTULO_MODO = { publicar: "Publicar agora", rascunho: "Salvar como rascunho" };
  const BOTAO = { publicar: "Publicar evento", rascunho: "Salvar rascunho", salvar: "Salvar alterações" };
  function msg(tipo, texto) {
    const el = $("ev-estado"); if (!el) return;
    el.className = `text-sm font-semibold ${tipo === "erro" ? "text-red-600" : tipo === "ok" ? "text-green-600" : "text-slate-600"} ${texto ? "" : "hidden"}`;
    el.textContent = texto ? (tipo === "erro" ? "⚠ " : tipo === "ok" ? "✓ " : "⏳ ") + texto : "";
  }

  async function iniciar(id) {
    let status = "NOVO";
    if (id) {
      try {
        const e = await Services.eventos.get(id);
        if (!$("form-evento")) return;
        status = e.status;
        $("ev-titulo").value = e.titulo; $("ev-categoria").value = e.categoria; $("ev-org").value = e.organizador; $("ev-local").value = e.local;
        $("ev-inicio").value = paraLocal(e.inicio); $("ev-fim").value = paraLocal(e.fim); $("ev-vagas").value = e.vagas ?? "";
        $("ev-desc").value = e.descricao; $("ev-longa").value = e.descricao_longa || "";
      } catch (err) { App.toast(err.message || "Evento não encontrado."); App.go("#/admin/eventos"); return; }
    }
    const modos = status === "NOVO" ? ["publicar", "rascunho"] : status === "RASCUNHO" ? ["rascunho", "publicar"] : ["salvar"];
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
    const vagas = v("ev-vagas") ? Number(v("ev-vagas")) : null;
    if (vagas !== null && (!Number.isInteger(vagas) || vagas < 1)) { msg("erro", "Vagas deve ser um número inteiro maior que zero (ou em branco)."); return; }
    const corpo = { titulo: v("ev-titulo"), descricao: v("ev-desc"), descricao_longa: v("ev-longa") || null, categoria: v("ev-categoria"), inicio: ini.toISOString(), fim: fim.toISOString(), local: v("ev-local"), organizador: v("ev-org"), vagas };
    const botao = $("ev-salvar"); botao.disabled = true; msg("enviando", "Salvando…");
    try {
      if (id) {
        if (modo === "publicar" && atual === "RASCUNHO") corpo.status = "PUBLICADO";
        await Services.eventos.update(id, corpo);
      } else {
        await Services.eventos.create({ ...corpo, status: modo === "publicar" ? "PUBLICADO" : "RASCUNHO" });
      }
      msg("ok", "Evento salvo.");
      App.toast(modo === "publicar" ? "Evento publicado — os colaboradores foram avisados" : modo === "rascunho" ? "Rascunho salvo" : "Alterações salvas");
      await App.loadApiData();
      setTimeout(() => App.go("#/admin/eventos"), 400);
    } catch (err) { msg("erro", err.message || "Não foi possível salvar o evento."); botao.disabled = false; }
  }

  Object.assign(PagesAdmin, { adminEventoForm, submitEvento });
})();
