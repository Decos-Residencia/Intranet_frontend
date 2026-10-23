"""Consolida out/results_pages.json em um resumo legível (out/summary.json + stdout)."""
import json, sys, collections, pathlib

OUT = pathlib.Path(__file__).parent / "out"
data = json.loads((OUT / "results_pages.json").read_text())
pages = data["pages"]

summary = {"total_loads": len(pages)}

# axe: agrega por regra
axe = collections.defaultdict(lambda: {"impact": None, "help": "", "nodes": 0, "where": set(), "targets": set(), "sample": ""})
for p in pages:
    for v in p.get("axe") or []:
        a = axe[v["id"]]
        a["impact"] = v.get("impact"); a["help"] = v.get("help", ""); a["nodes"] += v.get("n", 0)
        a["where"].add(f'{p["route"]} ({p["role"]}/{p["vp"]}/{p["theme"]})')
        a["targets"].update(v.get("targets", [])); a["sample"] = a["sample"] or (v.get("sample") or "")
order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3, None: 4}
summary["axe"] = [
    {"id": k, "impact": v["impact"], "help": v["help"], "nodes": v["nodes"], "pages": len(v["where"]),
     "where": sorted(v["where"])[:8], "targets": sorted(v["targets"])[:8], "sample": v["sample"]}
    for k, v in sorted(axe.items(), key=lambda kv: (order[kv[1]["impact"]], -kv[1]["nodes"]))
]

# overflow horizontal
ov = []
for p in pages:
    if p["scrollWidth"] > p["clientWidth"] + 1:
        ov.append({"route": p["route"], "role": p["role"], "vp": p["vp"], "theme": p["theme"], "excess": p["scrollWidth"] - p["clientWidth"], "els": [o["el"] for o in p["overflow"][:4]], "shot": p["shot"]})
summary["overflow"] = sorted(ov, key=lambda o: (-o["excess"]))
by_vp = collections.Counter(o["vp"] for o in ov)
summary["overflow_by_vp"] = dict(by_vp)
summary["overflow_routes"] = sorted({(o["route"], o["vp"]) for o in ov})

# alvos de toque
st = collections.Counter(); st_ex = {}
for p in pages:
    if p["vp"] in ("320", "375"):
        for t in p["smallTargets"]:
            key = t["el"].split(" «")[0]
            st[key] += 1; st_ex.setdefault(key, (t, p["route"]))
summary["small_targets"] = [{"el": k, "count": c, "ex": st_ex[k][0], "route": st_ex[k][1]} for k, c in st.most_common(20)]

tiny = collections.Counter(); tiny_ex = {}
for p in pages:
    for t in p["tinyText"]:
        key = t["el"].split(" «")[0]; tiny[key] += 1; tiny_ex.setdefault(key, t)
summary["tiny_text"] = [{"el": k, "count": c, "px": tiny_ex[k]["px"], "ex": tiny_ex[k]["el"]} for k, c in tiny.most_common(15)]

# console / http
cons = collections.Counter(); http = collections.Counter(); http_where = {}
for p in pages:
    for c in p["console"]: cons[c[:160]] += 1
    for h in p["http"]:
        http[h] += 1; http_where.setdefault(h, f'{p["route"]} ({p["role"]})')
summary["console"] = cons.most_common(20)
summary["http"] = [(h, n, http_where[h]) for h, n in http.most_common(25)]
summary["broken_imgs"] = sorted({i for p in pages for i in p["brokenImgs"]})
summary["no_alt"] = sorted({i for p in pages for i in p["noAlt"]})

# rotas que redirecionaram / h1
summary["redirects"] = sorted({(p["role"], p["route"], p["finalHash"]) for p in pages if p["finalHash"] != p["route"] and p["vp"] == "1440" and p["theme"] == "light"})
summary["h1"] = sorted({(p["route"], len(p["h1"])) for p in pages if p["vp"] == "1440" and p["theme"] == "light" and p["role"] in ("admin", "anon") and len(p["h1"]) != 1})
summary["landmarks_missing_main"] = sorted({p["route"] for p in pages if p["landmarks"]["main"] == 0})
summary["slow"] = sorted([(p["route"], p["role"], p["vp"], p["ms"]) for p in pages if p.get("ms", 0) > 2500], key=lambda x: -x[3])[:10]
summary["titles"] = sorted({(p["route"], p["title"]) for p in pages if p["vp"] == "1440" and p["theme"] == "light" and p["role"] == "admin"})

(OUT / "summary.json").write_text(json.dumps(summary, indent=1, ensure_ascii=False, default=list))
if "-q" not in sys.argv:
    print(json.dumps({k: summary[k] for k in summary if k not in ("titles",)}, indent=1, ensure_ascii=False, default=list)[:20000])
