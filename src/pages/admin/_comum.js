/* =========================================================================
   Peças compartilhadas das telas administrativas
   Cards de estatística, badges de status/prioridade, filtros, ações de
   linha, listas de tipos/setores e helpers de formulário.
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;

  function statCard(label, value, sub, ic, danger) {
    return `<div class="card p-5 ${danger ? "stat-danger" : ""}">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold tracking-wider ${danger ? "text-white/90" : "text-slate-500 dark:text-slate-400"}">${label}</span>
        <span class="${danger ? "text-white/80" : "text-slate-400"}">${icon(ic, "w-5 h-5")}</span>
      </div>
      <div class="flex items-end gap-2"><span class="text-3xl font-extrabold ${danger ? "text-white" : "text-slate-800 dark:text-slate-100"}">${value}</span>
      <span class="text-xs mb-1 ${danger ? "text-white/80" : "text-slate-400"}">${sub}</span></div>
    </div>`;
  }

  const statusBadge = (s) => {
    const map = { "Publicado": "green", "Agendado": "blue", "Rascunho": "gray", "Em Revisão": "amber" };
    return badge(map[s] || "gray", s);
  };
  const prioBadge = (p) => {
    if (p === "urgente") return badge("red", "🔥 URGENTE");
    if (p === "relevante") return badge("red-soft", "★ RELEVANTE");
    return badge("gray", "NORMAL");
  };
  const corDoc = (c) => c === "red" ? "red" : c === "amber" ? "amber" : c === "blue" ? "blue" : "green";
  const acoes = (previewAction, id, editHref, alvo, tipo, coll) => `<div class="flex items-center gap-1.5 justify-end pr-4">
    <button class="act-btn" data-action="${previewAction}" data-id="${id}" title="Visualizar">${icon("eye","w-4 h-4")}</button>
    <a href="${editHref}" class="act-btn" title="Editar">${icon("edit","w-4 h-4")}</a>
    <button class="act-btn act-btn-danger" data-action="delete-row" data-coll="${coll}" data-id="${id}" data-alvo="${esc(alvo)}" data-tipo="${tipo}" title="Excluir">${icon("trash","w-4 h-4")}</button></div>`;
  const filtro = (id, label, valores) => `<div><label class="field-label" for="${id}">${label}</label>
    <select id="${id}" class="field-input"><option value="">Todos</option>${valores.map((v) => `<option value="${esc(v.value ?? v)}">${esc(v.label ?? v)}</option>`).join("")}</select></div>`;
  const sel = (id) => document.getElementById(id)?.value || "";
  const opts = (arr, atual) => arr.map((v) => {
    const value = v.value ?? v, label = v.label ?? v;
    return `<option value="${esc(value)}" ${value === atual ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");

  const TIPOS_NOTICIA = ["Comunicado", "Evento", "Promoção", "Notícia"];
  const TIPOS_DOC = [
    { value: "POP", label: "Procedimento Operacional Padrão (POP)", cor: "red" },
    { value: "PROTOCOLO", label: "Protocolo Assistencial", cor: "blue" },
    { value: "MANUAL", label: "Manual", cor: "amber" },
    { value: "FORMULÁRIO", label: "Formulário", cor: "green" },
    { value: "NORMA", label: "Norma Institucional", cor: "blue" },
  ];
  const SETORES_DOC = ["Enfermagem Geral", "SCIH - Controle de Infecção", "Qualidade", "Farmácia", "Pronto Atendimento", "SESMT", "Recursos Humanos", "Tecnologia da Informação"];
  const permBadge = (p) => p === "download"
    ? `<span class="perm-badge perm-download">${icon("download","w-3.5 h-3.5")} Download Disponível</span>`
    : `<span class="perm-badge perm-view">${icon("eye","w-3.5 h-3.5")} Somente Visualização</span>`;

  /* ---------- helpers de formulário ---------- */
  function fieldLbl(t, forId) { return `<label class="field-label" ${forId ? `for="${forId}"` : ""}>${t}</label>`; }
  // Ícone temático em vez de numeração — as diretrizes são regras paralelas
  // e independentes (não uma sequência de passos), então "01/02/03" mentiria
  // sobre a estrutura do conteúdo.
  function guide(icon_, t, d) {
    return `<div class="flex gap-3"><span class="text-crimson mt-0.5">${icon(icon_,"w-4 h-4")}</span><div><div class="font-semibold text-sm text-slate-800 dark:text-slate-100">${t}</div><div class="text-xs text-slate-500 dark:text-slate-400">${d}</div></div></div>`;
  }

  // área de upload (clique ou arraste)
  function wireDrop(zone, onFile) {
    ["dragenter", "dragover"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("dropzone-over"); }));
    ["dragleave", "drop"].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove("dropzone-over"); }));
    zone.addEventListener("drop", (e) => onFile(e.dataTransfer.files[0]));
  }

  Object.assign(AdminUI, { statCard, statusBadge, prioBadge, corDoc, acoes, filtro, sel, opts, TIPOS_NOTICIA, TIPOS_DOC, SETORES_DOC, permBadge, fieldLbl, guide, wireDrop });
})();
