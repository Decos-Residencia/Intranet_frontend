import datetime as dt, httpx
c=httpx.Client(base_url="http://127.0.0.1:8000", timeout=30)
H={"Authorization":"Bearer "+c.post("/auth/login",json={"email":"admin.qa@example.com","senha":"SenhaQA123!"}).json()["access_token"]}
setores={s["nome"]:s["id"] for s in c.get("/setores",headers=H,params={"page_size":100}).json()["items"]}
today=dt.date.today()
users=[("Mariana Albuquerque Ferreira dos Santos","rh.qa@example.com","RH","Recursos Humanos","Analista de RH Sênior"),
("Carlos Eduardo Lima","colab.qa@example.com","COLABORADOR","Enfermagem","Enfermeiro Assistente"),
("Beatriz Nogueira","leitura.qa@example.com","LEITURA","Farmácia Hospitalar","Farmacêutica"),
("João Pedro Costa","jp.qa@example.com","COLABORADOR","Centro Cirúrgico","Técnico de Enfermagem"),
("Ana Clara Ribeiro","ana.qa@example.com","COLABORADOR","Enfermagem","Coordenadora de Enfermagem")]
for i,(n,e,pf,s,cg) in enumerate(users):
    nasc = today.replace(year=1990) if i in (1,3) else dt.date(1988,today.month,min(28,today.day+4))
    r=c.post("/auth/register",headers=H,json={"nome":n,"email":e,"senha":"SenhaQA123!","setor_id":setores[s],"cargo":cg,"ramal":f"21{i}0",
      "data_nascimento":str(nasc),"data_admissao":"2020-03-01"})
    print(e, r.status_code, r.text[:150] if r.status_code>=300 else "")
    if r.status_code<300 and pf!="COLABORADOR":
        u=c.put(f"/usuarios/{r.json()['id']}",headers=H,json={"perfil":pf}); print("  perfil",u.status_code,u.text[:100] if u.status_code>=300 else "")
