# CLAUDE.md — [NOME DO PROJETO]

> Este arquivo é lido automaticamente pelo Claude Code no início de cada sessão nesta pasta.
> Mantenha atualizado. Não apagar seções antigas — mover para "Histórico" em vez de deletar.

## 1. Objetivo do projeto
Descreva em 2-4 linhas o que este projeto faz e para quem.

Exemplo: "Sistema de acompanhamento de [convênios federais / obras / condomínio X].
Monitora [vigência / status / ocorrências], busca dados em [site/planilha],
e atualiza [planilha Google Sheets / banco]."

## 2. Regra de independência (fixa — não remover)
- Todo código de produção deve rodar de forma autossuficiente com `python script.py`,
  usando apenas bibliotecas padrão de terceiros (ex: `requests`, `gspread`,
  `google-api-python-client`, `firebase-admin`, `selenium`/`playwright`).
- **Proibido** usar MCP, Claude API, ou qualquer dependência da Anthropic dentro do
  código de runtime — exceto em função isolada e explicitamente pedida (ex: `resumir_com_ia()`).
- Ferramentas do Claude Code (MCP, subagents, hooks) servem só para acelerar o
  *desenvolvimento*. O artefato final deve ser portátil para qualquer máquina sem Claude.
- Teste de aceitação: se não rodar numa máquina limpa sem Claude instalado, não está pronto.

## 3. Stack e infraestrutura
- Linguagem: Python [versão]
- Domínio/hospedagem: Vercel
- Autenticação/segurança: Firebase
- Integrações: Google Sheets (via `gspread`), triggers do Apps Script / cron
- Outras dependências: [listar]

## 4. Estrutura de pastas
```
/projeto
  /src
  /scripts
  /config
  requirements.txt
  CLAUDE.md
```
(ajustar conforme o projeto real)

## 5. Plano de ação atual
- [ ] Etapa 1: ...
- [ ] Etapa 2: ...
- [ ] Etapa 3: ...

## 6. Decisões já tomadas (não reabrir sem motivo)
- Decisão: ... | Motivo: ... | Data: ...

## 7. Obstáculos enfrentados e soluções
- Problema: ... 
  Solução: ...
  Data: ...

## 8. Histórico de sessões (resumo, não log completo)
### [Data] — Sessão N
- O que foi feito:
- Próximo passo:

## 9. Coisas que NÃO fazer (aprendido na prática)
- Ex: não usar biblioteca X porque conflita com Y.
- Ex: não deletar coluna Z da planilha, é usada pelo trigger.
