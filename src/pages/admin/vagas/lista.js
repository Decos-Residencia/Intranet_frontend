/* =========================================================================
   Tela: Gerenciar vagas internas (quem tem "gerenciar vagas": RH e ADMIN)
   Rota: #/admin/vagas
   Publicar, editar e encerrar vagas; ver e exportar quem demonstrou interesse.
   ========================================================================= */
(function () {
  const { icon, esc, badge } = UI;
  const dataBr = (s) => s.split("-").reverse().join("/");
  const hojeIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  function formulario(v) {
    const turnos = UI.TURNOS_VAGA;
    return `<form id="vg-form" class="space-y-4" novalidate>
      <div><label class="field-label" for="vgf-cargo">CARGO *</label><input id="vgf-cargo" class="field-input" maxlength="150" value="${esc(v?.cargo || "")}" placeholder="Ex.: Técnico(a) de enfermagem"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="field-label" for="vgf-setor">SETOR *</label><select id="vgf-setor" class="field-input">${App.setoresAll().map((s) => `<option value="${s.id}" ${v?.setor_id === s.id ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}</select></div>
        <div><label class="field-label" for="vgf-turno">TURNO *</label><select id="vgf-turno" class="field-input">${Object.entries(turnos).map(([k, l]) => `<option value="${k}" ${v?.turno === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      </div>
      <div><label class="field-label" for="vgf-prazo">CANDIDATURAS ATÉ *</label><input id="vgf-prazo" type="date" min="${hojeIso()}" class="field-input max-w-xs" value="${esc(v?.prazo || "")}"></div>
      <div><label class="field-label" for="vgf-desc">SOBRE A VAGA *</label><textarea id="vgf-desc" class="field-input" rows="4" maxlength="3000">${esc(v?.descricao || "")}</textarea></div>
      <div><label class="field-label" for="vgf-req">REQUISITOS *</label><textarea id="vgf-req" class="field-input" rows="3" maxlength="3000">${esc(v?.requisitos || "")}</textarea></div>
      ${v ? `<p class="field-hint">Quem já demonstrou interesse recebe uma notificação quando a vaga muda.</p>` : ""}
      <p id="vgf-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="submit" class="btn-wine w-full py-3">${v ? "Salvar alterações" : "Publicar vaga"}</button></form>`;
  }

  function linha(v) {
    return `<tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="py-3 pl-4"><a href="#/vagas/${v.id}" class="font-bold text-slate-800 dark:text-slate-100 hover:underline">${esc(v.cargo)}</a>
        <div class="text-xs text-slate-500 dark:text-slate-400">${esc(v.setor || "—")} · ${esc(UI.TURNOS_VAGA[v.turno] || v.turno)}</div></td>
      <td class="text-sm">${dataBr(v.prazo)}</td>
      <td>${v.status === "ENCERRADA" ? badge("gray", "Encerrada") : v.aceita_candidatura ? badge("green", "Aberta") : badge("amber", "Prazo vencido")}</td>
      <td><button type="button" class="leitores-btn" data-vg-interessados="${v.id}" aria-label="Ver interessados: ${v.interessados}">${icon("users", "w-3.5 h-3.5")} ${v.interessados}</button></td>
      <td class="text-right pr-4"><div class="flex gap-1.5 justify-end">
        <button type="button" class="act-btn" data-vg-editar="${v.id}" aria-label="Editar ${esc(v.cargo)}">${icon("edit", "w-4 h-4")}</button>
        ${v.status === "ABERTA" ? `<button type="button" class="btn-outline text-xs px-2.5 py-1.5" data-vg-encerrar="${v.id}">Encerrar</button>` : ""}
      </div></td></tr>`;
  }

  async function painelInteressados(v) {
    let lista;
    try { lista = await Services.vagas.interessados(v.id); } catch (err) { App.toast(err.message || "Não foi possível carregar."); return; }
    App.openPanel(`Interessados — ${esc(v.cargo)}`, lista.length
      ? `<div class="flex items-center justify-between gap-2 mb-3"><span class="text-sm text-slate-600 dark:text-slate-300">${lista.length} ${lista.length === 1 ? "pessoa" : "pessoas"}</span>
          <button type="button" class="btn-outline text-xs px-3" id="vg-csv">${icon("download", "w-3.5 h-3.5")} Exportar CSV</button></div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Informação confidencial do RH: não é compartilhada com a chefia.</p>
        <div class="card divide-y divide-slate-100 dark:divide-slate-800">${lista.map((i) => `<div class="p-3">
          <div class="flex items-center justify-between gap-2"><span class="font-semibold text-sm text-slate-800 dark:text-slate-100">${esc(i.nome)}</span><span class="text-xs text-slate-500 dark:text-slate-400">${esc(UI.fmtDataHora(i.criado_em))}</span></div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${esc([i.cargo, i.setor].filter(Boolean).join(" · ") || "—")} · <a href="mailto:${encodeURIComponent(i.email)}" class="underline">${esc(i.email)}</a></div>
          ${i.mensagem ? `<p class="text-sm text-slate-700 dark:text-slate-200 mt-1.5 whitespace-pre-line">“${esc(i.mensagem)}”</p>` : ""}</div>`).join("")}</div>`
      : `<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Ninguém demonstrou interesse ainda.</p>`);
    document.getElementById("vg-csv")?.addEventListener("click", async () => {
      try {
        const csv = await Services.vagas.interessadosCsv(v.id);
        App.downloadFile(`interessados-vaga-${v.id}.csv`, "﻿" + String(csv).replace(/^﻿/, ""), "text/csv;charset=utf-8");
        App.toast("Lista exportada");
      } catch (err) { App.toast(err.message || "Não foi possível exportar."); }
    });
  }

  function adminVagas() {
    let vagas = [];
    async function carregar() {
      const corpo = document.getElementById("vg-rows");
      if (!corpo) return;
      try {
        vagas = await Services.vagas.listar();
        if (!document.contains(corpo)) return;
        corpo.innerHTML = vagas.length ? vagas.map(linha).join("") : `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Nenhuma vaga publicada ainda.</td></tr>`;
      } catch (err) { corpo.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar. ${esc(err.message || "")}</td></tr>`; }
    }
    function abrir(v) {
      App.openPanel(v ? "Editar vaga" : "Nova vaga interna", formulario(v));
      const form = document.getElementById("vg-form"), erro = document.getElementById("vgf-erro");
      document.getElementById("vgf-cargo").focus();
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const val = (i) => document.getElementById(i).value.trim();
        const corpo = { cargo: val("vgf-cargo"), setor_id: Number(val("vgf-setor")), turno: val("vgf-turno"), prazo: val("vgf-prazo"), descricao: val("vgf-desc"), requisitos: val("vgf-req") };
        const falha = corpo.cargo.length < 2 ? "Informe o cargo." : !corpo.prazo ? "Informe o prazo de candidatura." : corpo.descricao.length < 5 ? "Descreva a vaga." : corpo.requisitos.length < 5 ? "Informe os requisitos." : "";
        if (falha) { erro.textContent = falha; erro.classList.remove("hidden"); return; }
        try {
          if (v) await Services.vagas.atualizar(v.id, corpo); else await Services.vagas.criar(corpo);
          App.closePanel(); App.toast(v ? "Vaga atualizada" : "Vaga publicada"); carregar();
        } catch (err) { erro.textContent = err.message || "Não foi possível salvar."; erro.classList.remove("hidden"); }
      });
    }
    return {
      title: "Gerenciar vagas",
      html: `
      <div class="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • RH</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Vagas internas</h2></div>
        <button type="button" id="vg-nova" class="btn-wine px-5">${icon("plus", "w-4 h-4")} Nova vaga</button>
      </div>
      <div class="card overflow-x-auto"><table class="w-full text-sm text-left">
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <th class="py-3 pl-4">VAGA</th><th>PRAZO</th><th>SITUAÇÃO</th><th>INTERESSADOS</th><th class="text-right pr-4">AÇÕES</th></tr></thead>
        <tbody id="vg-rows"><tr><td colspan="5" class="py-10 text-center text-slate-500 dark:text-slate-400">Carregando…</td></tr></tbody></table></div>`,
      init() {
        document.getElementById("vg-nova").addEventListener("click", () => abrir(null));
        document.getElementById("vg-rows").addEventListener("click", (ev) => {
          const b = ev.target.closest("button"); if (!b) return;
          const v = vagas.find((x) => String(x.id) === (b.dataset.vgEditar || b.dataset.vgEncerrar || b.dataset.vgInteressados));
          if (!v) return;
          if (b.dataset.vgEditar) abrir(v);
          else if (b.dataset.vgInteressados) painelInteressados(v);
          else App.openConfirm("Encerrar candidaturas?", `Ninguém mais poderá demonstrar interesse em "${esc(v.cargo)}".`, async () => {
            try { await Services.vagas.encerrar(v.id); App.toast("Vaga encerrada"); carregar(); } catch (err) { App.toast(err.message); }
          }, "Encerrar", "btn-wine");
        });
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminVagas });
})();
