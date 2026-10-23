import { firefox, webkit, chromium } from "playwright";
const BASE = "http://localhost:5500/"; const out = [];
const routes = ["#/dashboard", "#/avisos", "#/eventos/1", "#/diretorio", "#/admin/usuarios", "#/admin/noticias/nova"];
for (const [name, bt, opts] of [["firefox", firefox, {}], ["webkit", webkit, {}], ["chromium", chromium, process.env.CHR ? { executablePath: process.env.CHR } : {}]]) {
  let b; try { b = await bt.launch(opts); } catch (e) { out.push({ name, error: e.message.split("\n")[0] }); continue; }
  for (const vp of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await p.goto(BASE + "#/login"); await p.fill('input[name="email"]', "admin.qa@example.com"); await p.fill('input[name="senha"]', "SenhaQA123!");
    await p.locator('input[name="senha"]').press("Enter");
    const ok = await p.waitForFunction(() => location.hash.startsWith("#/dashboard"), null, { timeout: 15000 }).then(() => true).catch(() => false);
    const res = { name, vp: vp.width, login: ok, pages: [] };
    for (const r of routes) {
      await p.goto(BASE + r); await p.waitForTimeout(1200);
      const m = await p.evaluate(() => ({ h: location.hash, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, txt: document.querySelector(".content, main, #app")?.innerText.length || document.body.innerText.length }));
      await p.screenshot({ path: `out/shots/xb_${name}_${vp.width}_${r.replace(/[#/]+/g, "_")}.png` });
      res.pages.push({ r, ...m });
    }
    res.errors = errs.slice(0, 5); out.push(res); await ctx.close();
  }
  await b.close();
}
console.log(JSON.stringify(out, null, 1));
