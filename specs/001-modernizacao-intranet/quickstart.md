# Quickstart: validar a Modernização da Intranet

Roteiro para conferir que cada história ficou **completa**. Marque cada linha ao validar.

## Subir o ambiente

```bash
# Backend
cd Intranet_backend && source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (outra aba)
cd Intranet_frontend && python3 -m http.server 5500
# abrir http://localhost:5500
```

Usuários de teste: um de cada perfil (LEITURA, COLABORADOR, RH, ADMIN) — use `docs/qa/task-01/scripts/seed_users.py`.

## Testes automáticos

```bash
cd Intranet_backend && pytest -q          # todos devem passar
cd Intranet_frontend/docs/qa/task-01/scripts && npm i && node audit.mjs   # Lighthouse/axe (SC-006)
```

## Roteiro manual por história

| US | Passo | Esperado |
|---|---|---|
| 1 | Como ADMIN, abrir `#/admin/acessos`, mudar colaborador → RH | Salvo, aparece na Auditoria |
| 1 | Conceder "Gerenciar eventos" a um colaborador; entrar como ele | Vê só gestão de eventos |
| 1 | Tentar rebaixar o único ADMIN | Bloqueado com mensagem |
| 1 | Olhar topo e menu lateral com qualquer perfil | Sem botão de troca de perfil |
| 2 | Colaborador: inscrever-se num evento pela Inicial | 1–2 cliques, botão vira "Inscrito" |
| 2 | Aviso não aberto na Inicial / lista | Marca "não lido"; após abrir, "lido" |
| 2 | ADMIN: Inicial | ≤ 4 cartões + área "Precisa da sua atenção" |
| 3 | Seletor de tema: Claro, Escuro, Vinho, Automático; recarregar e entrar em outro navegador | Tema mantido |
| 4 | Texto 200% em janela de 320 px | Sem rolagem horizontal |
| 4 | Alto contraste, reduzir movimento, reduzir transparência | Sólido, sem animação, contraste 7:1 |
| 4 | Navegar a Inicial só com Tab | Foco visível em tudo, "Pular para o conteúdo" |
| 5 | Enviar documento sem descrição | Bloqueado |
| 5 | Enviar nova versão vigente | Anterior vira "Versão antiga", visível no histórico |
| 6 | Aniversariantes | Só o mês atual, sem chips de meses |
| 7 | Buscar pelo número do ramal; copiar ramal | Encontra; copia com confirmação |
| 8 | Colaborador abre chamado e vai a "Meus chamados" | Chamado listado com status |
| 9 | ADMIN cria atalho "Site Decós"; colaborador adiciona atalho pessoal | Global para todos; pessoal só para ele; abre em nova aba |
| 10 | "Quem leu" num aviso | Lista nome/setor/data |
| 10 | RH remove aviso | Arquivado, não excluído; histórico registra |
| 10 | Filtro Treinamento; hover no calendário | Só treinamentos; eventos do dia abaixo |
| 10 | Inscrever-se com SMTP configurado | E-mail em até 5 min |
| 11 | Documento `research.md` §1 revisado pela equipe | ≥ 5 referências com decisões |
