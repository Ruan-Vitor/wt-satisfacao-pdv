# 🎽 World Tennis Teresina Shopping — Guia de Implementação

## O que você tem em mãos
- **CriarFormularioWT.gs** → cria o Forms + Planilha automaticamente na sua pasta do Drive
- **ScriptsAutomacao_WT.gs** → email diário, alerta de nota baixa, IA de marcas, troca de vendedor

---

## ETAPA 1 — Criar o formulário (5 minutos)

1. Acesse [script.google.com](https://script.google.com)
2. Clique em **"Novo projeto"**
3. Apague todo o código que aparecer
4. Abra o arquivo `CriarFormularioWT.gs` e **cole o conteúdo inteiro**
5. Clique em **Salvar** (💾 ou Ctrl+S)
6. No menu de funções, selecione **`criarFormulario`**
7. Clique em **Executar (▶)**
8. Na janela de permissões → **"Revisar permissões"** → escolha sua conta Google → **"Permitir"**
9. Aguarde ~10 segundos
10. Clique em **"Logs"** (ícone de lista) — você verá os links do Forms e da Planilha

✅ Pronto! O Forms e a Planilha já estão na sua pasta do Drive.

---

## ETAPA 2 — Configurar as automações (10 minutos)

1. Abra a planilha criada no Drive
2. Clique em **Extensões → Apps Script**
3. Apague o código e **cole o conteúdo de `ScriptsAutomacao_WT.gs`**
4. Salve (Ctrl+S)
5. Selecione a função **`configurarGatilhos`** e clique em **Executar**
6. Autorize novamente (mesmos passos da Etapa 1)

✅ A partir de agora:
- Toda nova resposta com nota 1 ou 2 → email de alerta imediato para você
- Todo dia às 20h → email com resumo do dia (total, média, destaque)
- Todo dia às 21h → IA normaliza os nomes de marcas na planilha

---

## ETAPA 3 — Ativar IA de marcas (opcional, 5 minutos)

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em **"Get API key"** → **"Create API key"** (gratuito)
3. Copie a chave gerada
4. No script, substitua `"COLE_SUA_CHAVE_AQUI"` pela sua chave
5. Salve

---

## ETAPA 4 — Dashboard no Looker Studio (15 minutos)

1. Acesse [lookerstudio.google.com](https://lookerstudio.google.com)
2. **"Criar"** → **"Relatório"** → **"Google Sheets"**
3. Selecione a planilha **"Respostas WT Teresina Shopping"**
4. Adicione os gráficos:

| Gráfico | Tipo | Campo |
|---|---|---|
| Avaliações por vendedor | Barras | Vendedor × média da nota |
| Distribuição de notas | Pizza | Nota (1–5) |
| Faixa etária dos clientes | Pizza | Faixa etária |
| Total de respostas hoje | Scorecard | Contagem de linhas |
| Produtos mais citados | Tabela | Marca Normalizada |

5. Clique em **"Compartilhar"** → copie o link → acessa no celular, computador, qualquer lugar

---

## ETAPA 5 — Trocar nome de vendedor (quando precisar)

Quando um vendedor sair, faça assim:

1. Abra a planilha → **Extensões → Apps Script**
2. No console, execute:
```javascript
trocarNomeVendedor(3, "Fernanda")
// Substitua 3 pelo número e "Fernanda" pelo nome novo
```
3. O histórico é salvo automaticamente na aba **"Histórico de Vendedores"**
4. O nome muda no formulário automaticamente
5. No Looker Studio, use filtro de data para separar períodos (João antes de X / Fernanda depois)

---

## ETAPA 6 — Modo quiosque no tablet (quando comprar)

**Android (Samsung Galaxy Tab):**
1. Abra o Chrome com o link do Forms
2. Vá em **Configurações → Segurança → Fixação de tela** (ou "Bloquear tela")
3. Toque no botão quadrado (apps recentes) → toque no ícone do Chrome → **"Fixar"**
4. Para sair: segure **Voltar + Recentes** ao mesmo tempo + senha do Android

Custo: R$ 0 — nativo no Android.

---

## Links úteis depois de criado

| O quê | Onde |
|---|---|
| Formulário (para o cliente) | Nos logs do script (Etapa 1) |
| Planilha de respostas | Drive → "Respostas WT Teresina Shopping" |
| Dashboard | Looker Studio (Etapa 4) |
| Editar formulário | forms.google.com → sua pasta |

---

## Resumo de custos

| Item | Custo |
|---|---|
| Google Forms | Gratuito |
| Google Sheets | Gratuito |
| Looker Studio | Gratuito |
| Apps Script | Gratuito |
| API Gemini (IA de marcas) | Gratuito (cota generosa) |
| Modo quiosque Android | Gratuito (nativo) |
| **Total** | **R$ 0** |

---

*World Tennis Teresina Shopping — Sistema de Satisfação do Cliente*
