// Rodada exploratória (E01–E15): fluxos não cobertos pela varredura original.
// Cria e limpa a própria massa (eventos, FAQ, setor, avisos). Use SOMENTE contra um banco de teste.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const BASE = "http://localhost:5500/", API = "http://127.0.0.1:8000";
const OUT = fileURLToPath(new URL("./out/explore/", import.meta.url)); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(process.env.CHR ? { executablePath: process.env.CHR } : {});
const SENHA = process.env.QA_SENHA || "SenhaQA123!", ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || "admin.qa@example.com";
const R = []; const log = (id, name, ok, d = "") => { R.push({ id, name, ok, d }); console.log(ok === null ? "INFO" : ok ? "PASS" : "FAIL", id, name, typeof d === "string" ? d : JSON.stringify(d)); };
const login = async (email) => (await (await fetch(API + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, senha: SENHA }) })).json()).access_token;
const api = async (tk, method, path, body) => { const r = await fetch(API + path, { method, headers: { "content-type": "application/json", Authorization: "Bearer " + tk }, body: body ? JSON.stringify(body) : undefined }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
async function page(email, vp = { width: 1440, height: 900 }, theme = "light") {
  const tk = email ? await login(email) : null;
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 768, hasTouch: vp.width < 1024 });
  await ctx.addInitScript(([t, th]) => { if (t) localStorage.setItem("decos_intranet_token", t); localStorage.setItem("decos_intranet_state", JSON.stringify({ theme: th })); }, [tk, theme]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message)); p.on("console", (m) => m.type() === "error" && p.errs.push(m.text().slice(0, 150)));
  return p;
}
const go = async (p, r, w = 1300) => { await p.goto(BASE + r); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(w); };
const shot = (p, n) => p.screenshot({ path: OUT + n + ".jpg", type: "jpeg", quality: 70 });
const ADM = await login(ADMIN_EMAIL);

// E01 carrossel: autoplay, pausa por foco, slides ocultos focáveis
{ const p = await page("colab.qa@example.com"); await go(p, "#/dashboard");
  const tr = () => p.evaluate(() => document.querySelector(".carousel-track")?.style.transform || "");
  const t0 = await tr(); await p.waitForTimeout(6500); const t1 = await tr();
  const pauseBtn = await p.locator('.carousel [aria-label*="ausa" i], .carousel [data-carousel="pause"]').count();
  log("E01", "Carrossel avança sozinho e oferece botão de pausa (WCAG 2.2.2)", t0 !== t1 && pauseBtn > 0, { avancouSozinho: t0 !== t1, botaoPausa: pauseBtn });
  await p.locator('[data-carousel="next"]').focus(); const f0 = await tr(); await p.waitForTimeout(6500); const f1 = await tr();
  log("E01b", "Carrossel pausa enquanto o foco do teclado está nele", f0 === f1, { antes: f0, depois: f1 });
  const off = await p.evaluate(() => { const root = document.querySelector(".carousel"); const rr = root.getBoundingClientRect(); return [...root.querySelectorAll("a[href],button")].filter((e) => { const r = e.getBoundingClientRect(); return !e.closest(".carousel-dots") && !e.matches("[data-carousel]") && (r.right <= rr.left || r.left >= rr.right); }).map((e) => e.innerText.trim().slice(0, 30)); });
  log("E01c", "Botões de slides fora da tela não recebem foco", off.length === 0, off.join(" | "));
  await p.context().close(); }

// E02 eventos: vagas, inscrição, lotado, cancelamento
{ const evs = (await api(ADM, "GET", "/eventos?page_size=50")).j; const list = evs.items || evs; const ev = list.find((e) => e.vagas === 2);
  for (const u of ["colab.qa@example.com", "ana.qa@example.com", "rh.qa@example.com"]) await api(await login(u), "DELETE", `/eventos/${ev.id}/inscricao`);
  const pA = await page("colab.qa@example.com"); await go(pA, "#/eventos/" + ev.id);
  const btnA = pA.locator('[data-action="inscrever-evento"]'); const hasA = await btnA.count();
  if (hasA) { await btnA.first().click(); await pA.waitForTimeout(1500); }
  const stA = await pA.evaluate(() => document.querySelector(".content").innerText.match(/inscrit[oa]|cancelar inscri|vagas?[^\n]{0,30}/gi));
  log("E02", "Colaborador se inscreve em evento", hasA > 0 && !!stA, (stA || []).slice(0, 4).join(" · "));
  // duplo clique rápido em outro usuário
  const pB = await page("ana.qa@example.com"); await go(pB, "#/eventos/" + ev.id);
  const reqs = []; pB.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/inscric")) reqs.push(r.url()); });
  const btnB = pB.locator('[data-action="inscrever-evento"]'); if (await btnB.count()) { await btnB.first().dblclick(); await pB.waitForTimeout(1500); }
  log("E02b", "Duplo clique em Inscrever envia uma única requisição", reqs.length <= 1, reqs.length + " POSTs");
  const pC = await page("rh.qa@example.com"); await go(pC, "#/eventos/" + ev.id);
  const lot = await pC.evaluate(() => ({ txt: (document.querySelector(".content").innerText.match(/lotad[oa]|esgotad[oa]|sem vagas|0 vagas[^\n]*/i) || [""])[0], btn: [...document.querySelectorAll('[data-action="inscrever-evento"]')].map((b) => ({ dis: b.disabled, t: b.innerText.trim() })) }));
  log("E02c", "Evento com vagas esgotadas mostra 'lotado' e bloqueia inscrição", !!lot.txt && lot.btn.every((x) => x.dis), lot);
  await shot(pC, "e02_evento_lotado");
  const r403 = await api(await login("rh.qa@example.com"), "POST", `/eventos/${ev.id}/inscricao`);
  log("E02d", "API recusa inscrição além das vagas", r403.s >= 400, r403.s + " " + JSON.stringify(r403.j).slice(0, 100));
  // cancelar libera vaga
  const cA = pA.locator('[data-action="cancelar-inscricao"]'); if (await cA.count()) { await cA.first().click(); await pA.waitForTimeout(600); const conf = pA.locator('#modal [data-action="confirm-yes"]'); if (await conf.count() && await conf.isVisible()) await conf.click(); await pA.waitForTimeout(1500); }
  await pC.reload(); await pC.waitForTimeout(1500); const libera = await pC.locator('[data-action="inscrever-evento"]:not([disabled])').count();
  log("E02e", "Cancelar inscrição libera a vaga para outra pessoa", libera > 0, libera + " botão(ões) habilitado(s)");
  for (const p of [pA, pB, pC]) await p.context().close();
  for (const u of ["colab.qa@example.com", "ana.qa@example.com"]) await api(await login(u), "DELETE", `/eventos/${ev.id}/inscricao`); }

// E03 validação de evento: fim antes do início
{ const st = new Date(Date.now() + 5 * 864e5);
  const r = await api(ADM, "POST", "/eventos", { titulo: "QA datas invertidas", descricao: "x", categoria: "QA", inicio: st.toISOString(), fim: new Date(st - 3600e3).toISOString(), local: "Sala", organizador: "QA", status: "RASCUNHO" });
  log("E03", "API rejeita evento com fim antes do início", r.s === 422, r.s);
  const p = await page(ADMIN_EMAIL); await go(p, "#/admin/eventos/novo");
  const fields = await p.evaluate(() => [...document.querySelectorAll("form input, form select, form textarea")].map((e) => `${e.id || e.name}:${e.type}${e.required ? "*" : ""}`));
  log("E03b", "Campos do formulário de evento (inventário)", null, fields.join(" "));
  await p.context().close(); }

// E04 XSS em outros campos (evento, FAQ, setor, chamado) e locais de exibição
{ const X = '<img src=x onerror="window.__x=1">';
  const st = new Date(Date.now() + 9 * 864e5);
  const ev = await api(ADM, "POST", "/eventos", { titulo: "QA " + X, descricao: X, categoria: "QA", inicio: st.toISOString(), fim: new Date(+st + 3600e3).toISOString(), local: X, organizador: "QA", status: "PUBLICADO" });
  const fq = await api(ADM, "POST", "/faqs", { pergunta: "QA " + X + "?", resposta: X, categoria: "QA" });
  const se = await api(ADM, "POST", "/setores", { nome: "QA " + X.slice(0, 40) });
  const ch = await api(await login("colab.qa@example.com"), "POST", "/chamados", { tipo: "TI", categoria: "QA", local: X, descricao: "Descrição longa de teste " + X });
  log("E04", "Massa XSS criada (evento, FAQ, setor, chamado)", null, [ev.s, fq.s, se.s, ch.s].join(","));
  const p = await page(ADMIN_EMAIL);
  for (const r of ["#/dashboard", "#/eventos", `#/eventos/${ev.j?.id}`, "#/faq", "#/admin/faqs", "#/admin/usuarios", "#/admin/chamados", "#/admin/auditoria", "#/diretorio", "#/notificacoes"]) await go(p, r, 900);
  await p.locator('[data-action="open-notif"]').click({ force: true }).catch(() => {}); await p.waitForTimeout(600);
  await go(p, "#/dashboard", 600); await p.fill("input[data-search-input]", "QA"); await p.waitForTimeout(900);
  const x = await p.evaluate(() => window.__x);
  log("E04b", "Nenhum campo novo executa HTML (10 telas + painel + prévia da busca)", !x, "window.__x=" + x);
  await p.context().close();
  globalThis.__cleanup = { ev: ev.j?.id, fq: fq.j?.id, se: se.j?.id }; }

// E05 conteúdo longo: palavra sem espaços e título longo
{ const url = "https://intranet.decos.com.br/" + "protocolo-de-seguranca-do-paciente-".repeat(6);
  const av = await api(ADM, "POST", "/avisos", { titulo: "Atualização importantíssima sobre o protocolo institucional de prevenção de quedas e lesões por pressão nas unidades", categoria: "Protocolos", conteudo: "Acesse: " + url });
  for (const w of [375, 1440]) { const p = await page("colab.qa@example.com", { width: w, height: 900 });
    for (const r of [`#/avisos/${av.j.id}`, "#/avisos", "#/dashboard"]) { await go(p, r, 900);
      const o = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, cut: [...document.querySelectorAll(".content *")].filter((e) => e.innerText?.includes("protocolo-de") && e.getBoundingClientRect().right > document.documentElement.clientWidth).length }));
      log("E05", `Texto longo sem quebra em ${r} (${w}px) não estoura`, o.ov === 0 && o.cut === 0, o);
      if (o.ov > 0) await shot(p, `e05_${w}_${r.replace(/\W+/g, "_")}`); }
    await p.context().close(); }
  globalThis.__cleanup.av = av.j.id; }

// E06 duplo clique em Publicar aviso
{ const p = await page(ADMIN_EMAIL); await go(p, "#/admin/noticias/nova");
  await p.waitForFunction(() => !document.querySelector("#nt-salvar")?.disabled, null, { timeout: 8000 }).catch(() => {});
  await p.fill("#nt-titulo", "QA duplo clique publicar"); await p.fill("#nt-corpo", "Conteúdo do teste de duplo clique.");
  const posts = []; p.on("request", (r) => { if (r.method() === "POST" && r.url().endsWith("/avisos")) posts.push(1); });
  await p.locator("#nt-salvar").dblclick(); await p.waitForTimeout(2000);
  log("E06", "Duplo clique em Publicar cria um único aviso", posts.length === 1, posts.length + " POSTs");
  await p.context().close(); }

// E07 API fora do ar ao recarregar e retorno
{ const p = await page("colab.qa@example.com"); await go(p, "#/dashboard");
  await p.route(/:8000\//, (r) => r.abort()); await p.reload(); await p.waitForTimeout(4000);
  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 200));
  await shot(p, "e07_api_fora");
  log("E07", "Com a API fora, a tela informa o problema e oferece nova tentativa", /n[aã]o foi poss[ií]vel conectar/i.test(t) && /tentar novamente/i.test(t), t.slice(0, 160));
  await p.unroute(/:8000\//); await p.locator("button", { hasText: /tentar/i }).first().click().catch(() => {}); await p.waitForTimeout(2500);
  log("E07b", "Ao voltar a API, 'Tentar novamente' recupera a tela", await p.evaluate(() => !!document.querySelector(".content") && !/n[aã]o foi poss[ií]vel conectar/i.test(document.body.innerText)));
  await p.context().close(); }

// E08 deep link deslogado → login → volta ao destino?
{ const p = await page(null); await go(p, "#/eventos/1");
  const h1 = await p.evaluate(() => location.hash);
  await p.fill('input[name="email"]', "colab.qa@example.com"); await p.fill('input[name="senha"]', SENHA); await p.locator('input[name="senha"]').press("Enter"); await p.waitForTimeout(2500);
  log("E08", "Link direto aberto sem sessão volta à tela pedida após o login", p.url().includes("#/eventos/1"), h1 + " → " + new URL(p.url()).hash);
  // voltar/avançar do navegador
  await go(p, "#/avisos", 900); await go(p, "#/faq", 900); await p.goBack(); await p.waitForTimeout(900); const back = new URL(p.url()).hash; await p.goForward(); await p.waitForTimeout(900);
  log("E08b", "Botões voltar/avançar do navegador navegam entre telas", back === "#/avisos" && p.url().includes("#/faq"), back);
  await p.context().close(); }

// E09 sessão invalidada no meio do uso (usuário desativado pelo admin)
{ const users = (await api(ADM, "GET", "/usuarios?page_size=100")).j; const ana = (users.items || users).find((u) => u.email === "ana.qa@example.com");
  const p = await page("ana.qa@example.com"); await go(p, "#/avisos");
  const d = await api(ADM, "DELETE", "/usuarios/" + ana.id);
  for (const h of ["#/faq", "#/diretorio"]) { await p.evaluate((h) => { location.hash = h; }, h); await p.waitForTimeout(1500); }
  const st = await p.evaluate(() => ({ hash: location.hash, tk: !!localStorage.getItem("decos_intranet_token"), txt: document.body.innerText.slice(0, 120).replace(/\s+/g, " ") }));
  log("E09", "Usuário desativado no meio da sessão é levado ao login ao navegar", st.hash.includes("login") && !st.tk, { desativar: d.s, ...st });
  await p.reload(); await p.waitForTimeout(2500);
  log("E09b", "Ao recarregar, o usuário desativado é levado ao login", await p.evaluate(() => location.hash.includes("login") && !localStorage.getItem("decos_intranet_token")));
  await api(ADM, "PUT", "/usuarios/" + ana.id, { ativo: true }); await p.context().close(); }

// E10 busca global
{ const p = await page("colab.qa@example.com"); await go(p, "#/dashboard");
  const q = async (s) => { await p.fill("input[data-search-input]", s); await p.locator("input[data-search-input]").press("Enter"); await p.waitForTimeout(1100);
    const t = await p.evaluate(() => document.querySelector("#side-panel.open .panel-content")?.innerText.replace(/\s+/g, " ") || ""); await p.evaluate(() => App.closePanel()); await p.waitForTimeout(300); return t; };
  const achou = (t) => t && !/nada encontrado/i.test(t);
  const com = await q("vacinação"), sem = await q("vacinacao");
  log("E10", "Busca ignora acentos ('vacinacao' acha 'vacinação')", achou(com) && achou(sem), { comAcento: achou(com), semAcento: achou(sem) });
  const pct = await q("%"); log("E10b", "Busca por '%' não lista tudo nem quebra", !achou(pct) || pct.length < 2000, pct.slice(0, 80));
  const ram = await q("2110"); log("E10c", "Busca por ramal de pessoa encontra o colaborador", achou(ram) && /carlos/i.test(ram), ram.slice(0, 80));
  const faq = await q("holerite"), evq = await q("Corrida");
  log("E10d", "Busca cobre FAQ e eventos", achou(faq) && achou(evq), { faq: achou(faq), eventos: achou(evq) });
  log("E10e", "Sem erros JS na busca", p.errs.length === 0, p.errs.join(" | "));
  await p.context().close(); }

// E11 tema Vinho: axe (não auditado no laudo)
{ for (const r of ["#/dashboard", "#/avisos", "#/admin/usuarios"]) { const p = await page(ADMIN_EMAIL, { width: 1440, height: 900 }, "red"); await go(p, r);
    const v = (await new AxeBuilder({ page: p }).withTags(["wcag2aa", "wcag21aa"]).analyze()).violations.filter((x) => x.id === "color-contrast");
    log("E11", `Tema Vinho: contraste em ${r}`, v.length === 0, v.length ? v[0].nodes.length + " nós · " + v[0].nodes[0].failureSummary.split("\n")[1].trim().slice(0, 140) : "ok");
    await p.context().close(); } }

// E12 Esqueci minha senha sem Supabase configurado + 429 no login
{ const p = await page(null); await go(p, "#/login");
  await p.locator("summary, button").filter({ hasText: /esqueci/i }).first().click(); await p.waitForTimeout(400);
  await p.fill('#form-esqueceu-senha input[name="email"]', "colab.qa@example.com"); await p.locator('#form-esqueceu-senha button[type="submit"], #form-esqueceu-senha button').first().click(); await p.waitForTimeout(2500);
  const t = await p.evaluate(() => (document.querySelector("#toast")?.innerText || "") + " | " + (document.querySelector("#form-esqueceu-senha")?.innerText || ""));
  log("E12", "Esqueci minha senha dá retorno claro (sem revelar se o e-mail existe)", t.trim().length > 5, t.replace(/\s+/g, " ").slice(0, 200));
  for (let i = 0; i < 6; i++) { await p.fill('input[name="email"] >> nth=0', "bloqueio.qa@example.com"); await p.fill('input[name="senha"]', "errada" + i); await p.locator('input[name="senha"]').press("Enter"); await p.waitForTimeout(700); }
  const m = await p.evaluate(() => document.body.innerText.match(/.*(tentativas|aguarde|minutos|muitas).*/i)?.[0] || document.querySelector("#toast")?.innerText || "");
  await shot(p, "e12_login_429");
  log("E12b", "Após muitas tentativas, o login explica que é preciso aguardar", /tentativ|aguard|minut|muitas/i.test(m), m.slice(0, 140));
  await p.context().close(); }

// E13 paisagem mobile (812x375): modal e painel cabem na tela
{ const p = await page(ADMIN_EMAIL, { width: 812, height: 375 }); await go(p, "#/admin/usuarios");
  await p.locator('[data-action="new-user"], button:has-text("Novo Usuário")').first().click().catch(() => {}); await p.waitForTimeout(800);
  const pn = await p.evaluate(() => { const b = document.querySelector("#side-panel.open .panel-body"); if (!b) return null; const c = b.querySelector(".panel-content") || b; return { body: b.clientHeight, scrollable: getComputedStyle(c).overflowY, content: c.scrollHeight }; });
  await shot(p, "e13_paisagem_painel");
  log("E13", "Paisagem 812×375: painel de novo usuário rola e cabe na tela", !!pn && (pn.content <= pn.body || /auto|scroll/.test(pn.scrollable)), pn);
  await p.context().close(); }

// E14 notificação: aviso urgente aparece no sino do colaborador
{ const av = await api(ADM, "POST", "/avisos", { titulo: "QA Urgente: falta de energia no bloco B", categoria: "Urgente", conteudo: "Teste de notificação urgente." });
  const p = await page("colab.qa@example.com"); await go(p, "#/dashboard", 1800);
  const bell = await p.evaluate(() => ({ title: document.querySelector('[data-action="open-notif"]')?.getAttribute("title"), badge: document.querySelector('[data-action="open-notif"]')?.innerText.trim(), aria: document.querySelector('[data-action="open-notif"]')?.getAttribute("aria-label") }));
  log("E14", "Aviso urgente gera indicação no sino do colaborador", /urgente/i.test(bell.title || "") || /\d/.test(bell.badge || ""), bell);
  const snap = await p.locator('[data-action="open-notif"]').ariaSnapshot();
  log("E14b", "Leitor de tela anuncia o sino como 'Notificações' (e não só o número)", /notifica/i.test(snap.split("\n")[0]), snap.split("\n")[0]);
  globalThis.__cleanup.urg = av.j?.id; await p.context().close(); }

// E15 conteúdo publicado durante a sessão aparece sem recarregar?
{ const p = await page("colab.qa@example.com"); await go(p, "#/avisos", 1800);
  const av = await api(ADM, "POST", "/avisos", { titulo: "QA aviso publicado durante a sessão", categoria: "Urgente", conteudo: "Teste de atualização." });
  for (const h of ["#/dashboard", "#/eventos", "#/avisos"]) { await p.evaluate((h) => { location.hash = h; }, h); await p.waitForTimeout(1500); }
  const nav = await p.evaluate(() => document.body.innerText.includes("QA aviso publicado durante a sessão"));
  await p.waitForTimeout(60000);
  const espera = await p.evaluate(() => document.body.innerText.includes("QA aviso publicado durante a sessão"));
  log("E15", "Aviso publicado durante a sessão aparece ao navegar ou em até 60 s", nav || espera, { aoNavegar: nav, apos60s: espera });
  globalThis.__cleanup.sess = av.j?.id; await p.context().close(); }

fs.writeFileSync(OUT + "results.json", JSON.stringify(R, null, 1));
// limpeza: arquiva/exclui o que foi criado
const c = globalThis.__cleanup;
const dup = ((await api(ADM, "GET", "/avisos?page_size=100")).j.items || []).filter((x) => x.titulo === "QA duplo clique publicar").map((x) => x.id);
for (const id of [c.av, c.urg, c.sess, ...dup]) if (id) { const d = await api(ADM, "DELETE", "/avisos/" + id); if (d.s >= 400) await api(ADM, "PUT", "/avisos/" + id, { status: "ARQUIVADO" }); }
if (c.ev) await api(ADM, "DELETE", "/eventos/" + c.ev); if (c.fq) await api(ADM, "DELETE", "/faqs/" + c.fq); if (c.se) await api(ADM, "DELETE", "/setores/" + c.se);
await b.close();
