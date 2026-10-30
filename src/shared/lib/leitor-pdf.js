/* =========================================================================
   Leitor de PDF na tela (PDF.js, carregado sob demanda)
   O arquivo vem de GET /documentos/{id}/conteudo (bytes, só para quem pode ver) e é desenhado em
   <canvas> página a página: não há link de download nem leitor do navegador com botão "salvar".
   Sem PDF.js (rede/CSP) ou para outros formatos, a tela continua com o resumo do documento.
   ========================================================================= */
(function () {
  const VERSAO = "3.11.174";
  const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSAO}`;
  let carregando = null;

  function carregarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    carregando ||= new Promise((ok, falha) => {
      const s = document.createElement("script");
      s.src = `${BASE}/pdf.min.js`;
      s.onload = () => {
        if (!window.pdfjsLib) { falha(new Error("PDF.js indisponível")); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
        ok(window.pdfjsLib);
      };
      s.onerror = () => { carregando = null; falha(new Error("Não foi possível carregar o leitor de PDF.")); };
      document.head.appendChild(s);
    });
    return carregando;
  }

  /**
   * Desenha o PDF do documento dentro de `alvo`.
   * Devolve { paginas, zoom(fator) } ou lança erro (quem chama mantém o resumo como alternativa).
   * `aoPaginar(atual, total)` informa a página visível ao rolar.
   */
  async function abrirPdf(documentoId, alvo, { aoPaginar } = {}) {
    const [pdfjs, blob] = await Promise.all([carregarPdfJs(), Services.documentos.conteudo(documentoId)]);
    const dados = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: dados, isEvalSupported: false }).promise;
    let fator = 1;

    async function desenhar() {
      const largura = Math.max(280, alvo.clientWidth - 32);
      const frag = document.createDocumentFragment();
      for (let n = 1; n <= pdf.numPages; n++) {
        const pagina = await pdf.getPage(n);
        const base = pagina.getViewport({ scale: 1 });
        const escala = (largura / base.width) * fator;
        const vp = pagina.getViewport({ scale: escala * (window.devicePixelRatio || 1) });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.style.width = `${Math.floor(vp.width / (window.devicePixelRatio || 1))}px`;
        canvas.className = "pdf-canvas";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Página ${n} de ${pdf.numPages}`);
        canvas.dataset.pagina = String(n);
        await pagina.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        frag.appendChild(canvas);
      }
      alvo.replaceChildren(frag);
    }
    await desenhar();

    // Página visível (a que ocupa o meio da área de leitura).
    const rolagem = alvo.closest(".pdf-scroll") || alvo;
    const atualizar = () => {
      const meio = rolagem.getBoundingClientRect().top + rolagem.clientHeight / 2;
      const atual = [...alvo.querySelectorAll("canvas")].find((c) => c.getBoundingClientRect().bottom >= meio);
      aoPaginar?.(Number(atual?.dataset.pagina || 1), pdf.numPages);
    };
    rolagem.addEventListener("scroll", atualizar, { passive: true });
    atualizar();

    return {
      paginas: pdf.numPages,
      async zoom(novo) { fator = Math.min(1.6, Math.max(0.6, novo)); await desenhar(); atualizar(); },
    };
  }

  Object.assign(App, { abrirPdf });
})();
