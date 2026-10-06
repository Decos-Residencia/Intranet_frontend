/* =========================================================================
   Tela: Minhas avaliações (todos os perfis)
   Rota: #/avaliacoes
   Fonte: GET /avaliacoes-documentos (o servidor devolve só as avaliações do usuário).
   O avaliador altera somente status e observação (PUT /avaliacoes-documentos/{id}/resposta).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const ROT = { PENDENTE: ["blue", "Pendente"], EM_ANALISE: ["amber", "Em análise"], APROVADO: ["green", "Aprovado"], REJEITADO: ["red", "Rejeitado"] };
  const ABERTAS = ["PENDENTE", "EM_ANALISE"];

  function cartao(a) {
    const [tom, nome] = ROT[a.status];
    const aberta = ABERTAS.includes(a.status);
    const indisponivel = a.documento_ativo === false;
    return `<div class="card p-4 flex items-start justify-between gap-4 flex-wrap" data-id="${a.id}">
      <div class="min-w-0 flex-1">
        <div class="font-bold text-slate-800 dark:text-slate-100 truncate">${esc(a.documento_titulo || "Documento removido")}</div>
        <div class="text-xs text-slate-400">${esc(a.documento_categoria || "")} · solicitada em ${esc(UI.fmtDataHora(a.data_solicitacao))}${a.data_avaliacao ? ` · concluída em ${esc(UI.fmtDataHora(a.data_avaliacao))}` : ""}</div>
        ${a.observacao ? `<div class="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line">${esc(a.observacao)}</div>` : ""}
        ${indisponivel ? `<div class="text-xs text-amber-600 mt-2">Documento inativo: indisponível para avaliação.</div>` : ""}
      </div>
      <div class="flex items-center gap-2 flex-wrap">${badge(tom, nome)}
        ${indisponivel ? "" : `<button class="btn-outline text-xs px-3 py-1.5" data-action="avaliacao-doc" data-id="${a.documento_id}">${icon("eye", "w-4 h-4")} Abrir documento</button>`}
        ${aberta && !indisponivel ? `<button class="btn-crimson text-xs px-3 py-1.5" data-action="avaliacao-responder" data-id="${a.id}">Avaliar</button>` : ""}</div></div>`;
  }

  function avaliacoes() {
    const estado = { aba: "abertas", itens: [] };
    const pintar = () => {
      const box = document.getElementById("av-lista"); if (!box) return;
      const lista = estado.itens.filter((a) => (estado.aba === "abertas") === ABERTAS.includes(a.status));
      box.innerHTML = lista.length ? lista.map(cartao).join("")
        : `<div class="card p-10 text-center text-slate-400">${estado.aba === "abertas" ? "Nenhuma avaliação pendente. 🎉" : "Nenhuma avaliação concluída ainda."}</div>`;
      document.getElementById("av-n-abertas").textContent = estado.itens.filter((a) => ABERTAS.includes(a.status)).length;
      document.getElementById("av-n-concl").textContent = estado.itens.filter((a) => !ABERTAS.includes(a.status)).length;
    };
    async function carregar() {
      try {
        const r = await Services.avaliacoes.list({ page_size: 100, avaliador_id: App.state.user.id });
        estado.itens = r.items; pintar();
        App.state.api.avaliacoesPendentes = r.items.filter((a) => ABERTAS.includes(a.status)).length;
      } catch (err) {
        const box = document.getElementById("av-lista");
        if (box) box.innerHTML = `<div class="card p-10 text-center text-slate-400">Não foi possível carregar suas avaliações. ${esc(err.message || "")}</div>`;
      }
    }
    PagesAvaliacoes.recarregar = carregar;
    return {
      title: "Minhas avaliações",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-400">Hospital Decós Intranet</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Minhas avaliações de documentos</h2></div>
      <div class="flex gap-2 mb-4" data-filter-group="av-aba">
        <button class="chip chip-active" data-filter="abertas">Pendentes (<span id="av-n-abertas">…</span>)</button>
        <button class="chip" data-filter="concluidas">Concluídas (<span id="av-n-concl">…</span>)</button></div>
      <div id="av-lista" class="space-y-3"><div class="card p-10 text-center text-slate-400">Carregando…</div></div>`,
      init() {
        document.querySelectorAll('[data-filter-group="av-aba"] [data-filter]').forEach((btn) => btn.addEventListener("click", () => {
          document.querySelectorAll('[data-filter-group="av-aba"] [data-filter]').forEach((b) => b.classList.remove("chip-active"));
          btn.classList.add("chip-active"); estado.aba = btn.dataset.filter; pintar();
        }));
        carregar();
      },
    };
  }

  async function responder(id) {
    let a;
    try { a = await Services.avaliacoes.get(id); } catch (err) { App.toast(err.message || "Avaliação não encontrada."); return; }
    const opt = (k, rot) => `<option value="${k}" ${k === (a.status === "PENDENTE" ? "EM_ANALISE" : a.status) ? "selected" : ""}>${rot}</option>`;
    App.openPanel(`Avaliar: ${a.documento_titulo || "documento"}`, `<form data-form="avaliacao-resposta" data-id="${a.id}" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">Abra o documento, leia e registre o resultado. Ao rejeitar, a observação é obrigatória.</p>
      <div><label class="field-label">RESULTADO</label><select name="status" class="field-input">${opt("EM_ANALISE", "Em análise")}${opt("APROVADO", "Aprovado")}${opt("REJEITADO", "Rejeitado")}</select></div>
      <div><label class="field-label">OBSERVAÇÃO</label><textarea name="observacao" class="field-input" rows="5" maxlength="5000" placeholder="Comentários sobre o documento">${esc(a.observacao || "")}</textarea></div>
      <button type="submit" class="btn-wine w-full py-3">Salvar</button></form>`);
  }

  async function submitResposta(f, v) {
    const corpo = { status: v.status };
    if ((v.observacao || "").trim()) corpo.observacao = v.observacao.trim();
    if (v.status === "REJEITADO" && !corpo.observacao) { App.toast("Informe a observação ao rejeitar."); return false; }
    await Services.avaliacoes.responder(f.dataset.id, corpo);
    App.toast(v.status === "EM_ANALISE" ? "Avaliação atualizada" : "Avaliação concluída — os administradores foram avisados");
    if (PagesAvaliacoes.recarregar) PagesAvaliacoes.recarregar();
    return true;
  }

  const PagesAvaliacoes = window.PagesAvaliacoes = window.PagesAvaliacoes || {};
  Object.assign(PagesAvaliacoes, { avaliacoes, responder, submitResposta });
  if (window.Pages) window.Pages.avaliacoes = avaliacoes;
})();
