// ============================================================
//  WORLD TENNIS — Teresina Shopping
//  Script 3: Atualizar formulário existente
//  - Corrige exemplo do produto (remove Nike)
//  - Insere logo World Tennis e marca d'água FB no topo
//  ► Cole no Apps Script da PLANILHA e execute atualizarFormulario()
// ============================================================

var PASTA_ID = "1Jm2-e_GbjtwR3K4l0Vn6np0UqWvQGmt3";

function atualizarFormulario() {

  // ── 1. Localizar o formulário pela planilha vinculada ──────
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var meta   = ss.getSheetByName("_Meta");
  var formId = meta ? meta.getRange(1, 2).getValue() : null;

  if (!formId) {
    // Fallback: buscar na pasta pelo nome
    var pasta   = DriveApp.getFolderById(PASTA_ID);
    var arquivos = pasta.getFilesByName("Pesquisa de Satisfação — World Tennis Teresina Shopping");
    if (!arquivos.hasNext()) {
      Logger.log("❌ Formulário não encontrado na pasta. Verifique o nome.");
      return;
    }
    formId = arquivos.next().getId();
  }

  var form  = FormApp.openById(formId);
  var items = form.getItems();

  Logger.log("✅ Formulário encontrado: " + form.getTitle());

  // ── 2. Buscar imagens na pasta do Drive ───────────────────
  var pasta         = DriveApp.getFolderById(PASTA_ID);
  var blobWT        = null; // World Tennis
  var blobFB        = null; // Grupo FB (marca d'água)

  var arquivos = pasta.getFiles();
  while (arquivos.hasNext()) {
    var f    = arquivos.next();
    var nome = f.getName().toLowerCase();
    if (nome.indexOf("timbre_world") !== -1 || nome.indexOf("world-tennis") !== -1) {
      blobWT = f.getBlob();
      Logger.log("🖼️  Logo WT encontrado: " + f.getName());
    }
    if (nome.indexOf("oito") !== -1 || nome.indexOf("grupofb") !== -1 || nome === "oito.png") {
      blobFB = f.getBlob();
      Logger.log("🖼️  Logo FB encontrado: " + f.getName());
    }
  }

  // ── 3. Remover imagens antigas do formulário (se houver) ──
  var itemsAtuais = form.getItems(FormApp.ItemType.IMAGE);
  itemsAtuais.forEach(function(img) { form.deleteItem(img); });

  // ── 4. Inserir logo World Tennis no topo (posição 0) ──────
  if (blobWT) {
    var imgWT = form.addImageItem();
    imgWT.setImage(blobWT)
         .setTitle("World Tennis — Teresina Shopping")
         .setHelpText("Pesquisa de Satisfação");
    // Mover para o topo
    form.moveItem(imgWT.getIndex(), 0);
    Logger.log("✅ Logo World Tennis inserido no topo.");
  } else {
    Logger.log("⚠️  Logo WT não encontrado. Verifique se 'Timbre_World-Tennis-2021.png' está na pasta.");
  }

  // ── 5. Inserir logo FB logo abaixo do WT (posição 1) ──────
  if (blobFB) {
    var imgFB = form.addImageItem();
    imgFB.setImage(blobFB)
         .setTitle("")
         .setHelpText("Grupo FB");
    form.moveItem(imgFB.getIndex(), 1);
    Logger.log("✅ Logo FB inserido como segundo elemento.");
  } else {
    Logger.log("⚠️  Logo FB não encontrado. Verifique se 'Oito.png' está na pasta.");
  }

  // ── 6. Corrigir exemplo do produto (remover Nike) ─────────
  var itemsPergunta = form.getItems(FormApp.ItemType.TEXT);
  itemsPergunta.forEach(function(item) {
    if (item.getTitle().indexOf("produto") !== -1 ||
        item.getTitle().indexOf("Produto") !== -1 ||
        item.getTitle().indexOf("comprou") !== -1) {

      item.asTextItem()
          .setHelpText("Marca e modelo — escreva como preferir, nossa IA trata os erros automaticamente.\nEx: Olympikus Corre 5...")
          .setRequired(false);

      Logger.log("✅ Texto de exemplo do produto atualizado (Nike removida).");
    }
  });

  // ── 7. Log final ──────────────────────────────────────────
  Logger.log("─────────────────────────────────────");
  Logger.log("✅ Formulário atualizado com sucesso!");
  Logger.log("🔗 Link público: " + form.getPublishedUrl());
  Logger.log("✏️  Link de edição: " + form.getEditUrl());
}
