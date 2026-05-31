// ============================================================
//  PainelAdmin.gs — Painel de administração WT
//  Versão: 2.0 | Maio 2026
//  Adiciona menu "WT Admin" na planilha com 3 opções:
//  1. Apagar linhas selecionadas (planilha + Firebase)
//  2. Apagar por data (testes)
//  3. Sincronizar agora (força sync imediata)
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("WT Admin")
    .addItem("Apagar linhas selecionadas", "apagarSelecionadas")
    .addItem("Apagar por data (testes)", "abrirPainelData")
    .addSeparator()
    .addItem("🔄 Sincronizar agora", "sincronizarAgora")
    .addToUi();
}

// ── SINCRONIZAR AGORA ──────────────────────────────────────
function sincronizarAgora() {
  var ui = SpreadsheetApp.getUi();
  try {
    sincronizar(); // chama a função do SincronizarFirebase.gs
    ui.alert("✅ Sincronização concluída!\n\nA planilha está atualizada com os dados mais recentes do Firebase.");
  } catch(e) {
    ui.alert("❌ Erro na sincronização:\n" + e.message);
  }
}

// ── APAGAR LINHAS SELECIONADAS ─────────────────────────────
function apagarSelecionadas() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostas");
  if (!sheet) { ui.alert("Aba 'Respostas' não encontrada."); return; }

  var selection = sheet.getActiveRange();
  var firstRow = selection.getRow();
  var lastRow = selection.getLastRow();

  if (firstRow <= 1) {
    ui.alert("Selecione apenas linhas de dados (não o cabeçalho).");
    return;
  }

  var qtd = lastRow - firstRow + 1;
  var confirm = ui.alert(
    "Confirmar exclusão",
    "Apagar " + qtd + " linha(s) do Firebase e da planilha?\n\nEssa ação não pode ser desfeita.",
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var ids = sheet.getRange(firstRow, 14, qtd, 1).getValues().flat();
  var apagados = 0;

  ids.forEach(function(id) {
    if (!id) return;
    var url = "https://firestore.googleapis.com/v1/projects/wt-satisfacao-pdv" +
      "/databases/(default)/documents/respostas/" + id;
    var resp = UrlFetchApp.fetch(url, {
      method: "delete",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() === 200 || resp.getResponseCode() === 404) apagados++;
  });

  // Apagar linhas de baixo para cima para não deslocar índices
  for (var r = lastRow; r >= firstRow; r--) {
    sheet.deleteRow(r);
  }

  ui.alert("✅ Concluído!\n\n" + apagados + " registro(s) apagado(s) do Firebase.\n" +
           qtd + " linha(s) removida(s) da planilha.");
}

// ── APAGAR POR DATA (para limpar testes) ──────────────────
function abrirPainelData() {
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial,sans-serif;padding:16px;font-size:14px;color:#1a2848}' +
    'h3{margin:0 0 12px;color:#1a2848}' +
    'input[type=date]{padding:8px;width:100%;margin-bottom:12px;border:1px solid #ccc;border-radius:6px;font-size:14px}' +
    'button{background:#1a2848;color:#e8c84a;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;width:100%;font-size:14px;font-weight:bold}' +
    'button:hover{background:#243562}' +
    '#msg{margin-top:12px;padding:8px;border-radius:6px;font-size:13px}' +
    '.ok{background:#e8f5e9;color:#2e7d32}.err{background:#fce4ec;color:#c62828}' +
    '</style>' +
    '<h3>Apagar respostas por data</h3>' +
    '<p style="font-size:12px;color:#666;margin-bottom:12px">Apaga todas as respostas de um dia específico do Firebase e da planilha.</p>' +
    '<input type="date" id="dt">' +
    '<button onclick="enviar()">Apagar esse dia</button>' +
    '<div id="msg"></div>' +
    '<script>' +
    'function enviar(){' +
    '  var dt=document.getElementById("dt").value;' +
    '  var msg=document.getElementById("msg");' +
    '  if(!dt){msg.className="err";msg.innerText="⚠️ Escolha uma data.";return;}' +
    '  msg.className="";msg.innerText="⏳ Apagando...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r){' +
    '      msg.className=r.startsWith("✅")?"ok":"err";' +
    '      msg.innerText=r;' +
    '    })' +
    '    .withFailureHandler(function(e){' +
    '      msg.className="err";msg.innerText="❌ Erro: "+e.message;' +
    '    })' +
    '    .apagarPorData(dt);' +
    '}' +
    '<\/script>'
  ).setTitle("Apagar por data").setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function apagarPorData(dataStr) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respostas");
  if (!sheet) return "❌ Aba 'Respostas' não encontrada.";

  var dados = sheet.getDataRange().getValues();
  var linhasParaApagar = [];

  for (var i = dados.length - 1; i >= 1; i--) {
    var dtCell = "";
    try { dtCell = new Date(dados[i][0]).toISOString().substring(0, 10); } catch(e) {}
    if (dtCell === dataStr) linhasParaApagar.push(i + 1);
  }

  if (!linhasParaApagar.length) {
    return "⚠️ Nenhuma resposta encontrada para " + dataStr + ".";
  }

  var apagados = 0;
  linhasParaApagar.forEach(function(rowNum) {
    var id = sheet.getRange(rowNum, 14).getValue();
    if (id) {
      var url = "https://firestore.googleapis.com/v1/projects/wt-satisfacao-pdv" +
        "/databases/(default)/documents/respostas/" + id;
      UrlFetchApp.fetch(url, {
        method: "delete",
        headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
        muteHttpExceptions: true
      });
      apagados++;
    }
    sheet.deleteRow(rowNum);
  });

  return "✅ " + apagados + " registro(s) apagado(s) para " + dataStr + ".";
}
