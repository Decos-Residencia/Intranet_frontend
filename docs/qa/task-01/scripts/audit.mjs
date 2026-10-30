// Auditoria UI/UX + responsividade + acessibilidade da Intranet Decós.
// Uso: node audit.mjs functional | pages  → gera out/results_<modo>.json e out/shots/*.png
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:5500/";
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
fs.mkdirSync(OUT + "shots", { recursive: true });

// Credenciais da massa de teste (ver seed_users.py). Nunca aponte para produção.
const USERS = {
  admin: process.env.QA_ADMIN_EMAIL || "admin.qa@example.com",
  rh: "rh.qa@example.com",
  colaborador: "colab.qa@example.com",
  leitura: "leitura.qa@example.com",
};
const PASS = process.env.QA_SENHA || "SenhaQA123!";

const VIEWPORTS = [
  { name: "320", width: 320, height: 640, mobile: true },
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const COMMON = ["#/dashboard", "#/avisos", "#/avisos/1", "#/aniversariantes", "#/aniversariantes/hoje", "#/avaliacoes",
  "#/eventos", "#/eventos/1", "#/documentos", "#/faq", "#/diretorio", "#/perfil", "#/notificacoes", "#/trocar-senha", "#/rota-inexistente"];
const GESTAO = ["#/admin/noticias", "#/admin/noticias/nova", "#/admin/noticias/1/editar", "#/admin/documentos", "#/admin/documentos/novo",
  "#/admin/eventos", "#/admin/eventos/novo", "#/admin/eventos/1/editar", "#/admin/faqs"];
const ADMIN = ["#/admin/usuarios", "#/admin/acessos", "#/admin/chamados", "#/admin/solicitacoes", "#/admin/auditoria", "#/admin/avaliacoes"];

const results = { pages: [], functional: [], meta: { started: new Date().toISOString() } };

async function token(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "#/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="senha"]', PASS);
  await page.locator('input[name="senha"]').press("Enter");
  await page.waitForFunction(() => location.hash.startsWith("#/dashboard"), null, { timeout: 20000 });
  const t = await page.evaluate(() => localStorage.getItem("decos_intranet_token"));
  await ctx.close();
  return t;
}

async function inspect(page, vp) {
  return page.evaluate(({ mobile }) => {
    const W = document.documentElement.clientWidth;
    const out = { scrollWidth: document.documentElement.scrollWidth, clientWidth: W, overflow: [], smallTargets: [], tinyText: [], brokenImgs: [], noAlt: [] };
    const sel = (el) => {
      let s = el.tagName.toLowerCase();
      if (el.id) s += "#" + el.id;
      const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 3);
      if (cls.length) s += "." + cls.join(".");
      const txt = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40);
      return txt ? `${s} «${txt.replace(/\s+/g, " ")}»` : s;
    };
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
    const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") return true; } return false; };
    for (const el of document.querySelectorAll("body *")) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 && !clipped(el) && getComputedStyle(el).position !== "fixed") out.overflow.push({ el: sel(el), right: Math.round(r.right) });
    }
    // dedupe overflow to outermost offenders
    out.overflow = out.overflow.slice(0, 12);
    if (mobile) {
      for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])')) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if ((r.width < 24 || r.height < 24) && el.tagName !== "INPUT" || (el.tagName === "INPUT" && r.height < 24 && el.type !== "checkbox" && el.type !== "radio"))
          out.smallTargets.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const n = walker.currentNode; const el = n.parentElement;
      if (!el || seen.has(el) || !n.textContent.trim() || !visible(el)) continue;
      seen.add(el);
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) out.tinyText.push({ el: sel(el), px: fs });
    }
    for (const img of document.images) {
      if (img.complete && img.naturalWidth === 0 && visible(img)) out.brokenImgs.push(img.currentSrc || img.src);
      if (!img.hasAttribute("alt")) out.noAlt.push(img.currentSrc || img.src);
    }
    out.h1 = [...document.querySelectorAll("h1")].filter(visible).map((h) => h.innerText.trim().slice(0, 60));
    out.title = document.title;
    out.finalHash = location.hash;
    out.landmarks = { main: document.querySelectorAll("main,[role=main]").length, nav: document.querySelectorAll("nav,[role=navigation]").length };
    out.smallTargets = out.smallTargets.slice(0, 25);
    out.tinyText = out.tinyText.slice(0, 15);
    return out;
  }, { mobile: !!vp.mobile });
}

async function auditRole(browser, role, routes) {
  const tk = await token(browser, USERS[role]);
  for (const vp of VIEWPORTS) {
    const themes = vp.name === "1440" || vp.name === "375" ? ["light", "dark"] : ["light"];
    for (const theme of themes) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile && vp.width < 768, hasTouch: !!vp.mobile, deviceScaleFactor: 1 });
      await ctx.addInitScript(([tk, theme]) => {
        localStorage.setItem("decos_intranet_token", tk);
        localStorage.setItem("decos_intranet_state", JSON.stringify({ theme }));
      }, [tk, theme]);
      const page = await ctx.newPage();
      let consoleErrs = [], httpErrs = [];
      page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text().slice(0, 200)); });
      page.on("pageerror", (e) => consoleErrs.push("PAGEERROR " + e.message.slice(0, 200)));
      page.on("response", (r) => { if (r.status() >= 400) httpErrs.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`); });
      for (const route of routes) {
        consoleErrs = []; httpErrs = [];
        const t0 = Date.now();
        await page.goto(BASE + route);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(350);
        const ms = Date.now() - t0;
        const info = await inspect(page, vp);
        const slug = `${role}_${vp.name}_${theme}_${route.replace(/[#/]+/g, "_").replace(/^_|_$/g, "")}`;
        const doShot = vp.name !== "1920" || role === "admin";
        if (doShot) await page.screenshot({ path: `${OUT}shots/${slug}.png`, fullPage: true }).catch(() => {});
        let axe = null;
        if ((vp.name === "1440" || vp.name === "375") && (role === "admin" || role === "colaborador" || theme === "dark")) {
          try {
            const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
            axe = r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ")), sample: v.nodes[0]?.failureSummary?.slice(0, 220) }));
          } catch (e) { axe = [{ id: "axe-error", help: e.message }]; }
        }
        results.pages.push({ role, vp: vp.name, theme, route, ms, shot: doShot ? slug : null, ...info, console: [...consoleErrs], http: [...httpErrs], axe });
        process.stdout.write(".");
      }
      await ctx.close();
    }
  }
  console.log(" " + role);
}

async function functional(browser) {
  const log = (id, name, ok, detail = "") => { results.functional.push({ id, name, ok, detail }); console.log(ok ? "PASS" : "FAIL", id, name, detail); };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));

  // Login
  await page.goto(BASE);
  await page.waitForTimeout(800);
  log("F01", "Sem sessão, raiz redireciona ao login", page.url().includes("#/login"), page.url());
  await page.click('button[type="submit"]').catch(() => {});
  const invalid = await page.evaluate(() => !document.querySelector('input[name="email"]').checkValidity());
  log("F02", "Login vazio é bloqueado pela validação", invalid);
  await page.fill('input[name="email"]', USERS.admin); await page.fill('input[name="senha"]', "errada123");
  await page.locator('input[name="senha"]').press("Enter"); await page.waitForTimeout(1500);
  const msg = await page.evaluate(() => (document.querySelector('[role=alert], .toast, #login-erro, .login-erro')?.innerText || document.body.innerText).slice(0, 2000));
  log("F03", "Senha incorreta exibe mensagem e permanece no login", page.url().includes("#/login") && /inv[aá]lid|incorret|n[aã]o confere/i.test(msg), msg.match(/.*(inv[aá]lid|incorret).*/i)?.[0]?.slice(0, 120) || "");
  await page.fill('input[name="email"]', "  " + USERS.admin.toUpperCase() + " "); await page.fill('input[name="senha"]', PASS);
  await page.locator('input[name="senha"]').press("Enter");
  const okUpper = await page.waitForFunction(() => location.hash.startsWith("#/dashboard"), null, { timeout: 10000 }).then(() => true).catch(() => false);
  log("F04", "E-mail com maiúsculas/espaços é normalizado no login", okUpper);
  if (!okUpper) { await page.fill('input[name="email"]', USERS.admin); await page.fill('input[name="senha"]', PASS); await page.locator('input[name="senha"]').press("Enter"); await page.waitForFunction(() => location.hash.startsWith("#/dashboard")); }

  // Persistência e tema
  await page.reload(); await page.waitForTimeout(1500);
  log("F05", "Sessão persiste após recarregar", page.url().includes("#/dashboard"));
  const themeBtn = page.locator('[data-action="cycle-theme"]').first();
  if (await themeBtn.count()) {
    const before = await page.evaluate(() => document.documentElement.className);
    await themeBtn.click(); await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.documentElement.className);
    await page.reload(); await page.waitForTimeout(1200);
    const persisted = await page.evaluate(() => document.documentElement.className);
    log("F06", "Troca de tema aplica e persiste", before !== after && persisted === after, `${before} → ${after} → reload: ${persisted}`);
  } else log("F06", "Botão de tema encontrado", false);

  // Teclado: skip link e foco visível
  await page.goto(BASE + "#/dashboard"); await page.waitForTimeout(800);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 50), href: a.getAttribute("href"), outline: cs.outlineStyle + " " + cs.outlineWidth, shadow: cs.boxShadow }; });
  log("F07", "Primeiro Tab leva a um 'pular para o conteúdo'", /pular|conte[uú]do|skip/i.test(first.text), JSON.stringify(first));
  const focusVisible = first.outline.indexOf("none") === -1 || first.shadow !== "none";
  log("F08", "Elemento focado tem indicador visível", focusVisible, first.outline + " | " + first.shadow.slice(0, 60));
  // percorre 40 tabs e conta elementos sem foco visível
  let noRing = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { t: (a.innerText || a.getAttribute("aria-label") || a.tagName).trim().slice(0, 30), ok: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none" }; });
    if (!f.ok) noRing.push(f.t);
  }
  log("F09", "Todos os 40 primeiros elementos focáveis mostram foco", noRing.length === 0, noRing.slice(0, 8).join(" | "));

  // Busca
  const search = page.locator('input[type="search"], input[placeholder*="Buscar" i], input[placeholder*="Pesquis" i]').first();
  if (await search.count()) {
    await search.fill("vacina"); await search.press("Enter"); await page.waitForTimeout(1200);
    const body = await page.evaluate(() => document.body.innerText);
    log("F10", "Busca global encontra 'vacinação'", /vacina/i.test(body), page.url());
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    const stillOpen = await page.evaluate(() => !!document.querySelector("#side-panel.open"));
    log("F10b", "Painel de busca fecha com Esc", !stillOpen);
    if (stillOpen) { await page.goto(BASE + "#/avisos"); await page.goto(BASE + "#/dashboard"); await page.waitForTimeout(800); }
  } else log("F10", "Campo de busca global presente", false);

  // Escape fecha modal / painel de notificações
  const bell = page.locator('[data-action*="notif" i], [aria-label*="otifica" i]').first();
  if (await bell.count()) {
    await bell.click({ force: true }); await page.waitForTimeout(400);
    const open = await page.evaluate(() => !!document.querySelector('#side-panel.open'));
    const focusIn = await page.evaluate(() => !!document.activeElement.closest('#side-panel'));
    const dlg = await page.evaluate(() => { const s = document.querySelector('#side-panel'); return { role: s.getAttribute('role'), modal: s.getAttribute('aria-modal'), label: s.getAttribute('aria-label') || s.getAttribute('aria-labelledby') }; });
    log("F11b", "Painel lateral recebe foco e tem semântica de diálogo", focusIn && dlg.role === "dialog", JSON.stringify({ focusIn, ...dlg }));
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    const still = await page.evaluate(() => !!document.querySelector('#side-panel.open'));
    log("F11", "Painel de notificações abre e fecha com Esc", open && !still, `open=${open} afterEsc=${still}`);
  } else log("F11", "Botão de notificações presente", false);

  // Formulário de aviso vazio
  await page.goto(BASE + "#/admin/noticias/nova"); await page.waitForTimeout(1000);
  await page.waitForFunction(() => !document.querySelector('#nt-salvar')?.disabled, null, { timeout: 8000 }).catch(() => {});
  const submit = page.locator('#nt-salvar');
  if (await submit.count()) {
    await submit.click(); await page.waitForTimeout(600);
    const st = await page.evaluate(() => ({ hash: location.hash, invalid: [...document.querySelectorAll("form :invalid")].map((e) => e.name), aria: [...document.querySelectorAll('[aria-invalid="true"]')].length }));
    log("F12", "Novo aviso vazio não é enviado e marca campos inválidos", st.hash.includes("nova") && (st.invalid.length > 0 || st.aria > 0), JSON.stringify(st));
  }

  // XSS armazenado: aviso com HTML
  const tk = await page.evaluate(() => localStorage.getItem("decos_intranet_token"));
  const created = await page.evaluate(async (tk) => {
    const r = await fetch("http://localhost:8000/avisos", { method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + tk }, body: JSON.stringify({ titulo: "<img src=x onerror=window.__xss=1> Teste XSS", categoria: "QA", conteudo: "<script>window.__xss=2</script><b>negrito</b>" }) });
    return r.json();
  }, tk);
  await page.goto(BASE + "#/avisos"); await page.waitForTimeout(1200);
  await page.goto(BASE + "#/avisos/" + created.id); await page.waitForTimeout(1200);
  await page.goto(BASE + "#/dashboard"); await page.waitForTimeout(1200);
  const xss = await page.evaluate(() => window.__xss);
  log("F13", "Conteúdo HTML em aviso é escapado (sem XSS)", !xss, "window.__xss=" + xss);
  // Limpeza: aviso já lido não pode ser excluído (409), então é arquivado.
  await page.evaluate(async ([tk, id]) => {
    const h = { Authorization: "Bearer " + tk, "content-type": "application/json" };
    const d = await fetch("http://localhost:8000/avisos/" + id, { method: "DELETE", headers: h });
    if (!d.ok) await fetch("http://localhost:8000/avisos/" + id, { method: "PUT", headers: h, body: JSON.stringify({ status: "ARQUIVADO" }) });
  }, [tk, created.id]);

  // Logout
  const logout = page.locator('[data-action="logout"]').first();
  if (await logout.count() && await logout.isVisible()) { await logout.click(); }
  else { const av = page.locator('[data-action*="user-menu" i], [data-action*="perfil" i], .topbar-avatar, [aria-label*="conta" i]').first(); if (await av.count()) { await av.click(); await page.waitForTimeout(300); } await page.locator('[data-action="logout"]').first().click().catch(() => {}); }
  await page.waitForTimeout(1200);
  const tokenAfter = await page.evaluate(() => localStorage.getItem("decos_intranet_token"));
  log("F14", "Logout limpa token e volta ao login", !tokenAfter && page.url().includes("#/login"), page.url());
  await page.goto(BASE + "#/admin/usuarios"); await page.waitForTimeout(1000);
  log("F15", "Após logout, rota protegida exige login", page.url().includes("#/login"), page.url());

  // Token inválido / expirado
  await page.evaluate(() => localStorage.setItem("decos_intranet_token", "abc.def.ghi")); await page.goto(BASE + "#/dashboard"); await page.reload(); await page.waitForTimeout(1500);
  log("F16", "Token inválido derruba sessão para o login", page.url().includes("#/login"), page.url());
  log("F17", "Sem exceções JS não tratadas durante o fluxo", errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();

  // Primeiro acesso: troca de senha obrigatória
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
    await p.goto(BASE + "#/login"); await p.fill('input[name="email"]', "jp.qa@example.com"); await p.fill('input[name="senha"]', PASS);
    await p.locator('input[name="senha"]').press("Enter"); await p.waitForTimeout(2500);
    const h1 = p.url();
    await p.goto(BASE + "#/dashboard"); await p.waitForTimeout(1200);
    log("F23", "Primeiro acesso força troca de senha e bloqueia navegação", h1.includes("trocar-senha") && p.url().includes("trocar-senha"), h1 + " → " + p.url());
    await p.screenshot({ path: `${OUT}shots/fluxo_primeiro_acesso.png`, fullPage: true });
    const pw = p.locator('input[type="password"]');
    const n = await pw.count();
    if (n >= 2) {
      await pw.nth(0).fill(PASS); await pw.nth(1).fill("abc"); if (n > 2) await pw.nth(2).fill("xyz");
      await p.locator('form button[type="submit"]').first().click(); await p.waitForTimeout(1200);
      const txt = await p.evaluate(() => document.body.innerText);
      log("F24", "Troca de senha rejeita senha fraca/divergente com mensagem", p.url().includes("trocar-senha") && /senha|caracter|coincid|igua/i.test(txt), (txt.match(/.*(caracter|coincid|fraca|m[ií]nimo).*/i) || [""])[0].slice(0, 120));
      await p.screenshot({ path: `${OUT}shots/fluxo_troca_senha_erro.png`, fullPage: true });
    } else log("F24", "Troca de senha rejeita senha fraca (não executado: jp.qa não está com troca obrigatória)", false, "veja o README");
    await c.close();
  }

  // RBAC por perfil (UI)
  for (const [role, forbidden] of [["leitura", ["#/admin/noticias", "#/admin/usuarios", "#/admin/acessos"]], ["colaborador", ["#/admin/eventos", "#/admin/auditoria", "#/admin/acessos"]], ["rh", ["#/admin/usuarios", "#/admin/auditoria", "#/admin/acessos"]]]) {
    const tk2 = await token(browser, USERS[role]);
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await c.addInitScript((t) => localStorage.setItem("decos_intranet_token", t), tk2);
    const p = await c.newPage();
    for (const r of forbidden) { await p.goto(BASE + r); await p.waitForTimeout(1000); log("F18", `${role} não acessa ${r}`, !p.url().includes(r.slice(1)), p.url()); }
    await p.goto(BASE + "#/dashboard"); await p.waitForTimeout(1200);
    const menu = await p.evaluate(() => [...document.querySelectorAll("aside a, nav a")].map((a) => a.getAttribute("href")).filter(Boolean));
    log("F19", `${role}: menu sem links administrativos proibidos`, !forbidden.some((f) => menu.includes(f)), menu.filter((h) => h.includes("admin")).join(", "));
    if (role === "leitura") {
      await p.goto(BASE + "#/eventos/1"); await p.waitForTimeout(1000);
      const btn = await p.evaluate(() => [...document.querySelectorAll("button")].filter((b) => /inscrev/i.test(b.innerText) && !b.disabled && b.offsetParent).map((b) => b.innerText.trim()));
      log("F20", "leitura: sem botão de inscrição habilitado em evento", btn.length === 0, btn.join(","));
    }
    await c.close();
  }

  // Mobile: menu lateral
  const m = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const tk3 = await token(browser, USERS.colaborador);
  await m.addInitScript((t) => localStorage.setItem("decos_intranet_token", t), tk3);
  const mp = await m.newPage();
  await mp.goto(BASE + "#/dashboard"); await mp.waitForTimeout(1200);
  const sidebarVisibleBefore = await mp.evaluate(() => { const s = document.querySelector(".sidebar"); if (!s) return null; const r = s.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && getComputedStyle(s).visibility !== "hidden"; });
  const toggle = mp.locator('[data-action="toggle-sidebar"]:visible, [data-action="open-menu"]:visible').first();
  let opened = null, closed = null;
  if (await toggle.count()) {
    await toggle.click({ timeout: 5000 }); await mp.waitForTimeout(500);
    const ae = await mp.evaluate(() => ({ exp: document.querySelector('[data-action="toggle-sidebar"]')?.getAttribute('aria-expanded'), focusIn: !!document.activeElement.closest('.sidebar') }));
    log("F21b", "Mobile: menu aberto atualiza aria-expanded e move foco para o menu", ae.exp === "true" && ae.focusIn, JSON.stringify(ae));
    opened = await mp.evaluate(() => { const s = document.querySelector(".sidebar"); const r = s.getBoundingClientRect(); return r.right > 50 && r.left >= -1; });
    await mp.screenshot({ path: `${OUT}shots/mobile_menu_aberto.png` });
    await mp.keyboard.press("Escape"); await mp.waitForTimeout(500);
    closed = await mp.evaluate(() => { const s = document.querySelector(".sidebar"); const r = s.getBoundingClientRect(); return !(r.right > 50 && r.left >= -1); });
  }
  log("F21", "Mobile: sidebar oculta por padrão e abre pelo botão de menu", sidebarVisibleBefore === false && opened === true, `antes=${sidebarVisibleBefore} aberto=${opened}`);
  log("F22", "Mobile: Esc fecha o menu lateral", closed === true, `fechado=${closed}`);
  await m.close();
}

const browser = await chromium.launch(process.env.CHR ? { executablePath: process.env.CHR } : {});
const only = process.argv[2];
if (!only || only === "functional") await functional(browser);
if (!only || only === "pages") {
  await auditRole(browser, "admin", [...COMMON, ...GESTAO, ...ADMIN, "#/login"]);
  await auditRole(browser, "rh", [...COMMON, ...GESTAO]);
  await auditRole(browser, "colaborador", COMMON);
  await auditRole(browser, "leitura", COMMON);
  // login deslogado em todas as larguras
  for (const vp of VIEWPORTS) for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript((theme) => localStorage.setItem("decos_intranet_state", JSON.stringify({ theme })), theme);
    const page = await ctx.newPage();
    await page.goto(BASE + "#/login"); await page.waitForLoadState("networkidle"); await page.waitForTimeout(400);
    const info = await inspect(page, vp);
    const slug = `anon_${vp.name}_${theme}_login`;
    await page.screenshot({ path: `${OUT}shots/${slug}.png`, fullPage: true });
    let axe = null;
    if (vp.name === "1440" || vp.name === "375") { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze(); axe = r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ")), sample: v.nodes[0]?.failureSummary?.slice(0, 220) })); }
    results.pages.push({ role: "anon", vp: vp.name, theme, route: "#/login", shot: slug, ...info, console: [], http: [], axe });
    await ctx.close();
  }
}
await browser.close();
results.meta.finished = new Date().toISOString();
const file = only ? `${OUT}results_${only}.json` : `${OUT}results.json`;
fs.writeFileSync(file, JSON.stringify(results, null, 1));
console.log("ok", file);
