// ============================================================
//  WORLD TENNIS — Teresina Shopping
//  Script 2: Automações — Email diário + IA de marcas + Alertas
//  ► Cole na MESMA planilha de respostas, em Extensões > Apps Script
//  ► Após colar, execute configurarGatilhos() UMA VEZ para ativar tudo
// ============================================================

// ──────────────────────────────────────────────────────────────
//  CONFIGURAÇÕES — edite aqui
// ──────────────────────────────────────────────────────────────
var CONFIG = {
  emailsRelatorio:  ["ruanvn1@gmail.com"],   // recebe resumo diário
  emailsAlerta:     ["ruanvn1@gmail.com"],   // recebe alerta de nota baixa
  horarioRelatorio: 22,                       // hora do envio diário (22 = 22h)
  notaBaixaLimite:  2,                        // alerta para notas <= esse valor
  geminiApiKey:     "COLE_SUA_CHAVE_AQUI",   // chave Gemini (gratuita em aistudio.google.com)
  nomeColunaProduto:   "Qual produto você comprou?",
  nomeColunaVendedor:  "Quem te atendeu?",
  nomeColunaAvaliacao: "Como você avalia o atendimento realizado pelo nosso atendente?",
};

// ──────────────────────────────────────────────────────────────
//  1. CONFIGURAR GATILHOS AUTOMÁTICOS (execute UMA vez)
// ──────────────────────────────────────────────────────────────
function configurarGatilhos() {
  // Remove gatilhos antigos para evitar duplicatas
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });

  // Gatilho 1: Às 22h dispara o agendador que espera 30min → envia às 22h30
  ScriptApp.newTrigger("_agendarRelatorio")
    .timeBased()
    .everyDays(1)
    .atHour(22)
    .create();

  // Gatilho 2: Normalizar marcas uma vez por dia (às 21h)
  ScriptApp.newTrigger("normalizarMarcas")
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create();

  // Gatilho 3: Alerta imediato em nova resposta
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger("alertaNotaBaixa")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log("✅ Gatilhos configurados! Relatório diário será enviado às 22h30.");
}

// ──────────────────────────────────────────────────────────────
//  2. AGENDADOR DE 22h30 — dispara às 22h e cria gatilho +30min
// ──────────────────────────────────────────────────────────────
function _agendarRelatorio() {
  // Remove qualquer gatilho avulso anterior para não acumular
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "_dispararRelatorio") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Cria um gatilho único que dispara em exatamente 30 minutos
  ScriptApp.newTrigger("_dispararRelatorio")
    .timeBased()
    .after(30 * 60 * 1000) // 30 minutos em milissegundos
    .create();

  Logger.log("⏱️ Relatório agendado para daqui 30 minutos (22h30).");
}

// Wrapper chamado pelo gatilho de 30min — envia o relatório e se auto-destrói
function _dispararRelatorio() {
  enviarReliatorioDiario();

  // Remove o próprio gatilho após executar (é um gatilho de uso único)
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "_dispararRelatorio") {
      ScriptApp.deleteTrigger(t);
    }
  });
}

// ──────────────────────────────────────────────────────────────
//  3. ALERTA IMEDIATO — Nota baixa (1 ou 2 estrelas)
// ──────────────────────────────────────────────────────────────
function alertaNotaBaixa(e) {
  try {
    var respostas = e.namedValues;
    var notaArr   = respostas[CONFIG.nomeColunaAvaliacao];
    if (!notaArr || notaArr[0] === "") return;

    var nota     = parseInt(notaArr[0]);
    var vendedor = (respostas[CONFIG.nomeColunaVendedor] || ["Não informado"])[0];
    var produto  = (respostas[CONFIG.nomeColunaProduto]  || ["Não informado"])[0];

    if (nota <= CONFIG.notaBaixaLimite) {
      var assunto = "⚠️ Avaliação BAIXA recebida — World Tennis Teresina Shopping";
      var corpo   = [
        "<h2 style='color:#c0392b'>⚠️ Alerta: Avaliação " + nota + " estrela(s)</h2>",
        "<p><b>Vendedor:</b> "  + vendedor + "</p>",
        "<p><b>Produto:</b> "   + produto  + "</p>",
        "<p><b>Nota:</b> "      + nota + "/5</p>",
        "<p><b>Data/hora:</b> " + new Date().toLocaleString("pt-BR") + "</p>",
        "<hr>",
        "<p style='color:#888;font-size:12px'>World Tennis Teresina Shopping — Sistema de Satisfação</p>"
      ].join("\n");

      CONFIG.emailsAlerta.forEach(function(email) {
        MailApp.sendEmail({ to: email, subject: assunto, htmlBody: corpo });
      });
    }
  } catch(err) {
    Logger.log("Erro no alerta: " + err.message);
  }
}

// ──────────────────────────────────────────────────────────────
//  4. RELATÓRIO DIÁRIO
// ──────────────────────────────────────────────────────────────
function enviarReliatorioDiario() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Respostas do formulário 1") ||
              ss.getSheets()[0];

  var dados  = sheet.getDataRange().getValues();
  var cabec  = dados[0];
  var hoje   = new Date();
  var inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  var idxData      = 0;
  var idxAvaliacao = _indiceColuna(cabec, CONFIG.nomeColunaAvaliacao);
  var idxVendedor  = _indiceColuna(cabec, CONFIG.nomeColunaVendedor);

  var totalHoje  = 0;
  var somaNotas  = 0;
  var contNotas  = 0;
  var placarVendedor = {};

  for (var i = 1; i < dados.length; i++) {
    var dataResp = new Date(dados[i][idxData]);
    if (dataResp < inicioHoje) continue;

    totalHoje++;

    var nota = parseInt(dados[i][idxAvaliacao]);
    if (!isNaN(nota)) { somaNotas += nota; contNotas++; }

    var vendedor = dados[i][idxVendedor] || "Não informado";
    if (!placarVendedor[vendedor]) placarVendedor[vendedor] = { notas: 0, count: 0 };
    if (!isNaN(nota)) { placarVendedor[vendedor].notas += nota; placarVendedor[vendedor].count++; }
  }

  var mediaGeral = contNotas > 0 ? (somaNotas / contNotas).toFixed(2) : "—";

  var destaque    = "—";
  var melhorMedia = 0;
  Object.keys(placarVendedor).forEach(function(v) {
    var pv = placarVendedor[v];
    if (pv.count > 0) {
      var m = pv.notas / pv.count;
      if (m > melhorMedia) { melhorMedia = m; destaque = v + " (" + m.toFixed(1) + " ⭐)"; }
    }
  });

  var linhasVend = Object.keys(placarVendedor).map(function(v) {
    var pv = placarVendedor[v];
    var media = pv.count > 0 ? (pv.notas / pv.count).toFixed(1) : "—";
    return "<tr><td style='padding:8px'>" + v + "</td><td style='padding:8px;text-align:center'>" + pv.count + "</td><td style='padding:8px;text-align:center'>" + media + " ⭐</td></tr>";
  }).join("\n");

  var dataFormatada = hoje.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" });

  var corpo = [
    "<div style='font-family:Arial,sans-serif;max-width:600px'>",
    "<div style='background:#2d3d6b;padding:20px;border-radius:8px 8px 0 0'>",
    "  <h1 style='color:#e8c84a;margin:0'>World Tennis</h1>",
    "  <p style='color:#fff;margin:4px 0'>Teresina Shopping — Relatório Diário</p>",
    "  <p style='color:#aaa;margin:0;font-size:13px'>" + dataFormatada + " · enviado às 22h30</p>",
    "</div>",
    "<div style='background:#f5f6fa;padding:20px;border-radius:0 0 8px 8px'>",
    "  <h2 style='color:#2d3d6b'>📊 Resumo do dia</h2>",
    "  <table style='width:100%;border-collapse:collapse'>",
    "    <tr><td style='padding:8px;background:#fff;border-radius:4px'><b>Total de avaliações</b></td><td><b style='font-size:24px;color:#2d3d6b'>" + totalHoje + "</b></td></tr>",
    "    <tr><td style='padding:8px'><b>Média geral</b></td><td><b style='font-size:24px;color:#e8c84a'>" + mediaGeral + " ⭐</b></td></tr>",
    "    <tr><td style='padding:8px;background:#fff;border-radius:4px'><b>🏆 Destaque do dia</b></td><td>" + destaque + "</td></tr>",
    "  </table>",
    "  <h3 style='color:#2d3d6b;margin-top:20px'>Resultado por vendedor</h3>",
    "  <table style='width:100%;border-collapse:collapse;background:#fff;border-radius:4px'>",
    "    <tr style='background:#2d3d6b;color:#fff'><th style='padding:8px;text-align:left'>Vendedor</th><th style='padding:8px'>Avaliações</th><th style='padding:8px'>Média</th></tr>",
    linhasVend,
    "  </table>",
    "  <p style='color:#888;font-size:11px;margin-top:20px'>Gerado automaticamente — World Tennis Teresina Shopping</p>",
    "</div></div>"
  ].join("\n");

  var assunto = "📊 Relatório 22h30 — World Tennis Teresina (" + totalHoje + " avaliações)";
  CONFIG.emailsRelatorio.forEach(function(email) {
    MailApp.sendEmail({ to: email, subject: assunto, htmlBody: corpo });
  });

  Logger.log("✅ Relatório enviado às 22h30. Total hoje: " + totalHoje);
}

// ──────────────────────────────────────────────────────────────
//  5. NORMALIZAÇÃO DE MARCAS COM IA (Gemini)
// ──────────────────────────────────────────────────────────────
function normalizarMarcas() {
  if (CONFIG.geminiApiKey === "COLE_SUA_CHAVE_AQUI") {
    Logger.log("⚠️ Chave Gemini não configurada. Veja instruções no guia.");
    return;
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Respostas do formulário 1") || ss.getSheets()[0];
  var dados = sheet.getDataRange().getValues();
  var cabec = dados[0];

  var idxProduto = _indiceColuna(cabec, CONFIG.nomeColunaProduto);
  if (idxProduto === -1) { Logger.log("Coluna de produto não encontrada."); return; }

  var idxNormal = cabec.indexOf("Marca Normalizada");
  if (idxNormal === -1) {
    sheet.getRange(1, cabec.length + 1).setValue("Marca Normalizada");
    idxNormal = cabec.length;
  }

  var atualizados = 0;
  for (var i = 1; i < dados.length; i++) {
    var produtoBruto = dados[i][idxProduto];
    var jaCorrigido  = dados[i][idxNormal];
    if (!produtoBruto || jaCorrigido) continue;

    var produtoNorm = _chamarGemini(produtoBruto);
    if (produtoNorm) {
      sheet.getRange(i + 1, idxNormal + 1).setValue(produtoNorm);
      atualizados++;
      Utilities.sleep(500);
    }
  }
  Logger.log("✅ Marcas normalizadas: " + atualizados + " registros atualizados.");
}

function _chamarGemini(textoBruto) {
  try {
    var url     = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + CONFIG.geminiApiKey;
    var payload = {
      contents: [{
        parts: [{
          text: "Corrija o nome da marca e modelo de calçado a seguir para o nome comercial oficial, em português. Responda APENAS com o nome corrigido, sem explicações, sem pontuação extra. Se não reconhecer, retorne o texto original.\n\nTexto: " + textoBruto
        }]
      }]
    };
    var options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true };
    var resp    = UrlFetchApp.fetch(url, options);
    var json    = JSON.parse(resp.getContentText());
    return json.candidates[0].content.parts[0].text.trim();
  } catch(err) {
    Logger.log("Erro Gemini: " + err.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
//  6. GERENCIAMENTO DE VENDEDORES
// ──────────────────────────────────────────────────────────────
function trocarNomeVendedor(numero, nomeNovo) {
  var ss             = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet    = ss.getSheetByName("Config Vendedores");
  var historicoSheet = ss.getSheetByName("Histórico de Vendedores");

  if (!configSheet || !historicoSheet) {
    Logger.log("⚠️ Abas de configuração não encontradas. Execute criarFormulario() primeiro.");
    return;
  }

  var dados = configSheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] == numero) {
      var nomeAntigo = dados[i][1];
      historicoSheet.appendRow([new Date(), numero, nomeAntigo, nomeNovo]);
      configSheet.getRange(i + 1, 2).setValue(nomeNovo);
      configSheet.getRange(i + 1, 3).setValue(new Date());
      _atualizarVendedorNoForms(numero, nomeNovo);
      Logger.log("✅ Vendedor " + numero + ": " + nomeAntigo + " → " + nomeNovo);
      return;
    }
  }
  Logger.log("⚠️ Número " + numero + " não encontrado.");
}

function _atualizarVendedorNoForms(numero, nomeNovo) {
  try {
    var ss        = SpreadsheetApp.getActiveSpreadsheet();
    var metaSheet = ss.getSheetByName("_Meta");
    if (!metaSheet) return;
    var formId = metaSheet.getRange(1, 2).getValue();
    var form   = FormApp.openById(formId);
    var items  = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
    items.forEach(function(item) {
      if (item.getTitle() === "Quem te atendeu?") {
        var mcItem  = item.asMultipleChoiceItem();
        var choices = mcItem.getChoices();
        var novas   = choices.map(function(c) {
          var match = c.getValue().match(/— Vendedor (\d+)$/);
          if (match && parseInt(match[1]) === numero) {
            return mcItem.createChoice(nomeNovo + " — Vendedor " + numero);
          }
          return c;
        });
        mcItem.setChoices(novas);
      }
    });
  } catch(err) {
    Logger.log("Aviso: atualize manualmente o Vendedor " + numero + " no formulário. Erro: " + err.message);
  }
}

// ──────────────────────────────────────────────────────────────
//  UTILITÁRIO
// ──────────────────────────────────────────────────────────────
function _indiceColuna(cabecalho, nomeColuna) {
  for (var i = 0; i < cabecalho.length; i++) {
    if (cabecalho[i].toString().indexOf(nomeColuna.substring(0, 20)) !== -1) return i;
  }
  return -1;
}
