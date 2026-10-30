"""Massa de dados da auditoria: setores, avisos, eventos e FAQs criados pela API.

Idempotente: o que já existe (mesmo nome/título) não é criado de novo.
Use SOMENTE contra um banco de teste. Credenciais do admin via QA_ADMIN_EMAIL e QA_SENHA.
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


def listar(path):
    d = c.get(path, headers=H, params={"page_size": 100}).json()
    return d["items"] if isinstance(d, dict) else d


def criar(path, body):
    r = c.post(path, json=body, headers=H)
    print(path, r.status_code, r.text[:120] if r.status_code >= 300 else body.get("titulo") or body.get("nome") or body.get("pergunta"))
    return r


setores = {s["nome"] for s in listar("/setores")}
for nome, ramal in [("Enfermagem", "2101"), ("Recursos Humanos", "2200"), ("Farmácia Hospitalar", "2310"), ("Centro Cirúrgico", "2405")]:
    if nome not in setores:
        criar("/setores", {"nome": nome, "ramal": ramal})

avisos = {a["titulo"] for a in listar("/avisos")}
corpo = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " * 12
for titulo, cat in [
    ("Campanha de vacinação contra a gripe 2026", "Saúde"),
    ("Novo protocolo de higienização das mãos nas UTIs", "Protocolos"),
    ("Manutenção programada no sistema de prontuário eletrônico neste sábado das 22h às 04h", "TI"),
    ("Confraternização de fim de ano", "Eventos"),
    ("Atualização da política de férias", "RH"),
    ("Inauguração da nova ala pediátrica", "Institucional"),
    ("Treinamento obrigatório de LGPD", "Treinamento"),
]:
    if titulo not in avisos:
        criar("/avisos", {"titulo": titulo, "categoria": cat, "conteudo": f"Prezados colaboradores, informamos que {titulo.lower()}. {corpo}"})
if "Rascunho: reorganização dos plantões" not in avisos:
    criar("/avisos", {"titulo": "Rascunho: reorganização dos plantões", "categoria": "RH", "conteudo": "Rascunho interno.", "status": "RASCUNHO"})

eventos = {e["titulo"] for e in listar("/eventos")}
agora = dt.datetime.now(dt.timezone.utc)
for i, (titulo, cat, vagas) in enumerate([
    ("Semana de Enfermagem", "Institucional", 30),
    ("Workshop de Segurança do Paciente", "Treinamento", None),
    ("Corrida Decós 5K", "Bem-estar", 2),  # 2 vagas: usado no teste de evento lotado
    ("Palestra: Saúde Mental no Trabalho", "Bem-estar", 50),
]):
    if titulo in eventos:
        continue
    inicio = agora + dt.timedelta(days=3 + i * 5)
    criar("/eventos", {"titulo": titulo, "descricao": f"{titulo} — participe!", "descricao_longa": "Programação completa. " * 20,
                       "categoria": cat, "inicio": inicio.isoformat(), "fim": (inicio + dt.timedelta(hours=3)).isoformat(),
                       "local": "Auditório Principal", "organizador": "Recursos Humanos", "vagas": vagas, "status": "PUBLICADO"})

faqs = {f["pergunta"] for f in listar("/faqs")}
for pergunta, cat in [
    ("Como solicito acesso ao prontuário eletrônico?", "TI"),
    ("Onde consulto meu holerite?", "RH"),
    ("Como abrir um chamado de manutenção?", "Geral"),
    ("Qual o horário do refeitório?", "Geral"),
]:
    if pergunta not in faqs:
        criar("/faqs", {"pergunta": pergunta, "resposta": "Acesse o portal e siga as instruções. " * 5, "categoria": cat})
