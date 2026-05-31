# 🎽 WT Satisfação PDV — Guia Completo
## GitHub + Vercel + Firebase + Sheets + Looker Studio · Versão 4.0

> Este guia documenta tudo que foi feito e o que ainda falta.
> Etapas marcadas com ✅ já estão concluídas.

---

## SITUAÇÃO ATUAL DO PROJETO

| Componente | Status | Observação |
|---|---|---|
| Firebase Firestore | ✅ Ativo | Recebendo respostas |
| Formulário (Vercel) | ✅ No ar | wt-satisfacao-pdv.vercel.app |
| GitHub | ✅ Configurado | push.py funcionando |
| Sheets — sincronização | ✅ Automática a cada 30min | SincronizarFirebase.gs v5.0 |
| Sheets — menu WT Admin | ✅ Ativo | Apagar por linha ou por data |
| Alerta nota baixa (≤2) | ✅ No script | Vai junto na sincronização |
| **Alerta em tempo real** | ⏳ A fazer | Ainda tem delay de 30min |
| **Looker Studio** | ⏳ A fazer | Próxima etapa |

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
| `AtualizarFormularioWT.gs` | Script antigo para Google Forms (pode ignorar) |

**Como funciona a sincronização:**
- Roda automaticamente a cada 30 minutos
- Apaga respostas vazias do Firebase
- Adiciona apenas registros novos na planilha (não duplica)
- Envia e-mail de alerta para `ruanvn1@gmail.com` quando nota ≤ 2
- Envia relatório diário às 22h com total e média por vendedor

**Como forçar sincronização agora (sem esperar 30min):**
1. Abra a planilha → **WT Admin → Sincronizar agora**
2. Ou acesse Apps Script → selecione `sincronizar` → Executar

**Menu WT Admin na planilha:**
- `Apagar linhas selecionadas` — selecione as linhas e use este menu; apaga da planilha e do Firebase ao mesmo tempo
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

## ETAPA 5 — Alerta em tempo real ⏳ A FAZER

**Problema atual:** o alerta de nota baixa (≤ 2) só chega quando a sincronização de 30 em 30 minutos roda — pode demorar até 30 minutos após o cliente enviar.

**Solução:** enviar o e-mail de alerta direto do formulário (`index.html`) no momento do envio, sem passar pelo Sheets.

**Como implementar:**
1. Criar um endpoint gratuito no [EmailJS](https://www.emailjs.com) ou [Formspree](https://formspree.io)
2. No `index.html`, na função `enviar()`, após salvar no Firebase, verificar se `nota <= 2` e disparar o e-mail via API
3. O alerta chega em segundos, independente da sincronização do Sheets

> Isso não afeta o relatório diário — ele continua funcionando normalmente via Apps Script.

---

## ETAPA 6 — Looker Studio ⏳ A FAZER

**Pré-requisito:** a planilha "Respostas WT Teresina Shopping" com dados reais (já temos 65 respostas de teste).

**Como criar o dashboard:**

1. Acesse [lookerstudio.google.com](https://lookerstudio.google.com)
2. Clique em **"Em branco"** para criar um novo relatório
3. **Conectar fonte de dados:**
   - Clique em "Adicionar dados" → "Google Sheets"
   - Selecione a planilha "Respostas WT Teresina Shopping"
   - Selecione a aba **"Respostas"**
   - Clique em **"Adicionar"**

**Gráficos recomendados para o dashboard:**

| Gráfico | Dimensão | Métrica | Insight |
|---|---|---|---|
| Scorecard | — | COUNT(Firebase ID) | Total de respostas |
| Scorecard | — | AVG(Nota 1-5) | Média geral |
| Gráfico de barras | Vendedor | AVG(Nota 1-5) | Ranking de vendedores |
| Gráfico de pizza | Marcas | COUNT | Marcas mais vendidas |
| Gráfico de barras | Faixa Etária | COUNT | Perfil dos clientes |
| Gráfico de linha | Data/Hora (por dia) | COUNT | Volume ao longo do tempo |
| Gráfico de pizza | Sexo | COUNT | Distribuição por sexo |
| Gráfico de pizza | Faixa de Preço | COUNT | Ticket dos clientes |
| Tabela | Vendedor | COUNT, AVG(Nota) | Tabela de performance |

**Filtros recomendados:**
- Seletor de intervalo de datas (Data/Hora)
- Seletor de vendedor
- Seletor de marca

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
| Ver dashboard | Looker Studio (link a definir) |
| Relatório diário | Chega por e-mail todo dia às 22h automaticamente |
| Alerta nota baixa | Chega por e-mail na sincronização (a cada 30min — melhoria planejada) |

---

## ARQUIVOS DO PROJETO

| Arquivo | O que faz |
|---|---|
| `index.html` | Formulário completo (4 telas + Firebase integrado) |
| `push.py` | Envia alterações para o GitHub (atualiza o site) |
| `setup_github.py` | Configuração inicial do repositório (já usado) |
| `inserir_testes.py` | Insere 40 respostas de teste no Firebase |
| `vercel.json` | Configuração de deploy no Vercel |
| `.gitignore` | Arquivos ignorados pelo Git |
| `SincronizarFirebase.gs` | No Apps Script — sincronização Firebase → Sheets |
| `PainelAdmin.gs` | No Apps Script — menu WT Admin na planilha |

---

*WT Satisfação PDV v4.0 — World Tennis Teresina Shopping*
*Última atualização: Maio 2026*
