import datetime as dt, httpx
B="http://127.0.0.1:8000"; c=httpx.Client(base_url=B, timeout=30)
t=c.post("/auth/login",json={"email":"admin.qa@example.com","senha":"SenhaQA123!"}).json()["access_token"]
H={"Authorization":f"Bearer {t}"}
def p(path, body):
    r=c.post(path,json=body,headers=H); print(path, r.status_code, r.text[:120] if r.status_code>=300 else ""); return r
setores={s["nome"]:s["id"] for s in c.get("/setores",headers=H).json()["items"]}
for n,r in [("Enfermagem","2101"),("Recursos Humanos","2200"),("Farmácia Hospitalar","2310"),("Centro Cirúrgico","2405")]:
    if n not in setores: setores[n]=p("/setores",{"nome":n,"ramal":r}).json()["id"]
today=dt.date.today()
users=[("Mariana Albuquerque Ferreira dos Santos","rh.qa@example.com","RH","Recursos Humanos","Analista de RH Sênior"),
("Carlos Eduardo Lima","colab.qa@example.com","COLABORADOR","Enfermagem","Enfermeiro Assistente"),
("Beatriz Nogueira","leitura.qa@example.com","LEITURA","Farmácia Hospitalar","Farmacêutica"),
("João Pedro Costa","jp.qa@example.com","COLABORADOR","Centro Cirúrgico","Técnico de Enfermagem"),
("Ana Clara Ribeiro","ana.qa@example.com","COLABORADOR","Enfermagem","Coordenadora de Enfermagem")]
for i,(n,e,pf,s,cg) in enumerate(users):
    p("/usuarios",{"nome":n,"email":e,"senha":"SenhaQA123!","setor_id":setores[s],"cargo":cg,"ramal":f"21{i}0","perfil":pf,
      "data_nascimento":str(today.replace(year=1990)) if i<2 else str(dt.date(1988,today.month,min(28,today.day+3))),"data_admissao":"2020-03-01"})
for i,(tt,cat) in enumerate([("Campanha de vacinação contra a gripe 2026","Saúde"),("Novo protocolo de higienização das mãos nas UTIs","Protocolos"),
  ("Manutenção programada no sistema de prontuário eletrônico neste sábado das 22h às 04h","TI"),("Confraternização de fim de ano","Eventos"),
  ("Atualização da política de férias","RH"),("Inauguração da nova ala pediátrica","Institucional"),("Treinamento obrigatório de LGPD","Treinamento")]):
    p("/avisos",{"titulo":tt,"categoria":cat,"conteudo":("Prezados colaboradores, informamos que "+tt.lower()+". "*1)+"Lorem ipsum dolor sit amet, consectetur adipiscing elit. "*12})
p("/avisos",{"titulo":"Rascunho: reorganização dos plantões","categoria":"RH","conteudo":"Rascunho interno.","status":"RASCUNHO"})
now=dt.datetime.now(dt.timezone.utc)
for i,(tt,cat) in enumerate([("Semana de Enfermagem","Institucional"),("Workshop de Segurança do Paciente","Treinamento"),("Corrida Decós 5K","Bem-estar"),("Palestra: Saúde Mental no Trabalho","Bem-estar")]):
    st=now+dt.timedelta(days=3+i*5)
    p("/eventos",{"titulo":tt,"descricao":f"{tt} — participe!","descricao_longa":"Programação completa. "*20,"categoria":cat,"inicio":st.isoformat(),"fim":(st+dt.timedelta(hours=3)).isoformat(),
      "local":"Auditório Principal","organizador":"Recursos Humanos","vagas":[30,None,2,50][i],"status":"PUBLICADO"})
for q,cat in [("Como solicito acesso ao prontuário eletrônico?","TI"),("Onde consulto meu holerite?","RH"),("Como abrir um chamado de manutenção?","Geral"),("Qual o horário do refeitório?","Geral")]:
    p("/faqs",{"pergunta":q,"resposta":"Acesse o portal e siga as instruções. "*5,"categoria":cat})
