# 🎽 WT Satisfação PDV — Guia Completo
## GitHub + Vercel + Firebase + Sheets + Dashboard · Versão 5.0

> Este guia documenta tudo que foi feito no projeto.
> Todas as etapas estão concluídas ✅

---

## SITUAÇÃO ATUAL DO PROJETO

| Componente | Status | Observação |
|---|---|---|
| Firebase Firestore | ✅ Ativo | Recebendo respostas |
| Formulário (Vercel) | ✅ No ar | wt-satisfacao-pdv.vercel.app |
| GitHub | ✅ Configurado | push.py funcionando |
| Sheets — sincronização | ✅ Automática a cada 30min | SincronizarFirebase.gs v5.0 |
| Sheets — menu WT Admin | ✅ Ativo | Apagar por linha ou por data |
| Alerta nota baixa (≤2) | ✅ Tempo real | EmailJS — chega em segundos |
| Relatório diário 22h | ✅ Ativo | Apps Script — 0% de erros |
| Dashboard | ✅ No ar | wt-satisfacao-pdv.vercel.app/dashboard.html |

---

## PRÉ-REQUISITOS — já instalados ✅

- Git instalado e configurado (`git config --global user.name/email`)
- Python instalado com PATH habilitado
- VSCode com a pasta do projeto aberta em `D:\Fanuel\Projetos Editáveis\WT Satisfação PDV`

---

## ETAPA 1 — Firebase ✅ CONCLUÍDA

**O que foi feito:**
- Projeto `wt-satisfacao-pdv` criado no Firebase
- Firestore criado na região `southamerica-east1` (São Paulo)
- Regras de segurança configuradas: qualquer um pode criar resposta, ninguém lê pelo formulário
- Coleção `vendedores` criada com documento `loja-teresina` (v1 a v6: João, Maria, Carlos, Ana, Pedro, Lúcia)
- App web registrado e credenciais copiadas para o `index.html`

**Credenciais do projeto:**
```
projectId:  wt-satisfacao-pdv
apiKey:     AIzaSyDwAL3IkbGaLXVFDZELIvrz5OTztKu2NHE
```

---

## ETAPA 2 — GitHub + Vercel ✅ CONCLUÍDA

**O que foi feito:**
- Repositório criado: `https://github.com/Ruan-Vitor/wt-satisfacao-pdv`
- Vercel conectado ao repositório com auto-deploy
- Site publicado em: `https://wt-satisfacao-pdv.vercel.app`

**Como atualizar o site (dia a dia):**
```
python push.py "Descrição do que mudou"
```
O Vercel detecta o push e atualiza em ~30 segundos.

---

## ETAPA 3 — Formulário ✅ CONCLUÍDA

**Telas do formulário:**
- Tela 0: Boas-vindas (logo WT + marca d'água FB)
- Tela 1: Produto (marca em chips, faixa de preço, modelo, comentário)
- Tela 2: Perfil (faixa etária, sexo, comentário)
- Tela 3: Avaliação (estrelas 1–5, contato se nota ≤ 2, comentário)
- Tela 4: Vendedor (chips carregados do Firebase, painel do gerente, comentário)
- Tela 5: Agradecimento

**Painel do gerente:**
- Senha padrão: `1234`
- Para trocar o nome de um vendedor: Tela 4 → botão "Painel do gerente" → senha → editar → Salvar
- O nome salvo vai para o Firebase e fica visível em todos os dispositivos

---

## ETAPA 4 — Google Sheets + Apps Script ✅ CONCLUÍDA

**Arquivos no Apps Script da planilha "Respostas WT Teresina Shopping":**

| Arquivo | Função |
|---|---|
| `appsscript.json` | Escopos OAuth (datastore, spreadsheets, gmail, scriptapp) |
| `SincronizarFirebase.gs` | Sincroniza Firebase → Sheets a cada 30min |
| `PainelAdmin.gs` | Menu "WT Admin" para apagar respostas |

**Como funciona a sincronização:**
- Roda automaticamente a cada 30 minutos
- Apaga respostas vazias do Firebase
- Adiciona apenas registros novos na planilha (não duplica)
- Envia relatório diário às 22h com total e média por vendedor

**Como forçar sincronização agora (sem esperar 30min):**
1. Abra a planilha → **WT Admin → Sincronizar agora**
2. Ou acesse Apps Script → selecione `sincronizar` → Executar

**Menu WT Admin na planilha:**
- `Apagar linhas selecionadas` — apaga da planilha e do Firebase ao mesmo tempo
- `Apagar por data (testes)` — abre painel lateral, escolha a data, apaga tudo daquele dia
- `Sincronizar agora` — força sincronização imediata sem esperar 30min

**Colunas da aba "Respostas":**

| Coluna | Dado |
|---|---|
| A | Data/Hora |
| B | Marcas |
| C | Modelos |
| D | Faixa de Preço |
| E | Faixa Etária |
| F | Sexo |
| G | Nota (1–5) |
| H | Contato |
| I | Vendedor |
| J | Comentário Produto |
| K | Comentário Perfil |
| L | Comentário Avaliação |
| M | Comentário Vendedor |
| N | Firebase ID |

---

## ETAPA 5 — Alerta em tempo real ✅ CONCLUÍDA

**Como funciona:**
- Quando o cliente envia nota ≤ 2, o formulário dispara um e-mail imediatamente via EmailJS
- O alerta chega em segundos para `ruanvn1@gmail.com`, independente da sincronização do Sheets

**Credenciais EmailJS:**
```
Public Key:  KPUxsYlwoKvFS4zwX
Service ID:  service_jr39shd
Template ID: template_8jwqvwn
```

**Campos do e-mail de alerta:**
- Nota, Vendedor, Contato, Marca, Comentário, Data/Hora

---

## ETAPA 6 — Dashboard ✅ CONCLUÍDA

**Acesso:** `https://wt-satisfacao-pdv.vercel.app/dashboard.html`

O dashboard lê os dados direto do Firebase em tempo real e exibe gráficos e indicadores de desempenho da loja, substituindo o Looker Studio.

---

## MANUTENÇÃO DO DIA A DIA

| Tarefa | Como fazer |
|---|---|
| Trocar nome de vendedor | Formulário → Tela 4 → Painel do gerente → senha 1234 |
| Atualizar o site | `python push.py "descrição"` no VSCode |
| Forçar sync da planilha | Planilha → WT Admin → Sincronizar agora |
| Apagar resposta específica | Planilha → selecionar linha → WT Admin → Apagar linhas selecionadas |
| Apagar dia de testes | Planilha → WT Admin → Apagar por data (testes) |
| Inserir dados de teste | `python inserir_testes.py` no VSCode |
| Ver respostas brutas | console.firebase.google.com → Firestore → respostas |
| Ver dashboard | wt-satisfacao-pdv.vercel.app/dashboard.html |
| Relatório diário | Chega por e-mail todo dia às 22h automaticamente |
| Alerta nota baixa | Chega por e-mail em segundos via EmailJS |
| Verificar acionadores | Apps Script → ícone de relógio ⏰ |

---

## ARQUIVOS DO PROJETO

| Arquivo | O que faz |
|---|---|
| `index.html` | Formulário completo (5 telas + Firebase + EmailJS integrados) |
| `dashboard.html` | Dashboard de indicadores com gráficos em tempo real |
| `push.py` | Envia alterações para o GitHub (atualiza o site) |
| `setup_github.py` | Configuração inicial do repositório (já usado) |
| `inserir_testes.py` | Insere 40 respostas de teste no Firebase |
| `vercel.json` | Configuração de deploy no Vercel |
| `.gitignore` | Arquivos ignorados pelo Git |
| `SincronizarFirebase.gs` | No Apps Script — sincronização Firebase → Sheets |
| `PainelAdmin.gs` | No Apps Script — menu WT Admin na planilha |

---

*WT Satisfação PDV v5.0 — World Tennis Teresina Shopping*
*Última atualização: Junho 2026*
