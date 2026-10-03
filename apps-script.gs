// Confete: Google Apps Script que liga o site às duas planilhas (presentes e convidados).
// Cole em Extensões → Apps Script e publique como Web App. Instruções no README.

// Os dois IDs vêm da URL de cada arquivo: .../spreadsheets/d/<ID>/edit
const SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA_DE_PRESENTES";
const RSVP_SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA_DE_CONVIDADOS";

const SHEET_NAME = "presentes"; // nome exato da aba, sem espaço a mais no final
const RSVP_SHEET_NAME = "confirmacoes"; // idem, aba do arquivo de convidados

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;
  const idx = {
    id: header.indexOf("id"),
    presente: header.indexOf("presente"),
    preco: header.indexOf("preco"),
    status: header.indexOf("status"),
    tamanho: header.indexOf("tamanho"),
    cor: header.indexOf("cor"),
    link: header.indexOf("link"),
  };
  const gifts = data
    .filter((row) => row[idx.id] !== "")
    .map((row) => ({
      id: row[idx.id],
      presente: row[idx.presente],
      preco: row[idx.preco],
      status: row[idx.status],
      tamanho: row[idx.tamanho],
      cor: row[idx.cor],
      link: row[idx.link],
    }));
  return ContentService.createTextOutput(JSON.stringify(gifts)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.type === "rsvp") return handleRsvp(body);
  return handleGiftReservation(body);
}

function handleGiftReservation(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const targetId = String(body.id);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();
    const header = rows[0];
    const idx = {
      id: header.indexOf("id"),
      status: header.indexOf("status"),
      quem: header.indexOf("quem"),
    };
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idx.id]) === targetId) {
        if (rows[i][idx.status] !== "disponivel") return respond({ ok: false, reason: "ja_reservado" });
        sheet.getRange(i + 1, idx.status + 1).setValue("reservado");
        if (idx.quem !== -1 && body.quem) sheet.getRange(i + 1, idx.quem + 1).setValue(body.quem);
        return respond({ ok: true });
      }
    }
    return respond({ ok: false, reason: "nao_encontrado" });
  } finally {
    lock.releaseLock();
  }
}

function handleRsvp(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID).getSheetByName(RSVP_SHEET_NAME);
    sheet.appendRow([body.nome, body.acompanhado ? "sim" : "não", new Date()]);
    return respond({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
