# 🎽 WT Satisfação PDV — Guia Completo de Deploy
## GitHub + Vercel + Firebase · Versão 3.0

> Leia do início ao fim antes de começar. Cada etapa depende da anterior.
> Tempo total estimado: ~1 hora na primeira vez.

---

## PRÉ-REQUISITOS — Instalar antes de tudo

### 1. Git
1. Acesse https://git-scm.com/download/win
2. Baixe e instale com todas as opções padrão (apenas clique em Next)
3. Para confirmar: abra o **Terminal do VSCode** (`Ctrl + J`) e digite:
   ```
   git --version
   ```
   Deve aparecer algo como `git version 2.44.0`

### 2. Python
1. Acesse https://python.org/downloads
2. Baixe a versão mais recente (botão amarelo grande)
3. **IMPORTANTE**: na tela de instalação, marque ✅ **"Add Python to PATH"** antes de clicar em Install
4. Para confirmar: no terminal do VSCode:
   ```
   python --version
   ```

---

## ETAPA 1 — Abrir a pasta no VSCode · 2 min

1. Abra o **VSCode**
2. Clique em **File → Open Folder**
3. Navegue até: `D:\Fanuel\Projetos Editáveis\WT Satisfação PDV`
4. Clique em **"Selecionar Pasta"**
5. Abra o terminal integrado com `Ctrl + J`

Confirme que está na pasta certa digitando `cd` — deve mostrar o caminho completo.

---

## ETAPA 2 — Criar o projeto no Firebase · 15 min

### 2.1 Criar conta e projeto
1. Acesse https://console.firebase.google.com (login com sua conta Google)
2. Clique em **"Adicionar projeto"**
3. Nome: `wt-satisfacao-pdv`
4. **Desative** o Google Analytics → clique em **"Criar projeto"**

### 2.2 Criar o banco Firestore
1. Menu lateral → **"Firestore Database"** → **"Criar banco de dados"**
2. Escolha **"Iniciar no modo de produção"** → **Próximo**
3. Localização: **southamerica-east1** (São Paulo)
4. Clique em **"Criar"**

### 2.3 Configurar regras de segurança
1. Dentro do Firestore → aba **"Regras"**
2. Apague tudo e cole:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /respostas/{doc} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /vendedores/{doc} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```
3. Clique em **"Publicar"**

> Qualquer pessoa pode ENVIAR uma resposta, mas ninguém pode ler ou
> alterar os dados pelo formulário. Você acessa tudo pelo console do Firebase.

### 2.4 Criar coleção de vendedores
1. Firestore → **"+ Iniciar coleção"**
2. ID da coleção: `vendedores` → Próximo
3. ID do documento: `loja-teresina`
4. Adicione os campos (um por um):

| Campo | Tipo | Valor inicial |
|---|---|---|
| v1 | string | João |
| v2 | string | Maria |
| v3 | string | Carlos |
| v4 | string | Ana |
| v5 | string | Pedro |
| v6 | string | Lúcia |

5. Clique em **"Salvar"**

### 2.5 Pegar as credenciais
1. Engrenagem ⚙️ → **"Configurações do projeto"**
2. Role para baixo → **"Seus aplicativos"** → clique em `</>`
3. Apelido: `wt-formulario` → **"Registrar app"**
4. **Copie e guarde** o bloco `firebaseConfig` — vai usar na Etapa 4

---

## ETAPA 3 — Criar repositório no GitHub e fazer o primeiro push · 10 min

### 3.1 Configurar Git (uma única vez)
No terminal do VSCode:
```
git config --global user.name "Ruan Vitor"
git config --global user.email "ruanvn1@gmail.com"
```

### 3.2 Criar repositório no GitHub
1. Acesse https://github.com/new
2. Repository name: `wt-satisfacao-pdv`
3. Visibility: **Public**
4. **NÃO** marque "Add a README file"
5. Clique em **"Create repository"**
6. Copie a URL do repositório: `https://github.com/Ruan-Vitor/wt-satisfacao-pdv.git`

### 3.3 Rodar o script de setup
No terminal do VSCode:
```
python setup_github.py
```
Cole a URL do repositório quando solicitado e pressione Enter.
Na primeira vez, o navegador vai abrir pedindo autenticação no GitHub — clique em **"Authorize"**.

---

## ETAPA 4 — Inserir suas credenciais no index.html · 5 min

Abra o `index.html` no VSCode e use `Ctrl+H` para substituir:

| Localizar | Substituir por |
|---|---|
| `SEU_API_KEY` | apiKey do passo 2.5 |
| `SEU_AUTH_DOMAIN` | authDomain do passo 2.5 |
| `SEU_PROJECT_ID` | projectId do passo 2.5 |
| `SEU_APP_ID` | appId do passo 2.5 |
| `SRC_LOGO_WT` | URL do Drive (veja abaixo) |
| `SRC_LOGO_FB` | URL do Drive (veja abaixo) |

**URLs das imagens do Drive:**
1. Botão direito na imagem → Compartilhar → "Qualquer pessoa com o link"
2. Pegue o ID do link (a parte entre `/d/` e `/view`)
3. Monte a URL: `https://drive.google.com/uc?export=view&id=COLE_O_ID_AQUI`

Salve com `Ctrl+S`.

---

## ETAPA 5 — Enviar alterações para o GitHub · 1 min

```
python push.py "Adiciona credenciais Firebase e imagens"
```

---

## ETAPA 6 — Publicar no Vercel · 10 min

1. Acesse https://vercel.com → **"Sign Up"** → **"Continue with GitHub"**
2. No painel → **"Add New..."** → **"Project"**
3. Encontre `wt-satisfacao-pdv` → **"Import"**
4. Framework Preset: **"Other"**
5. Clique em **"Deploy"** e aguarde ~1 minuto

Seu link estará disponível:
```
https://wt-satisfacao-pdv.vercel.app
```

**A partir de agora:** cada `python push.py "..."` atualiza o site em ~30 segundos automaticamente.

---

## ETAPA 7 — Sincronizar Firebase com Google Sheets · 10 min

1. Abra a planilha **"Respostas WT Teresina Shopping"** → **Extensões → Apps Script**
2. Apague o código e cole o conteúdo de **`SincronizarFirebase.gs`**
3. Substitua `SEU_PROJECT_ID` pelo seu projectId
4. Substitua `SUA_CHAVE_API_FIREBASE` pela `apiKey` do Firebase
5. Execute **`configurarSincronizacao`** uma vez e autorize

O script sincroniza automaticamente a cada 30 minutos. O Looker Studio continua funcionando normalmente lendo do Sheets.

---

## Manutenção do dia a dia

| Tarefa | Como fazer |
|---|---|
| Trocar nome de vendedor | Tela 4 → Painel do gerente → senha 1234 |
| Atualizar o site | `python push.py "descrição"` no VSCode |
| Ver respostas brutas | console.firebase.google.com → Firestore → respostas |
| Ver no Sheets | Planilha "Respostas WT Teresina Shopping" |
| Dashboard | Looker Studio (link configurado anteriormente) |

---

*WT Satisfação PDV v3.0 — World Tennis Teresina Shopping*
