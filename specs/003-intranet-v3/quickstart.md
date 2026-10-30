# Quickstart: conferir a Intranet v3 localmente

Mesmo ambiente das specs 001/002: PostgreSQL local, API em `:8010` e frontend em `:5500`. Senha de todos: `SenhaLocal123!`.

1. **Migração**: `alembic upgrade head` aplica a `0026_intranet_v3`; `alembic downgrade -1` a desfaz sem erro.
2. **Revisão** (US2): entre como `ana.paula.santos@example.com` (RH), crie um aviso e clique em "Enviar para revisão". Entre como `admin.local@example.com`, abra **Administração → Revisão**, devolva com motivo e confira a notificação do RH. Reenvie e aprove; o aviso aparece para o visitante.
3. **Destaque** (US3): publique um aviso com "Exibir em destaque até" daqui a 2 minutos; depois do horário, ele sai da Inicial e continua abrindo pelo link.
4. **Lembrete** (US4): como `patricia.souza@example.com`, crie na Minha agenda uma tarefa para daqui a 2 min com lembrete "na hora"; mantenha a intranet aberta e veja a notificação no sino (e o alerta do navegador, se permitido).
5. **Calendário** (US5): em Eventos, ligue/desligue a camada "Institucional"; confira o feriado de 2/11 e 15/11 calculados, cadastre "Auditoria ONA" (interno) e veja que o visitante não a vê.
6. **Obrigatório e presença** (US1/US7): como ADMIN, crie o tema obrigatório "NR-32" para a Recepção Central e ligue uma turma a ele. A Patrícia vê "NR-32" pendente em **Meu painel**. Confirme a presença dela depois do início, e o tema sai dos pendentes.
7. **Vagas** (US6): como RH, publique uma vaga. Como Patrícia, clique em "Tenho interesse". Como RH, veja e exporte os interessados. Como Juliana (Leitura), confira que a lista de interessados não aparece.
8. **Evidências** (US7): como ADMIN, em **Administração → Auditoria → Exportar evidências**, gere o PDF do trimestre para a Recepção Central e confira a capa, o sumário e as três seções.
9. **Testes**: suíte do backend (`run-tests.sh`), os roteiros de navegador anteriores e os novos, e o axe nas telas novas (3 temas × 2 larguras).
