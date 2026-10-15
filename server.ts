import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EVENTS_FILE = path.join(DATA_DIR, 'analytics_events.json');
const CONFIG_FILE = path.join(DATA_DIR, 'analytics_config.json');

// Helper to read stored events
function getStoredEvents(): any[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading analytics file:', err);
  }
  return [];
}

// Helper to save events
function saveEvents(events: any[]) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving analytics file:', err);
  }
}

// Helper to read config
function getConfig(): { googleSheetsWebhookUrl?: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return { googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '' };
}

// Helper to save config
function saveConfig(cfg: { googleSheetsWebhookUrl?: string }) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch {}
}

// Forward to Google Sheets Webhook asynchronously
async function forwardToGoogleSheets(events: any[]) {
  const cfg = getConfig();
  const webhookUrl = cfg.googleSheetsWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('http')) return;

  for (const evt of events) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: evt.eventId,
          timestamp: evt.timestamp,
          username: evt.username,
          playerId: evt.playerId,
          sessionId: evt.sessionId,
          game: evt.game,
          eventType: evt.eventType,
          questionId: evt.data?.questionId || '',
          question: evt.data?.question || '',
          selectedOption: evt.data?.selectedOption || '',
          selectedText: evt.data?.selectedText || '',
          correctOption: evt.data?.correctOption || '',
          correctText: evt.data?.correctText || '',
          result: evt.data?.result || evt.data?.status || '',
          feedback: evt.data?.feedback || '',
          responseTimeSec: evt.data?.responseTimeSec || '',
          balance: evt.data?.newBalance || evt.data?.finalBalance || '',
          creditsAwarded: evt.data?.creditsAwarded || evt.data?.reward || '',
          details: JSON.stringify(evt.data || {}),
        }),
      });
    } catch (err) {
      console.warn('Google Sheets forwarding error:', err);
    }
  }
}

// API Routes
app.post('/api/analytics/event', (req, res) => {
  const body = req.body;
  const newEvents = Array.isArray(body) ? body : [body];
  const current = getStoredEvents();
  const updated = [...current, ...newEvents];
  saveEvents(updated);

  // Async forward to Google Sheets if configured
  forwardToGoogleSheets(newEvents).catch(() => {});

  res.json({ success: true, count: newEvents.length, total: updated.length });
});

app.get('/api/analytics/config', (_req, res) => {
  const cfg = getConfig();
  res.json({
    googleSheetsWebhookUrl: cfg.googleSheetsWebhookUrl || '',
    isConfigured: !!(cfg.googleSheetsWebhookUrl && cfg.googleSheetsWebhookUrl.startsWith('http')),
    totalEvents: getStoredEvents().length,
  });
});

app.post('/api/analytics/config', (req, res) => {
  const { googleSheetsWebhookUrl } = req.body;
  saveConfig({ googleSheetsWebhookUrl: String(googleSheetsWebhookUrl || '').trim() });
  res.json({ success: true, saved: true });
});

app.get('/api/analytics/summary', (_req, res) => {
  const events = getStoredEvents();
  const players = new Set(events.map((e) => e.username || e.playerId));
  const questionsAnswered = events.filter((e) => e.eventType === 'QUESTION_ANSWERED');
  const correctCount = questionsAnswered.filter((e) => e.data?.result === 'CORRECTA').length;
  const incorrectCount = questionsAnswered.filter((e) => e.data?.result === 'INCORRECTA').length;

  res.json({
    totalEvents: events.length,
    uniquePlayers: players.size,
    totalQuestionsAnswered: questionsAnswered.length,
    correctCount,
    incorrectCount,
    accuracyRate: questionsAnswered.length > 0 ? (correctCount / questionsAnswered.length) * 100 : 0,
  });
});

// CSV Export route for Google Sheets import
app.get('/api/analytics/export.csv', (_req, res) => {
  const events = getStoredEvents();
  const headers = [
    'ID_Evento',
    'Marca_Temporal',
    'Jugador_Nombre',
    'ID_Jugador',
    'ID_Sesion',
    'Modulo_Juego',
    'Tipo_Evento',
    'ID_Pregunta',
    'Pregunta',
    'Opcion_Seleccionada',
    'Texto_Seleccionado',
    'Opcion_Correcta',
    'Texto_Correcto',
    'Resultado',
    'Retroalimentacion',
    'Tiempo_Respuesta_Seg',
    'Saldo',
    'Creditos_Otorgados',
    'Detalles',
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = events.map((e) => [
    escapeCsv(e.eventId),
    escapeCsv(e.timestamp),
    escapeCsv(e.username),
    escapeCsv(e.playerId),
    escapeCsv(e.sessionId),
    escapeCsv(e.game),
    escapeCsv(e.eventType),
    escapeCsv(e.data?.questionId || ''),
    escapeCsv(e.data?.question || ''),
    escapeCsv(e.data?.selectedOption || ''),
    escapeCsv(e.data?.selectedText || ''),
    escapeCsv(e.data?.correctOption || ''),
    escapeCsv(e.data?.correctText || ''),
    escapeCsv(e.data?.result || e.data?.status || ''),
    escapeCsv(e.data?.feedback || ''),
    escapeCsv(e.data?.responseTimeSec || ''),
    escapeCsv(e.data?.newBalance || e.data?.finalBalance || ''),
    escapeCsv(e.data?.creditsAwarded || e.data?.reward || ''),
    escapeCsv(JSON.stringify(e.data || {})),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="casino_educativo_analiticas.csv"');
  res.send(csvContent);
});

// Google Apps Script source code template
app.get('/api/analytics/sheets-script', (_req, res) => {
  const script = `// =================================================================
// CÓDIGO GOOGLE APPS SCRIPT PARA CASINO EDUCATIVO CANINO
// Pega este código en: Extensiones > Apps Script en tu Google Sheet
// Luego haz clic en "Implementar" > "Nueva implementación" > "Aplicación web"
// Acceso: "Cualquiera" (Anyone)
// =================================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la hoja está vacía, agregar encabezados
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Marca Temporal",
        "Jugador",
        "Juego",
        "Tipo de Evento",
        "ID Pregunta",
        "Pregunta",
        "Opción Seleccionada",
        "Texto Seleccionado",
        "Opción Correcta",
        "Resultado",
        "Retroalimentación",
        "Tiempo Respuesta (s)",
        "Saldo",
        "Créditos Otorgados",
        "ID Sesión",
        "Detalles"
      ]);
      sheet.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#f3f4f6");
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.username || "Anónimo",
      data.game || "",
      data.eventType || "",
      data.questionId || "",
      data.question || "",
      data.selectedOption || "",
      data.selectedText || "",
      data.correctOption || "",
      data.result || "",
      data.feedback || "",
      data.responseTimeSec || "",
      data.balance || "",
      data.creditsAwarded || "",
      data.sessionId || "",
      data.details || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook de Casino Educativo Activo.");
}
`;
  res.type('text/plain').send(script);
});

// Start Server & mount Vite
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Casino server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
