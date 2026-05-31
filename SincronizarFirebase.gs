// ============================================================
//  WORLD TENNIS — TERESINA SHOPPING
//  SincronizarFirebase.gs — Versão 5.0 | Maio 2026
//
//  COMO USAR:
//  1. Abra a planilha "Respostas WT Teresina Shopping"
//  2. Extensões → Apps Script → cole este código
//  3. Clique em "Serviços" (+) no painel esquerdo e adicione:
//     "Cloud Firestore API" (não precisa de outra configuração)
//  4. Execute limparVaziosEReordenar() UMA VEZ para limpar o Firebase
//  5. Execute configurarSincronizacao() UMA VEZ para ativar os gatilhos
//
//  ⚠️  POR QUE MUDOU:
//  As regras do Firestore bloqueiam leitura pública (allow read: if false).
//  O Apps Script agora usa o token OAuth da sua conta Google, que tem
//  acesso admin ao projeto — contornando as regras de segurança do cliente.
// ============================================================

var PROJECT_ID   = "wt-satisfacao-pdv";
var ABA_DADOS    = "Respostas";
var ABA_CURSOR   = "_Sync";
var EMAIL_ALERTA = ["ruanvn1@gmail.com"];

var COLUNAS = [
  "Data/Hora","Marcas","Modelos","Faixa de Preço",
  "Faixa Etária","Sexo","Nota (1-5)","Contato",
  "Vendedor","Comentário Produto","Comentário Perfil",
  "Comentário Avaliação","Comentário Vendedor","Firebase ID"
];

// ── HEADERS DE AUTENTICAÇÃO (OAuth — acesso admin) ────────
function _headers() {
  return {
    "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
    "Content-Type": "application/json"
  };
}

// ── CONFIGURAR GATILHOS (execute UMA vez) ─────────────────
function configurarSincronizacao() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("sincronizar").timeBased().everyMinutes(30).create();
  ScriptApp.newTrigger("relatorioDiario").timeBased().everyDays(1).atHour(22).create();
  Logger.log("✅ Gatilhos configurados!");
  limparVaziosEReordenar();
}

// ── BUSCAR TODOS OS DOCUMENTOS COM PAGINAÇÃO ──────────────
function buscarTodosDocumentos() {
  var todos = [];
  var pageToken = "";
  var tentativas = 0;

  do {
    var url = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID +
      "/databases/(default)/documents/respostas?pageSize=300";
    if (pageToken) url += "&pageToken=" + encodeURIComponent(pageToken);

    var resp = UrlFetchApp.fetch(url, {
      method: "get",
      headers: _headers(),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    if (code !== 200) {
      Logger.log("❌ Erro HTTP " + code + ": " + resp.getContentText().substring(0, 300));
      break;
    }

    var json = JSON.parse(resp.getContentText());
    if (json.documents) {
      todos = todos.concat(json.documents);
    }
    pageToken = json.nextPageToken || "";
    tentativas++;
  } while (pageToken && tentativas < 20);

  Logger.log("Total documentos encontrados: " + todos.length);
  return todos;
}

// ── VERIFICAR SE DOCUMENTO É VAZIO ────────────────────────
function estaVazio(doc) {
  var f = doc.fields || {};
  var getStr = function(k) { return f[k] ? (f[k].stringValue || f[k].integerValue || "") : ""; };
  var nota = f.nota ? (f.nota.integerValue || f.nota.doubleValue || f.nota.stringValue || "") : "";

  return !nota &&
    !getStr("faixa_etaria") &&
    !getStr("sexo") &&
    !getStr("vendedor") &&
    !getStr("marcas") &&
    !getStr("cm1") && !getStr("cm2") && !getStr("cm3") && !getStr("cm4") &&
    !getStr("contato") &&
    (!f.produtos || !f.produtos.arrayValue || !f.produtos.arrayValue.values || f.produtos.arrayValue.values.length === 0);
}

// ── APAGAR DOCUMENTO DO FIRESTORE ─────────────────────────
function apagarDocumento(docId) {
  var url = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID +
    "/databases/(default)/documents/respostas/" + docId;
  UrlFetchApp.fetch(url, {
    method: "delete",
    headers: _headers(),
    muteHttpExceptions: true
  });
  Logger.log("🗑️  Apagado: " + docId);
}

// ── LIMPAR VAZIOS E SINCRONIZAR TUDO DO ZERO ──────────────
function limparVaziosEReordenar() {
  Logger.log("🔄 Iniciando limpeza e sincronização completa...");
  var docs = buscarTodosDocumentos();
  Logger.log("Total encontrado: " + docs.length);

  // 1. Separar vazios dos válidos
  var apagados = 0;
  var validos = [];
  docs.forEach(function(doc) {
    if (estaVazio(doc)) {
      var docId = doc.name.split("/").pop();
      apagarDocumento(docId);
      apagados++;
    } else {
      validos.push(doc);
    }
  });
  Logger.log("Apagados do Firebase: " + apagados + " | Válidos: " + validos.length);

  // 2. Ordenar por timestamp
  validos.sort(function(a, b) {
    var ta = a.fields && a.fields.timestamp ? new Date(a.fields.timestamp.stringValue) : new Date(0);
    var tb = b.fields && b.fields.timestamp ? new Date(b.fields.timestamp.stringValue) : new Date(0);
    return ta - tb;
  });

  // 3. Recriar aba limpa
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_DADOS);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(ABA_DADOS);
  sheet.appendRow(COLUNAS);
  var hdr = sheet.getRange(1, 1, 1, COLUNAS.length);
  hdr.setFontWeight("bold").setBackground("#1a2848").setFontColor("#e8c84a");
  sheet.setFrozenRows(1);

  // 4. Inserir todos os válidos
  validos.forEach(function(doc) {
    var linha = extrairLinha(doc);
    sheet.appendRow(linha);
    var lr = sheet.getLastRow();
    sheet.getRange(lr, 1, 1, COLUNAS.length)
         .setBackground(lr % 2 === 0 ? "#f0f2f8" : "#ffffff");
  });

  // 5. Atualizar cursor
  var cursorSheet = ss.getSheetByName(ABA_CURSOR);
  if (!cursorSheet) {
    cursorSheet = ss.insertSheet(ABA_CURSOR);
    cursorSheet.appendRow(["ultimo_cursor", ""]);
    cursorSheet.hideSheet();
  }
  cursorSheet.getRange(1, 2).setValue(new Date().toISOString());

  Logger.log("✅ Concluído! " + validos.length + " respostas válidas na planilha.");
}

// ── EXTRAIR LINHA DE UM DOCUMENTO ─────────────────────────
function extrairLinha(doc) {
  var f = doc.fields || {};
  var docId = doc.name.split("/").pop();
  var getStr = function(k) {
    if (!f[k]) return "";
    return f[k].stringValue || String(f[k].integerValue || f[k].doubleValue || "");
  };
  var getNum = function(k) {
    if (!f[k]) return "";
    return f[k].integerValue || f[k].doubleValue || "";
  };

  var ts = "";
  try {
    ts = new Date(f.timestamp.stringValue);
    // Converter para horário de Brasília
    var offset = -3 * 60;
    var local = new Date(ts.getTime() + (offset - ts.getTimezoneOffset()) * 60000);
    ts = Utilities.formatDate(local, "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
  } catch(e) {}

  var marcas = getStr("marcas");
  var modelos = getStr("modelos");

  // Extrair do array de produtos se marcas estiver vazio
  if (!marcas && f.produtos && f.produtos.arrayValue && f.produtos.arrayValue.values) {
    var prods = f.produtos.arrayValue.values;
    var ms = [], ml = [];
    prods.forEach(function(p) {
      var fields = p.mapValue ? p.mapValue.fields : {};
      if (fields.marca && fields.marca.stringValue) ms.push(fields.marca.stringValue);
      if (fields.modelo && fields.modelo.stringValue) ml.push(fields.modelo.stringValue);
    });
    marcas = ms.filter(Boolean).join(", ");
    modelos = ml.filter(Boolean).join(", ");
  }

  return [
    ts,
    marcas,
    modelos,
    getStr("faixa_preco"),
    getStr("faixa_etaria"),
    getStr("sexo"),
    getNum("nota") || getStr("nota"),
    getStr("contato"),
    getStr("vendedor"),
    getStr("cm1"),
    getStr("cm2"),
    getStr("cm3"),
    getStr("cm4"),
    docId
  ];
}

// ── SINCRONIZAR INCREMENTALMENTE (a cada 30min) ───────────
function sincronizar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_DADOS);
  var cursorSheet = ss.getSheetByName(ABA_CURSOR);

  if (!sheet) { limparVaziosEReordenar(); return; }
  if (!cursorSheet) {
    cursorSheet = ss.insertSheet(ABA_CURSOR);
    cursorSheet.appendRow(["ultimo_cursor", ""]);
    cursorSheet.hideSheet();
  }

  // IDs já na planilha
  var existentes = {};
  var ultLinha = sheet.getLastRow();
  if (ultLinha > 1) {
    sheet.getRange(2, 14, ultLinha - 1, 1).getValues().forEach(function(row) {
      if (row[0]) existentes[row[0]] = true;
    });
  }

  var docs = buscarTodosDocumentos();
  var novos = 0;
  var apagados = 0;

  // Filtrar e apagar vazios
  var validos = [];
  docs.forEach(function(doc) {
    if (estaVazio(doc)) {
      apagarDocumento(doc.name.split("/").pop());
      apagados++;
    } else {
      validos.push(doc);
    }
  });

  // Ordenar por data
  validos.sort(function(a, b) {
    var ta = a.fields && a.fields.timestamp ? new Date(a.fields.timestamp.stringValue) : new Date(0);
    var tb = b.fields && b.fields.timestamp ? new Date(b.fields.timestamp.stringValue) : new Date(0);
    return ta - tb;
  });

  validos.forEach(function(doc) {
    var docId = doc.name.split("/").pop();
    if (existentes[docId]) return;

    var linha = extrairLinha(doc);
    sheet.appendRow(linha);
    var lr = sheet.getLastRow();
    sheet.getRange(lr, 1, 1, COLUNAS.length)
         .setBackground(lr % 2 === 0 ? "#f0f2f8" : "#ffffff");

    var nota = parseInt(linha[6]);
    if (!isNaN(nota) && nota <= 2) _alertaNotaBaixa(linha, nota);

    novos++;
    existentes[docId] = true;
  });

  cursorSheet.getRange(1, 2).setValue(new Date().toISOString());
  Logger.log("✅ Sync: " + novos + " novos | " + apagados + " vazios apagados.");
}

// ── ALERTA NOTA BAIXA ─────────────────────────────────────
function _alertaNotaBaixa(linha, nota) {
  var rot = ["","😞 Ruim","😐 Regular","🙂 Bom","😊 Muito bom","🤩 Excelente"];
  var assunto = "⚠️ Avaliação " + nota + "★ — World Tennis Teresina Shopping";
  var corpo = '<div style="font-family:Arial,sans-serif;max-width:560px">' +
    '<div style="background:#1a2848;padding:18px 20px;border-radius:8px 8px 0 0">' +
    '<h2 style="color:#e8c84a;margin:0">⚠️ Avaliação Baixa Recebida</h2></div>' +
    '<div style="background:#fff8f8;padding:18px 20px;border:1px solid #f5c2c2;border-radius:0 0 8px 8px">' +
    '<p><b>Nota:</b> ' + nota + '★ — ' + (rot[nota]||"") + '</p>' +
    '<p><b>Vendedor:</b> ' + (linha[8]||"Não informado") + '</p>' +
    '<p><b>Produto:</b> ' + (linha[1]||"Não informado") + '</p>' +
    '<p><b>Contato:</b> ' + (linha[7]||"Não informado") + '</p>' +
    '<p><b>Comentário:</b> ' + (linha[11]||"—") + '</p></div></div>';
  EMAIL_ALERTA.forEach(function(e) {
    MailApp.sendEmail({ to: e, subject: assunto, htmlBody: corpo });
  });
}

// ── RELATÓRIO DIÁRIO ──────────────────────────────────────
function relatorioDiario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_DADOS);
  if (!sheet || sheet.getLastRow() <= 1) return;

  var dados = sheet.getDataRange().getValues();
  var hoje = new Date();
  var inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  var total=0, soma=0, cnt=0;
  var vends={}, marcas={};

  for (var i=1; i<dados.length; i++) {
    var dt = new Date(dados[i][0]);
    if (dt < inicio) continue;
    total++;
    var nota = parseInt(dados[i][6]);
    var vend = dados[i][8] || "Não informado";
    var mcs = (dados[i][1]||"").split(",");
    if (!isNaN(nota) && nota>0) { soma+=nota; cnt++; }
    if (!vends[vend]) vends[vend]={soma:0,cnt:0};
    if (!isNaN(nota)&&nota>0) { vends[vend].soma+=nota; vends[vend].cnt++; }
    mcs.forEach(function(m) { m=m.trim(); if(m) marcas[m]=(marcas[m]||0)+1; });
  }

  if (!total) return;
  var media = cnt>0 ? (soma/cnt).toFixed(1) : "—";
  var ds = hoje.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});
  var assunto = "📊 Relatório " + ds + " — " + total + " avaliações · " + media + "⭐";

  var linhasV = Object.keys(vends).map(function(v) {
    var s=vends[v].soma, c=vends[v].cnt;
    return "<tr><td style='padding:7px 10px'>" + v + "</td><td style='text-align:center'>" +
           vends[v].cnt + "</td><td style='text-align:center'>" +
           (c>0?(s/c).toFixed(1)+" ⭐":"—") + "</td></tr>";
  }).join("");

  var corpo = '<div style="font-family:Arial,sans-serif;max-width:600px">' +
    '<div style="background:#1a2848;padding:20px;border-radius:10px 10px 0 0">' +
    '<h1 style="color:#e8c84a;margin:0">World Tennis</h1>' +
    '<p style="color:#fff;margin:2px 0">Teresina Shopping — ' + ds + '</p></div>' +
    '<div style="background:#f0f2f8;padding:20px">' +
    '<p><b>Total:</b> ' + total + ' avaliações | <b>Média:</b> ' + media + ' ⭐</p>' +
    '<table style="width:100%;border-collapse:collapse;background:#fff">' +
    '<tr style="background:#1a2848;color:#e8c84a"><th style="padding:8px">Vendedor</th>' +
    '<th>Atend.</th><th>Média</th></tr>' + linhasV + '</table></div></div>';

  EMAIL_ALERTA.forEach(function(e) {
    MailApp.sendEmail({to:e, subject:assunto, htmlBody:corpo});
  });
  Logger.log("✅ Relatório enviado. Total: " + total);
}
