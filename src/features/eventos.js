/* =========================================================================
   Eventos: formato das telas, inscrição e agenda (.ics)
   Tudo vem da API (GET /eventos*). Datas chegam em UTC e são exibidas no fuso do navegador.
   ========================================================================= */
(function () {
  const MES3 = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const dataLonga = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Evento da API -> formato usado pelas telas.
  function eventoView(e) {
    const ini = new Date(e.inicio), fim = new Date(e.fim);
    const horario = mesmoDia(ini, fim) ? `${hora.format(ini)} às ${hora.format(fim)}` : `${dataHora.format(ini)} a ${dataHora.format(fim)}`;
    return {
      id: e.id, titulo: e.titulo, desc: e.descricao, longa: e.descricao_longa ? e.descricao_longa.split(/\n+/).filter(Boolean) : [],
      tag: e.categoria, ini, fim, dia: String(ini.getDate()).padStart(2, "0"), mes: MES3[ini.getMonth()],
      data: dataCurta.format(ini), dataLonga: dataLonga.format(ini), horario, local: e.local, organizador: e.organizador,
      vagas: e.vagas, inscritos: e.inscritos, livres: e.vagas_disponiveis, status: e.status, encerrado: e.encerrado,
      aberto: e.inscricoes_abertas, inscrito: e.inscrito, cancelado: e.status === "CANCELADO",
      tipo: e.tipo || "EVENTO", treinamento: e.tipo === "TREINAMENTO", visto: !!e.visto, temImagem: !!e.tem_imagem, temBanner: !!e.tem_banner,
      vagasTxt: textoVagas(e.vagas, e.vagas_disponiveis, e.inscritos),
    };
  }

  // Limite de vagas em uma linha, igual em todas as telas: "12 de 30 vagas livres", "Esgotado (30 vagas)".
  function textoVagas(vagas, livres, inscritos) {
    if (!vagas) return `Sem limite de vagas${inscritos ? ` · ${inscritos} ${inscritos === 1 ? "inscrito" : "inscritos"}` : ""}`;
    if (!livres) return `Esgotado (${vagas} ${vagas === 1 ? "vaga" : "vagas"})`;
    return `${livres} de ${vagas} ${vagas === 1 ? "vaga livre" : "vagas livres"}`;
  }

  function eventosProximos() { return App.state.api.eventosProximos.map(eventoView); }
  function minhasInscricoes() { return App.state.api.minhasInscricoes.map(eventoView); }

  // Inscrição real (vagas decididas no servidor). Devolve o evento atualizado ou null em caso de erro.
  async function inscrever(id) {
    try {
      const e = await Services.eventos.inscrever(id);
      App.toast(`Inscrição confirmada: ${e.titulo}`);
      await App.refreshEventos();
      return e;
    } catch (err) { App.toast(err.message || "Não foi possível concluir a inscrição."); return null; }
  }
  async function cancelarInscricao(id) {
    try {
      const e = await Services.eventos.cancelarInscricao(id);
      App.toast("Inscrição cancelada");
      await App.refreshEventos();
      return e;
    } catch (err) { App.toast(err.message || "Não foi possível cancelar a inscrição."); return null; }
  }

  // Arquivo .ics com as datas REAIS do evento (UTC).
  const utc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const esc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
  function baixarIcs(v) {
    if (!v) return;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hospital Decos//Intranet//PT", "BEGIN:VEVENT",
      `UID:evento-${v.id}@decos.com`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(v.ini)}`, `DTEND:${utc(v.fim)}`,
      `SUMMARY:${esc(v.titulo)}`, `LOCATION:${esc(v.local)}`, `DESCRIPTION:${esc(v.desc)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    App.downloadFile(`evento-${v.id}.ics`, ics, "text/calendar");
    App.toast("Evento adicionado — abra o arquivo para salvar na agenda");
  }
  async function adicionarAgenda(id) {
    try { baixarIcs(eventoView(await Services.eventos.get(id))); }
    catch (err) { App.toast(err.message || "Evento não encontrado."); }
  }

  // Link da foto de capa (assinado, 60 s). Guardado por 45 s para não pedir de novo a cada tela.
  const fotos = new Map();
  async function fotoEvento(id, tipo = "capa") {
    const chave = `${id}:${tipo}`, c = fotos.get(chave);
    if (c && c.ate > Date.now()) return c.url;
    const r = await Services.eventos.imagem(id, tipo);
    if (!/^https?:\/\//.test(r.url)) throw new Error("Endereço de imagem inválido.");
    fotos.set(chave, { url: r.url, ate: Date.now() + 45000 });
    return r.url;
  }
  // Foto com proporção muito diferente do espaço (ex.: retrato num banner largo) seria cortada:
  // nesse caso ela aparece inteira e o resto do espaço é a própria foto desfocada ao fundo.
  function ajustarFoto(img, url) {
    if (img.dataset.preencher === "1") return; // Inicial: a foto sempre preenche a faixa (esticada)
    const caixa = img.parentElement?.getBoundingClientRect();
    if (!caixa?.width || !caixa.height || !img.naturalWidth) return;
    const diferenca = (img.naturalWidth / img.naturalHeight) / (caixa.width / caixa.height);
    if (diferenca > 0.8 && diferenca < 1.25) return;
    img.classList.add("foto-inteira");
    if (!img.previousElementSibling?.classList.contains("foto-fundo")) {
      const fundo = document.createElement("img");
      fundo.className = "foto-fundo"; fundo.alt = ""; fundo.src = url;
      fundo.setAttribute("aria-hidden", "true");
      img.before(fundo);
    }
  }
  // Preenche <img data-foto-evento="id"> dentro de `raiz`; sem foto (ou erro) fica o fundo da marca.
  function carregarFotosEventos(raiz = document) {
    raiz.querySelectorAll("img[data-foto-evento]").forEach((img) => {
      fotoEvento(Number(img.dataset.fotoEvento), img.dataset.fotoTipo || "capa")
        .then((url) => { img.addEventListener("load", () => { ajustarFoto(img, url); img.classList.add("is-loaded"); }, { once: true }); img.src = url; })
        .catch(() => img.remove());
    });
  }
  function esquecerFoto(id) { ["capa", "banner"].forEach((t) => fotos.delete(`${Number(id)}:${t}`)); }

  Object.assign(App, { fotoEvento, carregarFotosEventos, esquecerFoto, eventoView, eventosProximos, minhasInscricoes, inscreverEvento: inscrever, cancelarInscricaoEvento: cancelarInscricao, baixarIcs, adicionarAgenda });
  Object.assign(UI, { fmtMesAno: (d) => { const t = mesAno.format(d); return t.charAt(0).toUpperCase() + t.slice(1); }, fmtDataHora: (iso) => dataHora.format(new Date(iso)) });
})();
