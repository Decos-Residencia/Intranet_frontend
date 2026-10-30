/* =========================================================================
   Painel: Importar usuários por planilha (ADMIN), aberto em #/admin/usuarios
   Fonte: POST /usuarios/importacao (multipart). Primeiro confere (simular=true) e mostra cada
   linha; só libera "Importar" sem nenhum erro (o servidor também grava tudo ou nada).
   ========================================================================= */
(function () {
  const { icon, badge, esc } = UI;
  const ACAO = { criar: ["green", "Criar"], atualizar: ["blue", "Atualizar"], sem_mudanca: ["gray", "Sem mudança"], erro: ["red", "Erro"] };
  const COLUNAS = ["nome", "email", "setor", "cargo", "perfil", "matricula", "ramal", "data_nascimento", "data_admissao", "data_desligamento"];

  // Modelo com o cabeçalho certo e um exemplo usando um setor que existe ("; " como o Excel BR).
  function baixarModelo() {
    const setor = App.setoresAll()[0]?.nome || "Recepção Central";
    const exemplo = ["Maria da Silva", "maria.silva@hospitaldecos.com.br", setor, "Técnica de Enfermagem", "Colaborador", "", "2210", "15/08/1990", "05/01/2026", ""];
    const texto = "﻿" + [COLUNAS, exemplo].map((l) => l.join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "modelo-importacao-usuarios.csv" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function previa(r) {
    const resumo = [
      r.criar ? `<b>${r.criar}</b> para criar` : "", r.atualizar ? `<b>${r.atualizar}</b> para atualizar` : "",
      r.sem_mudanca ? `${r.sem_mudanca} sem mudança` : "", r.erros ? `<b class="text-red-700 dark:text-red-300">${r.erros} com erro</b>` : "",
    ].filter(Boolean).join(" · ");
    const linhas = r.linhas.map((l) => {
      const [tom, rot] = ACAO[l.acao];
      return `<tr class="border-b border-slate-100 dark:border-slate-800 align-top">
        <td class="py-2 pr-2 text-xs text-slate-500 dark:text-slate-400">${l.linha}</td>
        <td class="py-2 pr-2"><div class="font-semibold text-slate-800 dark:text-slate-100">${esc(l.nome || "—")}</div><div class="text-xs text-slate-500 dark:text-slate-400 break-all">${esc(l.email || "")}</div></td>
        <td class="py-2 pr-2">${badge(tom, rot)}</td>
        <td class="py-2 text-xs ${l.acao === "erro" ? "text-red-700 dark:text-red-300" : "text-slate-600 dark:text-slate-300"}">${esc(l.detalhes.join("; "))}</td></tr>`;
    }).join("");
    return `<p class="text-sm text-slate-700 dark:text-slate-200 mb-3" role="status">${r.total} ${r.total === 1 ? "pessoa" : "pessoas"} na planilha: ${resumo}.</p>
      ${r.erros ? `<p class="text-sm text-red-700 dark:text-red-300 mb-3">Corrija as linhas com erro e envie a planilha de novo: nada é gravado enquanto houver erro.</p>` : ""}
      <div class="max-h-80 overflow-y-auto" tabindex="0" role="region" aria-label="Resultado da conferência"><table class="w-full text-sm text-left">
        <caption class="sr-only">Resultado da conferência, linha a linha</caption>
        <thead><tr class="text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <th scope="col" class="py-2 pr-2">LINHA</th><th scope="col" class="py-2 pr-2">PESSOA</th><th scope="col" class="py-2 pr-2">AÇÃO</th><th scope="col" class="py-2">DETALHES</th></tr></thead>
        <tbody>${linhas}</tbody></table></div>`;
  }

  const formHtml = () => `<div class="space-y-4">
      <p class="text-sm text-slate-600 dark:text-slate-300">Envie um arquivo <b>.csv</b> (no Excel: <i>Salvar como → CSV</i>). Colunas obrigatórias: <b>nome, email e setor</b> (o nome do setor como está cadastrado). Opcionais: cargo, perfil (Leitura, Colaborador ou RH), matricula, ramal, data_nascimento, data_admissao e data_desligamento (dd/mm/aaaa). Até 500 pessoas.</p>
      <ul class="text-xs text-slate-500 dark:text-slate-400 list-disc pl-5 space-y-1">
        <li>O e-mail identifica a pessoa: quem é novo é criado; quem já existe tem atualizadas só as células preenchidas.</li>
        <li>Quem é criado recebe por e-mail uma senha temporária e cria a própria senha no primeiro acesso.</li>
        <li>Com data de desligamento, o acesso é desativado sozinho nesse dia. Administradores só pelo Controle de acesso.</li>
      </ul>
      <button type="button" id="imp-modelo" class="btn-outline text-sm px-4 py-2 flex items-center gap-2">${icon("download", "w-4 h-4")} Baixar modelo</button>
      <div><label class="field-label" for="imp-arquivo">PLANILHA (.CSV)</label><input id="imp-arquivo" type="file" accept=".csv,text/csv" class="field-input"></div>
      <button type="button" id="imp-conferir" class="btn-wine w-full py-3" disabled>Conferir planilha</button>
      <div id="imp-resultado"></div>
      <p id="imp-erro" class="text-sm text-red-700 dark:text-red-300 hidden" role="alert"></p>
      <button type="button" id="imp-aplicar" class="btn-crimson w-full py-3 hidden">Importar</button>
    </div>`;

  // Liga o fluxo (conferir → importar). `aoConcluir` fecha o painel ou recarrega a página.
  function ligar(aoConcluir) {
    const $ = (id) => document.getElementById(id);
    const campo = $("imp-arquivo"), conferir = $("imp-conferir"), aplicar = $("imp-aplicar"), erro = $("imp-erro"), saida = $("imp-resultado");
    const falha = (msg) => { erro.textContent = msg; erro.classList.remove("hidden"); };
    $("imp-modelo").addEventListener("click", baixarModelo);
    campo.addEventListener("change", () => {
      conferir.disabled = !campo.files.length; aplicar.classList.add("hidden"); saida.innerHTML = ""; erro.classList.add("hidden");
    });
    conferir.addEventListener("click", async () => {
      erro.classList.add("hidden"); aplicar.classList.add("hidden");
      conferir.disabled = true; conferir.textContent = "Conferindo…";
      try {
        const r = await Services.usuarios.importar(campo.files[0], true);
        saida.innerHTML = previa(r);
        const n = r.criar + r.atualizar;
        if (!r.erros && n) {
          aplicar.textContent = `Importar ${n} ${n === 1 ? "pessoa" : "pessoas"}`;
          aplicar.classList.remove("hidden");
        }
      } catch (err) { falha(err.message || "Não foi possível ler a planilha."); }
      finally { conferir.disabled = false; conferir.textContent = "Conferir planilha"; }
    });
    aplicar.addEventListener("click", async () => {
      aplicar.disabled = true; aplicar.textContent = "Importando…";
      try {
        const r = await Services.usuarios.importar(campo.files[0], false);
        if (!r.aplicado) { saida.innerHTML = previa(r); falha("A planilha mudou e tem erro: nada foi gravado."); return; }
        aoConcluir();
        App.toast(`Importação concluída: ${r.criar} criados e ${r.atualizar} atualizados${r.criar ? " (senhas temporárias enviadas por e-mail)" : ""}`);
        await App.loadApiData();
        App.render();
      } catch (err) { falha(err.message || "Não foi possível importar."); }
      finally { aplicar.disabled = false; }
    });
  }

  function abrirImportacaoUsuarios() {
    App.openPanel("Importar usuários por planilha", formHtml());
    ligar(() => App.closePanel());
  }

  // Tela própria: o mesmo fluxo e os desligamentos já agendados.
  function adminImportacao() {
    const hoje = new Date().toISOString().slice(0, 10);
    const previstos = (App.state.usuarios || []).filter((u) => u.desligamento && u.status === "Ativo" && u.desligamento >= hoje)
      .sort((a, b) => a.desligamento.localeCompare(b.desligamento));
    const lista = previstos.length ? `<ul class="space-y-2">${previstos.map((u) => `<li class="flex items-center gap-3 flex-wrap">${badge("amber", `Desliga em ${esc(u.desligamento.split("-").reverse().join("/"))}`)}
        <span class="font-semibold text-slate-800 dark:text-slate-100">${esc(u.nome)}</span><span class="text-xs text-slate-500 dark:text-slate-400">${esc(u.setor)} · ${esc(u.cargo)}</span></li>`).join("")}</ul>`
      : `<p class="text-sm text-slate-500 dark:text-slate-400">Nenhum desligamento agendado.</p>`;
    return {
      title: "Importar usuários",
      html: `<div class="mb-6"><div class="text-sm text-slate-500 dark:text-slate-400">Hospital Decós Intranet • Administração</div>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Importar usuários e desligamentos</h2></div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <section class="card p-6 xl:col-span-2" aria-labelledby="imp-h"><h3 id="imp-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-3">Importar planilha</h3>${formHtml()}</section>
          <section class="card p-6" aria-labelledby="desl-h"><h3 id="desl-h" class="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-1">Desligamentos agendados</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">No dia, o acesso é desativado sozinho. Para mudar a data, edite a pessoa em <a href="#/admin/usuarios" class="underline">Usuários &amp; Setores</a>.</p>${lista}</section>
        </div>`,
      init() { ligar(() => App.render()); },
    };
  }

  Object.assign(PagesAdmin, { abrirImportacaoUsuarios, adminImportacao });
})();
