/* =========================================================================
   Tela: Minhas revisões (quem é responsável por algum documento ou tem avaliação pendente)
   Rota: #/revisoes
   Fontes: GET /documentos/minhas-revisoes (documentos sob minha responsabilidade, com prazo)
   e GET /avaliacoes-documentos (as avaliações designadas a mim). O responsável envia a nova
   versão por aqui (POST /documentos/{id}/versoes) e pode marcar a próxima revisão; os alertas
   de validade (30 dias, 7 dias e vencido) apontam para esta tela.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const ROT = { PENDENTE: ["blue", "Pendente"], EM_ANALISE: ["amber", "Em análise"], APROVADO: ["green", "Aprovado"], REJEITADO: ["red", "Rejeitado"] };
  const ABERTAS = ["PENDENTE", "EM_ANALISE"];
  const MAX_BYTES = 20 * 1024 * 1024;

  const selo = (d) => d.revisar_em ? PagesAdmin.seloValidade(d.revisar_em, d.dias_restantes) : badge("gray", "Sem prazo definido");

  function cartaoDocumento(d) {
    return `<li class="card p-5 flex items-start justify-between gap-4 flex-wrap">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap mb-1">${selo(d)}<span class="text-xs text-slate-500 dark:text-slate-400">${esc(d.categoria)} · v${esc(d.versao)}${d.setor ? ` · ${esc(d.setor)}` : ""}</span></div>
        <div class="font-bold text-slate-800 dark:text-slate-100">${esc(d.titulo)}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${d.revisar_em ? `Revisar até ${esc(d.revisar_em.split("-").reverse().join("/"))}` : "Peça a quem gerencia documentos para marcar a data de revisão."}</div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="btn-outline text-xs px-3 py-1.5" data-action="avaliacao-doc" data-id="${d.id}">${icon("eye", "w-4 h-4")} Abrir</button>
        <button type="button" class="btn-crimson text-xs px-3 py-1.5" data-rev-versao="${d.id}">${icon("upload", "w-4 h-4")} Enviar nova versão</button>
      </div></li>`;
  }

  function cartaoAvaliacao(a) {
    const [tom, nome] = ROT[a.status];
    const indisponivel = a.documento_ativo === false;
    return `<li class="card p-4 flex items-start justify-between gap-4 flex-wrap">
      <div class="min-w-0 flex-1">
        <div class="font-bold text-slate-800 dark:text-slate-100">${esc(a.documento_titulo || "Documento removido")}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(a.documento_categoria || "")} · solicitada em ${esc(UI.fmtDataHora(a.data_solicitacao))}</div>
        ${a.observacao ? `<div class="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line">${esc(a.observacao)}</div>` : ""}
        ${indisponivel ? `<div class="text-xs text-amber-700 dark:text-amber-300 mt-2">Documento inativo: indisponível para avaliação.</div>` : ""}
      </div>
      <div class="flex items-center gap-2 flex-wrap">${badge(tom, nome)}
        ${indisponivel ? "" : `<button type="button" class="btn-outline text-xs px-3 py-1.5" data-action="avaliacao-doc" data-id="${a.documento_id}">${icon("eye", "w-4 h-4")} Abrir</button>
        <button type="button" class="btn-crimson text-xs px-3 py-1.5" data-action="avaliacao-responder" data-id="${a.id}">Avaliar</button>`}</div></li>`;
  }

  function minhasRevisoes() {
    async function carregar() {
      const docsBox = document.getElementById("rev-docs"), avBox = document.getElementById("rev-avaliacoes");
      if (!docsBox) return;
      const [docs, avs] = await Promise.allSettled([
        Services.documentos.minhasRevisoes(),
        Services.avaliacoes.list({ page_size: 100, avaliador_id: App.state.user.id }),
      ]);
      if (!document.contains(docsBox)) return;
      if (docs.status === "fulfilled") {
        App.state.api.minhasRevisoes = docs.value.length;
        docsBox.innerHTML = docs.value.length ? `<ul class="space-y-3">${docs.value.map(cartaoDocumento).join("")}</ul>`
          : `<p class="card p-6 text-sm text-slate-500 dark:text-slate-400">Nenhum documento está sob a sua responsabilidade.</p>`;
      } else docsBox.innerHTML = `<p class="card p-6 text-sm text-slate-500 dark:text-slate-400">Não foi possível carregar seus documentos. ${esc(docs.reason?.message || "")}</p>`;
      const abertas = avs.status === "fulfilled" ? avs.value.items.filter((a) => ABERTAS.includes(a.status)) : [];
      App.state.api.avaliacoesPendentes = abertas.filter((a) => a.status === "PENDENTE").length;
      document.getElementById("rev-av-sec").hidden = !abertas.length;
      avBox.innerHTML = `<ul class="space-y-3">${abertas.map(cartaoAvaliacao).join("")}</ul>`;
    }
    PagesAvaliacoes.recarregar = carregar;
    return {
      title: "Minhas revisões",
      html: `
      <div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Documentos</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Minhas revisões</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">Documentos sob a sua responsabilidade, do prazo mais curto ao mais longo. Você recebe alerta faltando 30 e 7 dias e no vencimento. Revisou? Envie a nova versão e marque a próxima revisão.</p></div>
      <section aria-labelledby="rev-docs-h" class="mb-8"><h3 id="rev-docs-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-3">Documentos sob minha responsabilidade</h3>
        <div id="rev-docs"><p class="text-sm text-slate-500 dark:text-slate-400">Carregando…</p></div></section>
      <section id="rev-av-sec" aria-labelledby="rev-av-h" hidden><h3 id="rev-av-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-1">Avaliações pedidas a mim</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Abra o documento, leia e registre o resultado.</p>
        <div id="rev-avaliacoes"></div></section>`,
      init() {
        document.getElementById("rev-docs").addEventListener("click", (e) => {
          const b = e.target.closest("[data-rev-versao]");
          if (b) abrirEnvio(Number(b.dataset.revVersao));
        });
        carregar();
      },
    };
  }

  /* ---------- enviar nova versão (responsável) ---------- */
  function abrirEnvio(id) {
    App.openPanel("Enviar nova versão", `<form id="rev-form" class="space-y-4" novalidate>
      <div><label class="field-label" for="rev-arquivo">ARQUIVO *</label><input id="rev-arquivo" type="file" class="field-input" accept=".pdf,.doc,.docx,.xls,.xlsx">
        <div class="field-hint">PDF, DOC, DOCX, XLS ou XLSX até 20 MB. A versão anterior fica no histórico.</div></div>
      <div><label class="field-label" for="rev-rotulo">RÓTULO DA VERSÃO *</label><input id="rev-rotulo" class="field-input" maxlength="30" placeholder="Ex.: 2.0"></div>
      <div><label class="field-label" for="rev-obs">O QUE MUDOU</label><input id="rev-obs" class="field-input" maxlength="1000" placeholder="Opcional"></div>
      <div><label class="field-label" for="rev-proxima">PRÓXIMA REVISÃO</label><input id="rev-proxima" type="date" class="field-input" min="${new Date().toISOString().slice(0, 10)}">
        <div class="field-hint">Opcional. Marca o novo prazo e recomeça os alertas.</div></div>
      <p id="rev-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">Enviar e tornar vigente</button>
    </form>`);
    const $ = (x) => document.getElementById(x);
    const erro = (m) => { $("rev-erro").textContent = m; $("rev-erro").classList.remove("hidden"); };
    $("rev-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const file = $("rev-arquivo").files?.[0], rotulo = $("rev-rotulo").value.trim();
      if (!file) return erro("Escolha o arquivo da nova versão.");
      if (file.size > MAX_BYTES) return erro("O arquivo passa de 20 MB.");
      if (!rotulo) return erro("Informe o rótulo da versão (ex.: 2.0).");
      const fd = new FormData();
      fd.append("arquivo", file); fd.append("rotulo", rotulo); fd.append("vigente", "true");
      if ($("rev-obs").value.trim()) fd.append("observacao", $("rev-obs").value.trim());
      if ($("rev-proxima").value) fd.append("revisar_em", $("rev-proxima").value);
      const botao = e.submitter; if (botao) { botao.disabled = true; botao.textContent = "Enviando…"; }
      try {
        await Services.documentos.enviarVersao(id, fd);
        App.closePanel(); App.toast(`Versão ${rotulo} enviada e vigente`);
        PagesAvaliacoes.recarregar?.();
      } catch (err) { erro(err.message || "Não foi possível enviar."); if (botao) { botao.disabled = false; botao.textContent = "Enviar e tornar vigente"; } }
    });
  }

  /* ---------- responder uma avaliação (PUT /avaliacoes-documentos/{id}/resposta) ---------- */
  async function responder(id) {
    let a;
    try { a = await Services.avaliacoes.get(id); } catch (err) { App.toast(err.message || "Avaliação não encontrada."); return; }
    const opt = (k, rot) => `<option value="${k}" ${k === (a.status === "PENDENTE" ? "EM_ANALISE" : a.status) ? "selected" : ""}>${rot}</option>`;
    App.openPanel(`Avaliar: ${a.documento_titulo || "documento"}`, `<form data-form="avaliacao-resposta" data-id="${a.id}" class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">Abra o documento, leia e registre o resultado. Ao rejeitar, a observação é obrigatória.</p>
      <div><label class="field-label" for="av-status">RESULTADO</label><select id="av-status" name="status" class="field-input">${opt("EM_ANALISE", "Em análise")}${opt("APROVADO", "Aprovado")}${opt("REJEITADO", "Rejeitado")}</select></div>
      <div><label class="field-label" for="av-obs">OBSERVAÇÃO</label><textarea id="av-obs" name="observacao" class="field-input" rows="5" maxlength="5000" placeholder="Comentários sobre o documento">${esc(a.observacao || "")}</textarea></div>
      <button type="submit" class="btn-wine w-full py-3">Salvar</button></form>`);
  }

  async function submitResposta(f, v) {
    const corpo = { status: v.status };
    if ((v.observacao || "").trim()) corpo.observacao = v.observacao.trim();
    if (v.status === "REJEITADO" && !corpo.observacao) { App.toast("Informe a observação ao rejeitar."); return false; }
    await Services.avaliacoes.responder(f.dataset.id, corpo);
    App.toast(v.status === "EM_ANALISE" ? "Avaliação atualizada" : "Avaliação concluída — os administradores foram avisados");
    PagesAvaliacoes.recarregar?.();
    return true;
  }

  const PagesAvaliacoes = window.PagesAvaliacoes = window.PagesAvaliacoes || {};
  Object.assign(PagesAvaliacoes, { minhasRevisoes, responder, submitResposta });
})();
