"""Usuários da auditoria, um por perfil (RH, Colaborador, Leitura) e dois colaboradores extras.

Idempotente: e-mails já cadastrados são ignorados. Todos usam a senha QA_SENHA.
Usuários criados pelo admin começam com troca de senha obrigatória (ver README).
"""
import datetime as dt
import os

import httpx

API = os.getenv("QA_API", "http://127.0.0.1:8000")
EMAIL = os.getenv("QA_ADMIN_EMAIL", "admin.qa@example.com")
SENHA = os.getenv("QA_SENHA", "SenhaQA123!")

c = httpx.Client(base_url=API, timeout=30)
r = c.post("/auth/login", json={"email": EMAIL, "senha": SENHA})
r.raise_for_status()
H = {"Authorization": f"Bearer {r.json()['access_token']}"}

setores = {s["nome"]: s["id"] for s in c.get("/setores", headers=H, params={"page_size": 100}).json()["items"]}
existentes = {u["email"] for u in c.get("/usuarios", headers=H, params={"page_size": 100}).json()["items"]}


def nascimento(dias: int) -> str:
    """Aniversário daqui a `dias` dias, num ano fixo (seguro para 29/02)."""
    alvo = dt.date.today() + dt.timedelta(days=dias)
    try:
        return str(alvo.replace(year=1990))
    except ValueError:  # 29/02 em ano não bissexto
        return str(alvo.replace(year=1992))


# (nome, e-mail, perfil, setor, cargo, aniversário em N dias)
USUARIOS = [
    ("Mariana Albuquerque Ferreira dos Santos", "rh.qa@example.com", "RH", "Recursos Humanos", "Analista de RH Sênior", 4),
    ("Carlos Eduardo Lima", "colab.qa@example.com", "COLABORADOR", "Enfermagem", "Enfermeiro Assistente", 0),
    ("Beatriz Nogueira", "leitura.qa@example.com", "LEITURA", "Farmácia Hospitalar", "Farmacêutica", 4),
    ("João Pedro Costa", "jp.qa@example.com", "COLABORADOR", "Centro Cirúrgico", "Técnico de Enfermagem", 0),
    ("Ana Clara Ribeiro", "ana.qa@example.com", "COLABORADOR", "Enfermagem", "Coordenadora de Enfermagem", 4),
]
for i, (nome, email, perfil, setor, cargo, dias) in enumerate(USUARIOS):
    if email in existentes:
        print(email, "já existe")
        continue
    r = c.post("/auth/register", headers=H, json={
        "nome": nome, "email": email, "senha": SENHA, "setor_id": setores[setor], "cargo": cargo,
        "ramal": f"21{i}0", "data_nascimento": nascimento(dias), "data_admissao": "2020-03-01",
    })
    print(email, r.status_code, r.text[:150] if r.status_code >= 300 else "")
    if r.status_code < 300 and perfil != "COLABORADOR":
        u = c.put(f"/usuarios/{r.json()['id']}", headers=H, json={"perfil": perfil})
        print("  perfil", perfil, u.status_code, u.text[:100] if u.status_code >= 300 else "")
