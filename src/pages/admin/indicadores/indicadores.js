/* =========================================================================
   Tela: Indicadores (permissão ver_indicadores; padrão só ADMIN)
   Rota: #/admin/indicadores
   Fonte: GET /indicadores?de&ate. Leitura de avisos por setor, adesão aos treinamentos
   obrigatórios, tempo de atendimento dos chamados e documentos com revisão vencendo.
   Cada percentual vem com o número absoluto ao lado (nunca só a barra) e há exportação CSV.
   ========================================================================= */
(function () {
  const { icon, esc } = UI;
  const PERIODOS = [[30, "30 dias"], [90, "90 dias"], [365, "12 meses"]];

  const pct = (v) => (v === null || v === undefined ? "—" : `${String(v).replace(".", ",")}%`);
  const num = (v) => new Intl.NumberFormat("pt-BR").format(v);
  const isoDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dataBr = (iso) => iso.split("-").reverse().join("/");
  function horas(h) {
    if (h === null || h === undefined) return "—";
    // Espaço não separável: o valor e a unidade nunca quebram de linha no bloco estreito.
    if (h < 48) return `${String(h).replace(".", ",")}\u00a0h`;
    return `${String(Math.round((h / 24) * 10) / 10).replace(".", ",")}\u00a0dias`;
  }

  // Barra de uma série: a largura é o percentual; o texto ao lado repete o valor (não depende de cor).
  function barra(percentual, dica) {
    const largura = percentual === null ? 0 : Math.max(0, Math.min(100, percentual));
    return `<div class="ind-barra" title="${esc(dica)}"><div class="ind-trilho" aria-hidden="true"><span style="width:${largura}%"></span></div><span class="ind-pct">${pct(percentual)}</span></div>`;
  }

  function tabela(caption, cabecalho, linhas, vazio) {
    if (!linhas.length) return `<p class="ind-vazio">${esc(vazio)}</p>`;
    return `<div class="overflow-x-auto" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="ind-tabela"><caption class="sr-only">${esc(caption)}</caption>
      <thead><tr>${cabecalho.map(([t, cls]) => `<th scope="col" class="${cls || ""}">${t}</th>`).join("")}</tr></thead>
      <tbody>${linhas.join("")}</tbody></table></div>`;
  }

  function secao(id, ico, titulo, subtitulo, corpo) {
    return `<section class="card p-6" aria-labelledby="ind-${id}">
      <h3 id="ind-${id}" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">${icon(ico, "w-5 h-5 text-wine")} ${esc(titulo)}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${subtitulo}</p>${corpo}</section>`;
  }

  function resumo(d) {
    const { leitura: l, treinamentos: t, chamados: c, documentos: doc } = d;
    return [
      AdminUI.statCard("LEITURA DE AVISOS", pct(l.percentual), `${num(l.lidas)} de ${num(l.esperadas)} leituras`, "megaphone"),
      AdminUI.statCard("OBRIGATÓRIOS EM DIA", pct(t.percentual), `${num(t.cumpridas)} de ${num(t.obrigacoes)}`, "graduation"),
      AdminUI.statCard("TEMPO DE ATENDIMENTO", horas(c.tempo_medio_horas), `média · mediana ${horas(c.tempo_mediano_horas)}`, "clock"),
      AdminUI.statCard("CHAMADOS EM ABERTO", num(c.em_aberto_agora), c.mais_antigo_aberto_dias === null ? "nenhum" : c.mais_antigo_aberto_dias === 0 ? "mais antigo aberto hoje" : `mais antigo há ${c.mais_antigo_aberto_dias} ${c.mais_antigo_aberto_dias === 1 ? "dia" : "dias"}`, "help-circle"),
      AdminUI.statCard("REVISÃO DE DOCUMENTOS", num(doc.vencidos), `vencidos · ${num(doc.vencem_30_dias)} vencem em 30 dias`, "file-text", doc.vencidos > 0),
    ].join("");
  }

  function corpo(d) {
    const { leitura: l, treinamentos: t, chamados: c } = d;
    const leituraSetor = tabela("Leitura de avisos por setor",
      [["SETOR"], ["PESSOAS", "num"], ["LEITURA", "ind-barra-cel"], ["LIDAS / ESPERADAS", "num"]],
      l.por_setor.map((s) => `<tr><td class="font-semibold">${esc(s.setor)}</td><td class="num">${num(s.pessoas)}</td>
        <td>${barra(s.percentual, `${s.setor}: ${s.lidas} de ${s.esperadas} leituras (${pct(s.percentual)})`)}</td><td class="num">${num(s.lidas)} / ${num(s.esperadas)}</td></tr>`),
      "Nenhum aviso publicado no período.");
    const menosLidos = l.menos_lidos.length ? `<h4 class="font-bold text-slate-700 dark:text-slate-200 mt-6 mb-2">Avisos menos lidos</h4>
      <ul class="space-y-2">${l.menos_lidos.map((a) => `<li><a href="#/avisos/${a.aviso_id}" class="flex items-center gap-3 hover:underline">
        <span class="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">${esc(a.titulo)}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">${num(a.lidas)} de ${num(a.esperadas)} · <b>${pct(a.percentual)}</b></span></a></li>`).join("")}</ul>` : "";
    const porTema = tabela("Adesão por tema obrigatório",
      [["TEMA"], ["PÚBLICO", "num"], ["ADESÃO", "ind-barra-cel"], ["CONCLUÍRAM", "num"]],
      t.por_tema.map((x) => `<tr><td class="font-semibold">${esc(x.tema)}</td><td class="num">${num(x.publico)}</td>
        <td>${barra(x.percentual, `${x.tema}: ${x.concluidos} de ${x.publico} (${pct(x.percentual)})`)}</td><td class="num">${num(x.concluidos)}</td></tr>`),
      "Nenhum treinamento obrigatório ativo.");
    const porSetorT = tabela("Adesão aos obrigatórios por setor",
      [["SETOR"], ["OBRIGAÇÕES", "num"], ["EM DIA", "ind-barra-cel"], ["CUMPRIDAS", "num"]],
      t.por_setor.map((s) => `<tr><td class="font-semibold">${esc(s.setor)}</td><td class="num">${num(s.obrigacoes)}</td>
        <td>${barra(s.percentual, `${s.setor}: ${s.cumpridas} de ${s.obrigacoes} (${pct(s.percentual)})`)}</td><td class="num">${num(s.cumpridas)}</td></tr>`),
      "Nenhum setor com treinamento obrigatório.");
    const chamados = tabela("Chamados por categoria",
      [["CATEGORIA"], ["ABERTOS", "num"], ["CONCLUÍDOS", "num"], ["TEMPO MÉDIO", "num"]],
      c.por_categoria.map((x) => `<tr><td class="font-semibold">${esc(x.categoria)}</td><td class="num">${num(x.total)}</td><td class="num">${num(x.concluidos)}</td><td class="num">${horas(x.tempo_medio_horas)}</td></tr>`),
      "Nenhum chamado aberto no período.");
    return `
      ${secao("leitura", "megaphone", "Leitura de avisos por setor", `${num(l.avisos)} ${l.avisos === 1 ? "aviso publicado" : "avisos publicados"} no período. Conta quem já trabalhava aqui quando o aviso saiu. Setores com menor leitura aparecem primeiro.`, leituraSetor + menosLidos)}
      ${secao("treinos", "graduation", "Adesão aos treinamentos obrigatórios", "Situação de hoje: presença confirmada numa turma do tema. Vale para o público de cada tema (setor ou perfil).",
        `<div class="grid grid-cols-1 xl:grid-cols-2 gap-6"><div><h4 class="font-bold text-slate-700 dark:text-slate-200 mb-2">Por tema</h4>${porTema}</div><div><h4 class="font-bold text-slate-700 dark:text-slate-200 mb-2">Por setor</h4>${porSetorT}</div></div>`)}
      ${secao("chamados", "help-circle", "Tempo de atendimento dos chamados", `${num(c.abertos_no_periodo)} abertos e ${num(c.concluidos_no_periodo)} concluídos no período. ${c.ate_48h_percentual !== null ? `<b>${pct(c.ate_48h_percentual)}</b> dos concluídos foram resolvidos em até 48 h.` : ""}`, chamados)}`;
  }

  // CSV com tudo o que está na tela (";" e BOM para abrir certo no Excel brasileiro).
  function exportarCsv(d) {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = [["Indicadores da Intranet Decós", `${dataBr(d.de)} a ${dataBr(d.ate)}`], [],
      ["Leitura de avisos por setor"], ["Setor", "Pessoas", "Lidas", "Esperadas", "Percentual"],
      ...d.leitura.por_setor.map((s) => [s.setor, s.pessoas, s.lidas, s.esperadas, s.percentual]), [],
      ["Adesão por tema obrigatório"], ["Tema", "Público", "Concluíram", "Percentual"],
      ...d.treinamentos.por_tema.map((t) => [t.tema, t.publico, t.concluidos, t.percentual]), [],
      ["Adesão aos obrigatórios por setor"], ["Setor", "Obrigações", "Cumpridas", "Percentual"],
      ...d.treinamentos.por_setor.map((s) => [s.setor, s.obrigacoes, s.cumpridas, s.percentual]), [],
      ["Chamados por categoria"], ["Categoria", "Abertos", "Concluídos", "Tempo médio (h)"],
      ...d.chamados.por_categoria.map((c) => [c.categoria, c.total, c.concluidos, c.tempo_medio_horas])];
    const texto = "﻿" + linhas.map((l) => l.map(q).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `indicadores-${d.de}-a-${d.ate}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function adminIndicadores() {
    const hoje = new Date();
    const estado = { dias: 30, de: "", ate: "", dados: null };
    const periodo = () => {
      if (estado.de && estado.ate) return { de: estado.de, ate: estado.ate };
      const de = new Date(hoje); de.setDate(de.getDate() - estado.dias);
      return { de: isoDia(de), ate: isoDia(hoje) };
    };
    async function carregar() {
      const box = document.getElementById("ind-corpo"), tiles = document.getElementById("ind-resumo"), info = document.getElementById("ind-periodo");
      if (!box) return;
      box.setAttribute("aria-busy", "true");
      try {
        const d = await Services.indicadores.painel(periodo());
        if (!document.contains(box)) return;
        estado.dados = d;
        info.textContent = `Período: ${dataBr(d.de)} a ${dataBr(d.ate)}`;
        tiles.innerHTML = resumo(d);
        box.innerHTML = corpo(d);
        document.getElementById("ind-csv").disabled = false;
      } catch (err) {
        if (document.contains(box)) box.innerHTML = `<div class="card p-8 text-center text-slate-500 dark:text-slate-400">Não foi possível carregar os indicadores. ${esc(err.message || "")}</div>`;
      } finally { box.setAttribute("aria-busy", "false"); }
    }
    return {
      title: "Indicadores",
      html: `
      <div class="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Indicadores</h2>
          <p id="ind-periodo" class="text-sm text-slate-500 dark:text-slate-400 mt-1" aria-live="polite">Carregando…</p></div>
        <button type="button" id="ind-csv" class="btn-outline px-4 flex items-center gap-2" disabled>${icon("download", "w-4 h-4")} Exportar CSV</button>
      </div>
      <div class="flex gap-2 flex-wrap items-center mb-5" role="group" aria-label="Período">
        ${PERIODOS.map(([d, l]) => `<button type="button" class="chip ${d === 30 ? "chip-active" : ""}" data-ind-dias="${d}" aria-pressed="${d === 30}">${l}</button>`).join("")}
        <label class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-2">de <input id="ind-de" type="date" class="field-input py-1.5"></label>
        <label class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">até <input id="ind-ate" type="date" class="field-input py-1.5"></label>
      </div>
      <div id="ind-resumo" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6"></div>
      <div id="ind-corpo" class="space-y-6" aria-busy="true"><div class="card p-8 text-center text-slate-500 dark:text-slate-400">Carregando…</div></div>`,
      init() {
        document.querySelectorAll("[data-ind-dias]").forEach((b) => b.addEventListener("click", () => {
          document.querySelectorAll("[data-ind-dias]").forEach((x) => { x.classList.toggle("chip-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
          estado.dias = Number(b.dataset.indDias); estado.de = estado.ate = "";
          document.getElementById("ind-de").value = document.getElementById("ind-ate").value = "";
          carregar();
        }));
        const datas = () => {
          estado.de = document.getElementById("ind-de").value; estado.ate = document.getElementById("ind-ate").value;
          if (estado.de && estado.ate) {
            document.querySelectorAll("[data-ind-dias]").forEach((x) => { x.classList.remove("chip-active"); x.setAttribute("aria-pressed", "false"); });
            carregar();
          }
        };
        document.getElementById("ind-de").addEventListener("change", datas);
        document.getElementById("ind-ate").addEventListener("change", datas);
        document.getElementById("ind-csv").addEventListener("click", () => estado.dados && exportarCsv(estado.dados));
        carregar();
      },
    };
  }

  Object.assign(PagesAdmin, { adminIndicadores });
})();
