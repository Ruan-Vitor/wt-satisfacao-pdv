// ============================================================
//  WORLD TENNIS — Teresina Shopping
//  Script 1: Criação automática do Google Forms + Planilha
//  ► Cole no Apps Script e execute criarFormulario()
// ============================================================

var PASTA_ID       = "1Jm2-e_GbjtwR3K4l0Vn6np0UqWvQGmt3";
var NOME_FORMULARIO = "Pesquisa de Satisfação — World Tennis Teresina Shopping";
var NOME_PLANILHA   = "Respostas WT Teresina Shopping";
var VENDEDORES      = ["João", "Maria", "Carlos", "Ana", "Pedro", "Lúcia"];

function criarFormulario() {

  // ── 1. Criar o formulário ──────────────────────────────────
  var form = FormApp.create(NOME_FORMULARIO);
  form.setDescription("Sua opinião é muito importante para nós! Todas as perguntas são opcionais.");
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage("Obrigado! Sua avaliação ajuda a World Tennis a melhorar o atendimento a cada dia.");
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setShuffleQuestions(false);

  // ── 2. TELA 1 — Produto comprado ──────────────────────────
  form.addSectionHeaderItem()
    .setTitle("🛍️ Produto comprado")
    .setHelpText("Tela 1 de 4");

  form.addTextItem()
    .setTitle("Qual produto você comprou?")
    .setHelpText("Marca e modelo — escreva como preferir, nossa IA trata os erros automaticamente.\nEx: Nike Air Max, Olympikus Confort...")
    .setRequired(false);

  // ── 3. TELA 2 — Perfil demográfico ───────────────────────
  form.addPageBreakItem()
    .setTitle("👤 Perfil")
    .setHelpText("Tela 2 de 4 — Campos opcionais");

  form.addMultipleChoiceItem()
    .setTitle("Faixa etária")
    .setChoiceValues([
      "Até 19 anos",
      "20–29 anos",
      "30–39 anos",
      "40–49 anos",
      "50 anos ou mais"
    ])
    .showOtherOption(false)
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("Sexo")
    .setChoiceValues(["Masculino", "Feminino", "Outros"])
    .showOtherOption(false)
    .setRequired(false);

  // ── 4. TELA 3 — Avaliação do atendimento ─────────────────
  form.addPageBreakItem()
    .setTitle("⭐ Avaliação do atendimento")
    .setHelpText("Tela 3 de 4");

  form.addScaleItem()
    .setTitle("Como você avalia o atendimento realizado pelo nosso atendente?")
    .setHelpText("1 = Ruim · 2 = Regular · 3 = Bom · 4 = Muito bom · 5 = Excelente")
    .setBounds(1, 5)
    .setLabels("Ruim", "Excelente")
    .setRequired(false);

  // ── 5. TELA 4 — Vendedor ──────────────────────────────────
  form.addPageBreakItem()
    .setTitle("🏷️ Vendedor(a)")
    .setHelpText("Tela 4 de 4");

  var opcoes = VENDEDORES.map(function(nome, i) {
    return nome + " — Vendedor " + (i + 1);
  });

  form.addMultipleChoiceItem()
    .setTitle("Quem te atendeu?")
    .setHelpText("Selecione o nome do vendedor(a)")
    .setChoiceValues(opcoes)
    .showOtherOption(false)
    .setRequired(false);

  // ── 6. Mover o Forms para a pasta correta ─────────────────
  var formFile = DriveApp.getFileById(form.getId());
  var pasta    = DriveApp.getFolderById(PASTA_ID);
  pasta.addFile(formFile);
  DriveApp.getRootFolder().removeFile(formFile);

  // ── 7. Criar planilha de respostas na mesma pasta ─────────
  var ss = SpreadsheetApp.create(NOME_PLANILHA);
  var ssFile = DriveApp.getFileById(ss.getId());
  pasta.addFile(ssFile);
  DriveApp.getRootFolder().removeFile(ssFile);

  // Adicionar aba de histórico de vendedores
  var sheet = ss.getActiveSheet();
  sheet.setName("Respostas");

  var historicoSheet = ss.insertSheet("Histórico de Vendedores");
  historicoSheet.appendRow(["Data da Troca", "Número do Vendedor", "Nome Antigo", "Nome Novo"]);
  historicoSheet.getRange(1, 1, 1, 4).setFontWeight("bold");

  var configSheet = ss.insertSheet("Config Vendedores");
  configSheet.appendRow(["Número", "Nome Atual", "Última Atualização"]);
  configSheet.getRange(1, 1, 1, 3).setFontWeight("bold");
  VENDEDORES.forEach(function(nome, i) {
    configSheet.appendRow([i + 1, nome, new Date()]);
  });

  // ── 8. Vincular formulário à planilha ─────────────────────
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ── 9. Log final com os links ─────────────────────────────
  Logger.log("✅ Formulário criado com sucesso!");
  Logger.log("📋 Link do Forms: " + form.getPublishedUrl());
  Logger.log("📊 Link da Planilha: " + ss.getUrl());
  Logger.log("✏️  Link de edição do Forms: " + form.getEditUrl());

  // Guardar IDs na aba Config para os outros scripts usarem
  var metaSheet = ss.insertSheet("_Meta");
  metaSheet.appendRow(["form_id", form.getId()]);
  metaSheet.appendRow(["form_url", form.getPublishedUrl()]);
  metaSheet.appendRow(["planilha_id", ss.getId()]);
  metaSheet.appendRow(["criado_em", new Date()]);
  metaSheet.hideSheet();

  return {
    formUrl: form.getPublishedUrl(),
    sheetUrl: ss.getUrl()
  };
}
