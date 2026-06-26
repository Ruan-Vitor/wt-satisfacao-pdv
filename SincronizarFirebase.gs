// =========================================================
//  SincronizarFirebase.gs — World Tennis Satisfação PDV
//  Versão: 4.0 | Multi-loja + Vendedor Nº
//  Cole no Apps Script da planilha Google Sheets.
// =========================================================

// ── CONFIGURAÇÃO ─────────────────────────────────────────
const FB_PROJECT = 'wt-satisfacao-pdv';
const FB_KEY     = 'AIzaSyDwAL3IkbGaLXVFDZELIvrz5OTztKu2NHE';
const FB_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

// ── COLUNAS DA PLANILHA ─────────────────────────────────
// Ordem esperada (adicione J e K manualmente se já tem dados):
// A: Data/Hora     B: Marcas        C: Modelos
// D: Faixa Preço   E: Faixa Etária  F: Sexo
// G: Nota (1-5)    H: Contato       I: Vendedor
// J: Vendedor Nº   K: Loja          ← NOVAS
// L: Coment. Prod  M: Coment. Perf  N: Coment. Avaliação
// O: Coment. Vend  P: Firebase ID

const CABECALHO = [
  'Data/Hora', 'Marcas', 'Modelos', 'Faixa de Preço', 'Faixa Etária',
  'Sexo', 'Nota (1-5)', 'Contato', 'Vendedor', 'Vendedor Nº', 'Loja',
  'Comentário Produto', 'Comentário Perfil', 'Comentário Avaliação',
  'Comentário Vendedor', 'Firebase ID'
];

// ── HELPERS ──────────────────────────────────────────────
function fbVal(f) {
  if (!f) return '';
  if (f.stringValue  !== undefined) return f.stringValue;
  if (f.integerValue !== undefined) return Number(f.integerValue);
  if (f.doubleValue  !== undefined) return Number(f.doubleValue);
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.timestampValue !== undefined) return f.timestampValue;
  return '';
}

function buscarTodos() {
  let docs = [], pageToken = null;
  do {
    let url = `${FB_BASE}/respostas?key=${FB_KEY}&pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      throw new Error('Firestore HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().substring(0, 200));
    }
    const json = JSON.parse(resp.getContentText());
    if (json.documents) docs = docs.concat(json.documents);
    pageToken = json.nextPageToken || null;
  } while (pageToken);
  return docs;
}

function docParaLinha(doc) {
  const f  = doc.fields || {};
  const ts = fbVal(f.timestamp) || doc.createTime || '';
  const id = doc.name.split('/').pop();

  let dataHora = ts;
  try {
    if (ts) {
      const d = new Date(ts);
      dataHora = Utilities.formatDate(d, 'America/Fortaleza', 'dd/MM/yyyy HH:mm:ss');
    }
  } catch(e) {}

  return [
    dataHora,
    fbVal(f.marcas),
    fbVal(f.modelos),
    fbVal(f.faixa_preco),
    fbVal(f.faixa_etaria),
    fbVal(f.sexo),
    Number(fbVal(f.nota)) || '',
    fbVal(f.contato),
    fbVal(f.vendedor),
    fbVal(f.vendedor_numero),      // J — novo
    fbVal(f.loja) || 'TERE',      // K — novo (legado = TERE)
    fbVal(f.cm1),
    fbVal(f.cm2),
    fbVal(f.cm3),
    fbVal(f.cm4),
    id
  ];
}

// ── SINCRONIZAÇÃO (apenas novas) ──────────────────────────
function sincronizarTudo() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName('Respostas WT') || ss.getActiveSheet();

  // Garante cabeçalho correto
  const cabAtual = aba.getRange(1, 1, 1, CABECALHO.length).getValues()[0];
  const cabOk    = CABECALHO.every((c, i) => cabAtual[i] === c);
  if (!cabOk) {
    aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
  }

  const ultimaLinha = aba.getLastRow();
  const idCol = CABECALHO.indexOf('Firebase ID') + 1;
  const idsExistentes = new Set();
  if (ultimaLinha > 1) {
    const ids = aba.getRange(2, idCol, ultimaLinha - 1, 1).getValues();
    ids.forEach(r => { if (r[0]) idsExistentes.add(String(r[0])); });
  }

  const docs  = buscarTodos();
  const novas = [];
  docs.forEach(doc => {
    if (!doc.fields) return;
    const id = doc.name.split('/').pop();
    if (!idsExistentes.has(id)) novas.push(docParaLinha(doc));
  });

  if (novas.length > 0) {
    novas.sort((a, b) => { try { return new Date(a[0]) - new Date(b[0]); } catch(e) { return 0; } });
    aba.getRange(ultimaLinha + 1, 1, novas.length, CABECALHO.length).setValues(novas);
    SpreadsheetApp.getUi().alert(`✅ ${novas.length} nova(s) resposta(s) adicionada(s)!`);
  } else {
    SpreadsheetApp.getUi().alert('✅ Nenhuma resposta nova. Planilha já atualizada.');
  }
}

// ── RECONSTRUÇÃO COMPLETA (apaga tudo e regrava) ──────────
function sincronizarTudoForce() {
  const ui   = SpreadsheetApp.getUi();
  const resp = ui.alert('⚠️ Atenção', 'Isso apagará TODAS as linhas e as reconstituirá a partir do Firebase.\n\nContinuar?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName('Respostas WT') || ss.getActiveSheet();
  aba.clearContents();
  aba.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
  aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');

  const docs   = buscarTodos();
  const linhas = docs.filter(d => d.fields).map(docParaLinha);
  linhas.sort((a, b) => { try { return new Date(a[0]) - new Date(b[0]); } catch(e) { return 0; } });

  if (linhas.length > 0) aba.getRange(2, 1, linhas.length, CABECALHO.length).setValues(linhas);
  ui.alert(`✅ ${linhas.length} registro(s) sincronizado(s)!`);
}

// ── MENU ─────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎾 WT Admin')
    .addItem('↺ Sincronizar (apenas novos)', 'sincronizarTudo')
    .addSeparator()
    .addItem('⚠️ Reconstruir tudo do Firebase', 'sincronizarTudoForce')
    .addToUi();
}

// ── GATILHO AUTOMÁTICO (opcional) ────────────────────────
// Extensões → Apps Script → Acionadores → Adicionar
//   Função: sincronizarTudo | Tipo: baseado em tempo | Intervalo: A cada hora
