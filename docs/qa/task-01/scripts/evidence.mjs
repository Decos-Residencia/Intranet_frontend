// Capturas de evidência focadas por bug (JPEG, viewport, elemento destacado).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:5500/";
const DIR = new URL("./report/img/", import.meta.url).pathname;
fs.mkdirSync(DIR, { recursive: true });
const b = await chromium.launch(process.env.CHR ? { executablePath: process.env.CHR } : {});
const toks = {};
async function tok(email) {
  if (toks[email]) return toks[email];
  const r = await fetch("http://127.0.0.1:8000/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, senha: "SenhaQA123!" }) });
  return (toks[email] = (await r.json()).access_token);
}
async function page(vp, { email = "admin.qa@example.com", theme = "light", anon = false, mobile } = {}) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: vp.width < 800 ? 2 : 1, isMobile: mobile ?? vp.width < 768, hasTouch: vp.width < 1024 });
  const t = anon ? null : await tok(email);
  await ctx.addInitScript(([t, theme]) => { if (t) localStorage.setItem("decos_intranet_token", t); localStorage.setItem("decos_intranet_state", JSON.stringify({ theme })); }, [t, theme]);
  return ctx.newPage();
}
const mark = (p, sel) => p.evaluate((sel) => document.querySelectorAll(sel).forEach((e) => { e.style.outline = "3px solid #ff00aa"; e.style.outlineOffset = "2px"; }), sel);
const shot = (p, name, opts = {}) => p.screenshot({ path: DIR + name + ".jpg", type: "jpeg", quality: 72, ...opts });
const go = async (p, r, wait = 1300) => { await p.goto(BASE + r); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(wait); };

// Matriz responsiva do Início
for (const w of [320, 375, 768, 1024, 1440, 1920]) {
  const p = await page({ width: w, height: Math.round(w < 800 ? w * 2 : w * 0.62) }, { email: "colab.qa@example.com" });
  await go(p, "#/dashboard"); await shot(p, `matriz_${w}`); await p.context().close();
}
// B01 aniversariantes 320 overflow
{ const p = await page({ width: 320, height: 640 }); await go(p, "#/aniversariantes");
  await mark(p, "#ani-setor"); await p.evaluate(() => document.querySelector("#ani-setor").scrollIntoView({ block: "center" }));
  await p.evaluate(() => window.scrollTo(80, window.scrollY)); await p.waitForTimeout(200); await shot(p, "b01_aniversariantes_320"); await p.context().close(); }
// B02 avisos 320 pager
{ const p = await page({ width: 320, height: 640 }); await go(p, "#/avisos");
  await mark(p, "#avisos-pager"); await p.evaluate(() => document.querySelector("#avisos-pager").scrollIntoView({ block: "center" })); await p.waitForTimeout(200);
  await shot(p, "b02_avisos_pager_320"); await p.context().close(); }
// B03 menu mobile aberto
{ const p = await page({ width: 375, height: 812 }, { email: "colab.qa@example.com" }); await go(p, "#/avisos");
  await p.locator('[data-action="toggle-sidebar"]:visible').first().click(); await p.waitForTimeout(600); await shot(p, "b03_menu_mobile"); await p.context().close(); }
// B04 login 375 header
{ const p = await page({ width: 375, height: 812 }, { anon: true }); await go(p, "#/login"); await shot(p, "b04_login_375", { clip: { x: 0, y: 0, width: 375, height: 470 } }); await p.context().close(); }
// B05 sombra lateral (404)
{ const p = await page({ width: 375, height: 812 }); await go(p, "#/rota-inexistente"); await shot(p, "b05_sombra_sidebar_375", { clip: { x: 0, y: 60, width: 375, height: 420 } }); await p.context().close(); }
// B06 tabela usuários 375
{ const p = await page({ width: 375, height: 812 }); await go(p, "#/admin/usuarios");
  await p.evaluate(() => document.querySelector("table").scrollIntoView({ block: "start" })); await p.evaluate(() => window.scrollBy(0, -80)); await p.waitForTimeout(200);
  await shot(p, "b06_tabela_usuarios_375"); await p.context().close(); }
// B07 FAB sobre ações (1440)
{ const p = await page({ width: 1440, height: 900 }); await go(p, "#/admin/noticias"); await mark(p, ".quick-fab"); await shot(p, "b07_fab_sobre_acoes_1440", { clip: { x: 700, y: 560, width: 740, height: 340 } }); await p.context().close(); }
// B08 FAB sobre próximos eventos (1440)
{ const p = await page({ width: 1440, height: 900 }); await go(p, "#/dashboard"); await mark(p, ".quick-fab"); await shot(p, "b08_fab_eventos_1440", { clip: { x: 1030, y: 640, width: 410, height: 260 } }); await p.context().close(); }
// B09/B10 modal + toast de erro
{ const p = await page({ width: 1440, height: 900 }); await go(p, "#/admin/noticias");
  await p.locator('[data-action="delete-aviso"][data-id="9"], [data-action="delete-aviso"]').first().focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
  await p.keyboard.press("Tab"); await p.keyboard.press("Tab"); await p.keyboard.press("Tab");
  await p.evaluate(() => { const a = document.activeElement; a.style.outline = "3px solid #ff00aa"; });
  await shot(p, "b10_modal_foco_fora"); await p.context().close(); }
{ const p = await page({ width: 1440, height: 900 }); await go(p, "#/admin/noticias");
  await p.evaluate(async () => { App.toast("Este aviso já foi lido por 1 usuário(s). Arquive-o em vez de excluir para preservar o histórico."); });
  await p.waitForTimeout(500); await shot(p, "b09_toast_erro_com_check", { clip: { x: 320, y: 780, width: 800, height: 120 } }); await p.context().close(); }
// B11 painel lateral sem foco
{ const p = await page({ width: 1440, height: 900 }); await go(p, "#/dashboard");
  await p.locator('[data-action="open-notif"]').click(); await p.waitForTimeout(500); await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await shot(p, "b11_painel_nao_fecha_esc"); await p.context().close(); }
// B12 foco no tema escuro
{ const p = await page({ width: 1440, height: 900 }, { theme: "dark" }); await go(p, "#/dashboard");
  for (let i = 0; i < 9; i++) await p.keyboard.press("Tab");
  const r = await p.evaluate(() => { const x = document.activeElement.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; });
  await shot(p, "b12_foco_escuro", { clip: { x: Math.max(0, r.x - 60), y: Math.max(0, r.y - 40), width: Math.min(420, 1440 - Math.max(0, r.x - 60)), height: 140 } });
  await p.context().close(); }
// B13 login campos sem rótulo e bordas fracas
{ const p = await page({ width: 1440, height: 900 }, { anon: true }); await go(p, "#/login"); await shot(p, "b13_login_campos", { clip: { x: 690, y: 370, width: 600, height: 240 } }); await p.context().close(); }
// B14 banner truncado 375
{ const p = await page({ width: 375, height: 812 }); await go(p, "#/dashboard");
  await p.evaluate(() => document.querySelector(".hero-banner, .carousel")?.scrollIntoView({ block: "center" })); await p.waitForTimeout(300);
  await mark(p, ".carousel-dot"); await shot(p, "b14_banner_dots_375"); await p.context().close(); }
// B15 busca ausente no mobile
{ const p = await page({ width: 375, height: 812 }); await go(p, "#/dashboard"); await shot(p, "b15_topbar_mobile", { clip: { x: 0, y: 0, width: 375, height: 80 } }); await p.context().close(); }
// Fluxos positivos
{ const p = await page({ width: 1440, height: 900 }, { email: "leitura.qa@example.com" }); await go(p, "#/eventos/1"); await shot(p, "ok_leitura_evento"); await p.context().close(); }
{ const p = await page({ width: 1440, height: 900 }, { theme: "dark" }); await go(p, "#/dashboard"); await shot(p, "ok_dashboard_escuro"); await p.context().close(); }
{ const p = await page({ width: 1440, height: 900 }, { theme: "red" }); await go(p, "#/dashboard"); await shot(p, "ok_dashboard_vinho"); await p.context().close(); }
await b.close();
console.log(fs.readdirSync(DIR).join("\n"));
