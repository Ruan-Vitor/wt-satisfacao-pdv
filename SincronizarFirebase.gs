// ============================================================
//  WORLD TENNIS — TERESINA SHOPPING
//  SincronizarFirebase.gs — Sincroniza Firebase → Google Sheets
//  Versão: 3.0 | Maio 2026
//
//  ESCOPO:
//  ─────────────────────────────────────────────────────────
//  1. sincronizar()          → copia novas respostas do
//                              Firestore para o Sheets
//  2. configurarSincronizacao() → ativa gatilho a cada 30min
//  3. relatorioDiario()      → envia email às 22h
//
//  COMO USAR:
//  1. Abra a planilha "Respostas WT Teresina Shopping"
//  2. Extensões → Apps Script → cole este código
//  3. Substitua SEU_PROJECT_ID e SUA_CHAVE_API_FIREBASE
//  4. Execute configurarSincronizacao() uma vez
// ============================================================

var PROJECT_ID   = "SEU_PROJECT_ID";
var API_KEY      = "SUA_CHAVE_API_FIREBASE";
var ABA_DADOS    = "Respostas";
var ABA_CURSOR   = "_Sync";
var EMAIL_ALERTA = ["ruanvn1@gmail.com"];

// Colunas da planilha
var COLUNAS = [
  "Data/Hora","Marcas","Modelos","Faixa de Preço",
  "Faixa Etária","Sexo","Nota (1-5)","Contato",
  "Vendedor","Comentário Produto","Comentário Perfil",
  "Comentário Avaliação","Comentário Vendedor","Firebase ID"
];

// ── CONFIGURAR GATILHOS (execute UMA vez) ─────────────────
function configurarSincronizacao() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Sincronizar a cada 30 minutos
  ScriptApp.newTrigger("sincronizar")
    .timeBased().everyMinutes(30).create();

  // Relatório diário às 22h
  ScriptApp.newTrigger("relatorioDiario")
    .timeBased().everyDays(1).atHour(22).create();

  Logger.log("✅ Gatilhos configurados! Sync: 30min | Relatório: 22h");
  sincronizar(); // roda uma vez imediatamente
}

// ── SINCRONIZAR FIREBASE → SHEETS ─────────────────────────
function sincronizar() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(ABA_DADOS);
  let cursorSheet = ss.getSheetByName(ABA_CURSOR);

  // Criar aba de dados se não existir
  if (!sheet) {
    sheet = ss.insertSheet(ABA_DADOS);
    sheet.appendRow(COLUNAS);
    const hdr = sheet.getRange(1,1,1,COLUNAS.length);
    hdr.setFontWeight("bold").setBackground("#1a2848").setFontColor("#e8c84a");
    sheet.setFrozenRows(1);
  }

  // Criar aba de cursor (guarda o último ID sincronizado)
  if (!cursorSheet) {
    cursorSheet = ss.insertSheet(ABA_CURSOR);
    cursorSheet.appendRow(["ultimo_cursor",""]);
    cursorSheet.hideSheet();
  }

  const ultimoCursor = cursorSheet.getRange(1,2).getValue() || "";

  // Buscar documentos do Firestore via REST API
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/respostas?key=${API_KEY}&pageSize=50`;

  let resp;
  try {
    resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch(e) {
    Logger.log("Erro ao acessar Firestore: " + e.message);
    return;
  }

  const json = JSON.parse(resp.getContentText());
  if (!json.documents) { Logger.log("Sem documentos novos."); return; }

  let novos = 0;
  // IDs já na planilha (coluna 14 = Firebase ID)
  const existentes = new Set();
  const ultLinha = sheet.getLastRow();
  if (ultLinha > 1) {
    const ids = sheet.getRange(2, 14, ultLinha - 1, 1).getValues().flat();
    ids.forEach(id => existentes.add(id));
  }

  json.documents.forEach(doc => {
    const docId = doc.name.split("/").pop();
    if (existentes.has(docId)) return;

    const f = doc.fields || {};
    const getStr = k => f[k]?.stringValue || f[k]?.integerValue || "";
    const getNum = k => f[k]?.integerValue || f[k]?.doubleValue || "";

    let ts = "";
    try { ts = new Date(f.timestamp?.stringValue || ""); } catch(e){}

    // Extrair marcas e modelos do array de produtos
    let marcas = getStr("marcas");
    let modelos = getStr("modelos");

    if (!marcas && f.produtos?.stringValue) {
      try {
        const prods = JSON.parse(f.produtos.stringValue);
        marcas  = prods.map(p => p.marca).filter(Boolean).join(", ");
        modelos = prods.map(p => p.modelo).filter(Boolean).join(", ");
      } catch(e){}
    }

    const linha = [
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

    sheet.appendRow(linha);

    // Formatação zebra
    const lr = sheet.getLastRow();
    sheet.getRange(lr,1,1,COLUNAS.length)
         .setBackground(lr % 2 === 0 ? "#f0f2f8" : "#ffffff");

    // Alerta nota baixa
    const nota = parseInt(linha[6]);
    if (!isNaN(nota) && nota <= 2) _alertaNotaBaixa(linha, nota);

    novos++;
    existentes.add(docId);
  });

  cursorSheet.getRange(1,2).setValue(new Date().toISOString());
  Logger.log(`✅ Sincronizados: ${novos} novos registros.`);
}

// ── ALERTA NOTA BAIXA ─────────────────────────────────────
function _alertaNotaBaixa(linha, nota) {
  const rot = ["","😞 Ruim","😐 Regular","🙂 Bom","😊 Muito bom","🤩 Excelente"];
  const assunto = `⚠️ Avaliação ${nota}★ — World Tennis Teresina Shopping`;
  const corpo = `
<div style="font-family:Arial,sans-serif;max-width:560px">
  <div style="background:#1a2848;padding:18px 20px;border-radius:8px 8px 0 0">
    <h2 style="color:#e8c84a;margin:0;font-size:19px">⚠️ Avaliação Baixa Recebida</h2>
    <p style="color:rgba(255,255,255,.6);margin:3px 0 0;font-size:12px">World Tennis Teresina Shopping</p>
  </div>
  <div style="background:#fff8f8;padding:18px 20px;border:1px solid #f5c2c2;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:7px 0;color:#666;font-size:13px;width:110px"><b>Nota</b></td>
          <td style="color:#e74c3c;font-size:20px;font-weight:bold">${nota}★ — ${rot[nota]||""}</td></tr>
      <tr><td style="padding:7px 0;color:#666;font-size:13px"><b>Vendedor</b></td>
          <td style="font-size:13px">${linha[8]||"Não informado"}</td></tr>
      <tr><td style="padding:7px 0;color:#666;font-size:13px"><b>Produto</b></td>
          <td style="font-size:13px">${linha[1]||"Não informado"}</td></tr>
      <tr><td style="padding:7px 0;color:#666;font-size:13px"><b>Contato</b></td>
          <td style="font-size:13px;color:${linha[7]?"#27ae60":"#999"}">${linha[7]||"Não informado"}</td></tr>
      <tr><td style="padding:7px 0;color:#666;font-size:13px;vertical-align:top"><b>Comentário</b></td>
          <td style="font-size:13px">${linha[11]||"—"}</td></tr>
    </table>
    <p style="color:#aaa;font-size:11px;margin-top:14px">Recebido em: ${new Date().toLocaleString("pt-BR")}</p>
  </div>
</div>`;

  EMAIL_ALERTA.forEach(e => MailApp.sendEmail({ to:e, subject:assunto, htmlBody:corpo }));
}

// ── RELATÓRIO DIÁRIO ──────────────────────────────────────
function relatorioDiario() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ABA_DADOS);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const dados     = sheet.getDataRange().getValues();
  const hoje      = new Date();
  const inicio    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  let total=0, soma=0, cnt=0;
  const vends={}, marcas={};

  for (let i=1; i<dados.length; i++) {
    const dt = new Date(dados[i][0]);
    if (dt < inicio) continue;
    total++;

    const nota = parseInt(dados[i][6]);
    const vend = dados[i][8] || "Não informado";
    const mcs  = (dados[i][1]||"").split(",");

    if (!isNaN(nota) && nota>0) { soma+=nota; cnt++; }
    if (!vends[vend]) vends[vend]={soma:0,cnt:0};
    if (!isNaN(nota)&&nota>0) { vends[vend].soma+=nota; vends[vend].cnt++; }
    mcs.forEach(m => { m=m.trim(); if(m) marcas[m]=(marcas[m]||0)+1; });
  }

  if (!total) return;
  const media = cnt>0 ? (soma/cnt).toFixed(1) : "—";

  let dest="—"; let bm=0;
  Object.keys(vends).forEach(v => {
    const {soma:s,cnt:c} = vends[v];
    if (c>0&&s/c>bm) { bm=s/c; dest=`${v} (${(s/c).toFixed(1)}⭐)`; }
  });

  const linhasV = Object.keys(vends).map(v => {
    const {soma:s,cnt:c} = vends[v];
    return `<tr><td style="padding:7px 10px">${v}</td>
                <td style="text-align:center">${vends[v].cnt}</td>
                <td style="text-align:center">${c>0?(s/c).toFixed(1)+" ⭐":"—"}</td></tr>`;
  }).join("");

  const topM = Object.keys(marcas)
    .sort((a,b)=>marcas[b]-marcas[a]).slice(0,5)
    .map(m=>`<li>${m} <b>(${marcas[m]}x)</b></li>`).join("");

  const ds = hoje.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});

  const corpo = `
<div style="font-family:Arial,sans-serif;max-width:600px">
  <div style="background:#1a2848;padding:20px 24px;border-radius:10px 10px 0 0">
    <h1 style="color:#e8c84a;margin:0;font-size:22px">World Tennis</h1>
    <p style="color:#fff;margin:2px 0;font-size:14px">Teresina Shopping — Relatório do Dia</p>
    <p style="color:rgba(255,255,255,.45);margin:0;font-size:12px">${ds}</p>
  </div>
  <div style="background:#f0f2f8;padding:20px 24px">
    <div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">
      <div style="background:#fff;border-radius:8px;padding:14px 18px;flex:1;min-width:110px">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Avaliações</div>
        <div style="font-size:30px;font-weight:bold;color:#1a2848">${total}</div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:14px 18px;flex:1;min-width:110px">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">Média</div>
        <div style="font-size:30px;font-weight:bold;color:#e8c84a">${media} ⭐</div>
      </div>
      <div style="background:#fff;border-radius:8px;padding:14px 18px;flex:1;min-width:180px">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px">🏆 Destaque</div>
        <div style="font-size:15px;font-weight:bold;color:#1a2848;margin-top:3px">${dest}</div>
      </div>
    </div>
    <h3 style="color:#1a2848;font-size:13px;margin-bottom:9px">Por vendedor</h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
      <tr style="background:#1a2848;color:#e8c84a">
        <th style="padding:8px 10px;text-align:left;font-size:12px">Vendedor</th>
        <th style="padding:8px 10px;font-size:12px">Atend.</th>
        <th style="padding:8px 10px;font-size:12px">Média</th>
      </tr>
      ${linhasV}
    </table>
    ${topM ? `<h3 style="color:#1a2848;font-size:13px;margin:16px 0 8px">Top marcas</h3><ul style="background:#fff;border-radius:8px;padding:10px 10px 10px 26px">${topM}</ul>` : ""}
    <p style="color:#bbb;font-size:10px;margin-top:18px;text-align:center">World Tennis Teresina Shopping — Relatório automático</p>
  </div>
</div>`;

  const assunto = `📊 Relatório ${ds} — ${total} avaliações · ${media}⭐`;
  EMAIL_ALERTA.forEach(e => MailApp.sendEmail({to:e, subject:assunto, htmlBody:corpo}));
  Logger.log(`✅ Relatório enviado. Total: ${total} | Média: ${media}`);
}
