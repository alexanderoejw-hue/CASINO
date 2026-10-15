import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import type { AnalyticsEvent } from '../types/casino.ts';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Provider with minimal necessary Google Sheets and Drive.file scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (strictly per skill guidelines: DO NOT store token in localStorage)
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;
let isSigningIn = false;

// Spreadsheet info
const SPREADSHEET_TITLE = 'Casino Educativo - Registro y Analíticas';
const SPREADSHEET_STORAGE_KEY = 'machete_google_spreadsheet_id';
const SPREADSHEET_URL_STORAGE_KEY = 'machete_google_spreadsheet_url';

let currentSpreadsheetId: string | null = null;
let currentSpreadsheetUrl: string | null = null;
let isInitializingSheet = false;

// Background sync queue
const syncQueue: AnalyticsEvent[] = [];
let isSyncingQueue = false;

// Listeners for UI state updates (silent background indicator)
type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
type StatusListener = (status: SyncStatus, details?: { user?: User | null; sheetUrl?: string | null; syncedCount?: number }) => void;
const listeners = new Set<StatusListener>();

let totalSyncedCount = 0;

export function subscribeToSyncStatus(listener: StatusListener) {
  listeners.add(listener);
  notifyListeners();
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(statusOverride?: SyncStatus) {
  let status: SyncStatus = 'disconnected';
  if (isSyncingQueue) status = 'syncing';
  else if (cachedAccessToken && currentSpreadsheetId) status = 'connected';
  else if (isSigningIn || isInitializingSheet) status = 'connecting';
  else if (cachedAccessToken && !currentSpreadsheetId) status = 'connecting';

  if (statusOverride) status = statusOverride;

  listeners.forEach((fn) =>
    fn(status, {
      user: currentUser,
      sheetUrl: currentSpreadsheetUrl,
      syncedCount: totalSyncedCount,
    })
  );
}

// Initialize Auth listener on app start
export function initGoogleAuth() {
  // Load any previously remembered spreadsheet ID
  currentSpreadsheetId = localStorage.getItem(SPREADSHEET_STORAGE_KEY);
  currentSpreadsheetUrl = localStorage.getItem(SPREADSHEET_URL_STORAGE_KEY);

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (!user) {
      cachedAccessToken = null;
      notifyListeners('disconnected');
    } else {
      notifyListeners();
      if (cachedAccessToken) {
        await ensureSpreadsheetReady();
        flushSyncQueue();
      }
    }
  });
}

// User-triggered Google Sign In
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string } | null> {
  if (isSigningIn) return null;
  isSigningIn = true;
  notifyListeners('connecting');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    currentUser = result.user;

    // Automatically prepare the spreadsheet in the background
    await ensureSpreadsheetReady();
    flushSyncQueue();

    notifyListeners('connected');
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google Sign-in warning/cancelled:', error?.message);
    notifyListeners('disconnected');
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function signOutGoogle() {
  await signOut(auth);
  cachedAccessToken = null;
  currentUser = null;
  notifyListeners('disconnected');
}

export function getCachedToken(): string | null {
  return cachedAccessToken;
}

export function getCurrentSpreadsheetInfo() {
  return {
    spreadsheetId: currentSpreadsheetId,
    spreadsheetUrl: currentSpreadsheetUrl,
    user: currentUser,
    connected: !!(cachedAccessToken && currentSpreadsheetId),
    syncedCount: totalSyncedCount,
  };
}

// Ensure the Google Sheet exists in the user's Google Drive, or create it automatically
export async function ensureSpreadsheetReady(): Promise<string | null> {
  if (!cachedAccessToken) return null;
  if (currentSpreadsheetId && currentSpreadsheetUrl) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}?fields=spreadsheetId`,
        {
          headers: { Authorization: `Bearer ${cachedAccessToken}` },
        }
      );
      if (checkRes.ok) {
        return currentSpreadsheetId;
      }
    } catch {
      // Continue to search/recreate
    }
  }

  if (isInitializingSheet) return null;
  isInitializingSheet = true;
  notifyListeners('connecting');

  try {
    // 1. Search if a file with this name already exists in user's Drive
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name%3D'${encodeURIComponent(
      SPREADSHEET_TITLE
    )}'%20and%20trashed%3Dfalse&fields=files(id,name,webViewLink)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        currentSpreadsheetId = found.id;
        currentSpreadsheetUrl = found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`;
        localStorage.setItem(SPREADSHEET_STORAGE_KEY, currentSpreadsheetId!);
        localStorage.setItem(SPREADSHEET_URL_STORAGE_KEY, currentSpreadsheetUrl!);
        notifyListeners('connected');
        return currentSpreadsheetId;
      }
    }

    // 2. File not found: Create a brand new Google Spreadsheet with tabs & headers
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_TITLE,
        },
        sheets: [
          {
            properties: {
              title: 'Registro en Tiempo Real',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: 'Resumen de Jugadores',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Error creando Google Spreadsheet: ${errText}`);
    }

    const sheetData = await createRes.json();
    currentSpreadsheetId = sheetData.spreadsheetId;
    currentSpreadsheetUrl =
      sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`;

    localStorage.setItem(SPREADSHEET_STORAGE_KEY, currentSpreadsheetId!);
    localStorage.setItem(SPREADSHEET_URL_STORAGE_KEY, currentSpreadsheetUrl!);

    // 3. Insert and style headers
    await initializeSpreadsheetHeaders(currentSpreadsheetId!, cachedAccessToken);

    notifyListeners('connected');
    return currentSpreadsheetId;
  } catch (err) {
    console.error('Error initializing Google Sheets:', err);
    notifyListeners('error');
    return null;
  } finally {
    isInitializingSheet = false;
  }
}

// Populate headers for each sheet
async function initializeSpreadsheetHeaders(spreadsheetId: string, token: string) {
  const headerData = [
    {
      range: "'Registro en Tiempo Real'!A1:P1",
      values: [
        [
          'ID Evento',
          'Fecha y Hora (Local)',
          'Jugador',
          'ID Sesión',
          'Juego',
          'Tipo de Evento',
          'Créditos Antes',
          'Cambio de Créditos',
          'Créditos Después',
          'Racha Actual',
          'Pregunta / Reto',
          'Opción Seleccionada',
          'Opción Correcta',
          '¿Respuesta Correcta?',
          'Retroalimentación Pedagógica',
          'Detalles Adicionales',
        ],
      ],
    },
    {
      range: "'Resumen de Jugadores'!A1:J1",
      values: [
        [
          'Jugador',
          'Última Actividad',
          'Créditos Actuales',
          'Racha Actual',
          'Preguntas Respondidas',
          'Aciertos',
          'Errores',
          '% Precisión',
          'Saldo Neto Total',
          'Último Juego',
        ],
      ],
    },
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData,
      }),
    }
  );
}

// Main background queue method
export function queueGoogleSheetsEvent(event: AnalyticsEvent) {
  syncQueue.push(event);
  flushSyncQueue();
}

// Flush pending events in real time to the Google Sheet
async function flushSyncQueue() {
  if (isSyncingQueue || syncQueue.length === 0) return;
  if (!cachedAccessToken || !currentSpreadsheetId) return;

  isSyncingQueue = true;
  notifyListeners('syncing');

  try {
    while (syncQueue.length > 0) {
      const batch = syncQueue.splice(0, 10);
      const rows = batch.map(formatEventToRow);

      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${currentSpreadsheetId}/values/'Registro en Tiempo Real'!A:P:append?valueInputOption=USER_ENTERED`;

      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      });

      if (!appendRes.ok) {
        syncQueue.unshift(...batch);
        break;
      }

      totalSyncedCount += batch.length;

      for (const evt of batch) {
        await updatePlayerSummaryRow(evt, currentSpreadsheetId, cachedAccessToken).catch((err) =>
          console.warn('Silent player summary update error:', err)
        );
      }
    }

    notifyListeners('connected');
  } catch (err) {
    console.warn('Background sync warning:', err);
    notifyListeners('error');
  } finally {
    isSyncingQueue = false;
  }
}

function formatEventToRow(event: AnalyticsEvent): any[] {
  const d = event.data || {};
  const formattedDate = new Date(event.timestamp).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  let deltaStr = '';
  if (d.deltaCredits !== undefined) {
    deltaStr = d.deltaCredits > 0 ? `+${d.deltaCredits}` : `${d.deltaCredits}`;
  }

  let isCorrectStr = '';
  if (d.isCorrect !== undefined) {
    isCorrectStr = d.isCorrect ? 'SÍ' : 'NO';
  }

  return [
    event.eventId,
    formattedDate,
    event.username,
    event.sessionId,
    event.game,
    event.eventType,
    d.previousCredits !== undefined ? d.previousCredits : '',
    deltaStr,
    d.newCredits !== undefined ? d.newCredits : '',
    d.racha !== undefined ? d.racha : '',
    d.questionText || '',
    d.userAnswer || '',
    d.correctAnswer || '',
    isCorrectStr,
    d.feedback || '',
    JSON.stringify(d),
  ];
}

async function updatePlayerSummaryRow(event: AnalyticsEvent, spreadsheetId: string, token: string) {
  try {
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Resumen de Jugadores'!A2:J100`;
    const readRes = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!readRes.ok) return;

    const data = await readRes.json();
    const rows: any[][] = data.values || [];

    const username = event.username;
    const rowIndex = rows.findIndex((r) => r[0] && r[0].toLowerCase() === username.toLowerCase());

    const d = event.data || {};
    const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' });

    let playerRow: any[];
    let targetRange = '';

    if (rowIndex >= 0) {
      const prev = rows[rowIndex];
      const prevTotalQuestions = parseInt(prev[4] || '0', 10);
      const prevCorrect = parseInt(prev[5] || '0', 10);
      const prevIncorrect = parseInt(prev[6] || '0', 10);
      const prevNet = parseInt(prev[8] || '0', 10);

      const isQuestion = d.isCorrect !== undefined;
      const newTotalQuestions = isQuestion ? prevTotalQuestions + 1 : prevTotalQuestions;
      const newCorrect = d.isCorrect === true ? prevCorrect + 1 : prevCorrect;
      const newIncorrect = d.isCorrect === false ? prevIncorrect + 1 : prevIncorrect;
      const accuracy = newTotalQuestions > 0 ? `${((newCorrect / newTotalQuestions) * 100).toFixed(1)}%` : '0%';

      const currentCredits = d.newCredits !== undefined ? d.newCredits : prev[2];
      const currentRacha = d.racha !== undefined ? d.racha : prev[3];
      const netChange = d.deltaCredits !== undefined ? prevNet + d.deltaCredits : prevNet;

      playerRow = [
        username,
        nowStr,
        currentCredits,
        currentRacha,
        newTotalQuestions,
        newCorrect,
        newIncorrect,
        accuracy,
        netChange,
        event.game,
      ];

      targetRange = `'Resumen de Jugadores'!A${rowIndex + 2}:J${rowIndex + 2}`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [playerRow],
          }),
        }
      );
    } else {
      const isQuestion = d.isCorrect !== undefined;
      const correct = d.isCorrect === true ? 1 : 0;
      const incorrect = d.isCorrect === false ? 1 : 0;
      const totalQ = isQuestion ? 1 : 0;
      const accuracy = totalQ > 0 ? `${((correct / totalQ) * 100).toFixed(1)}%` : '0%';

      playerRow = [
        username,
        nowStr,
        d.newCredits !== undefined ? d.newCredits : 0,
        d.racha !== undefined ? d.racha : 0,
        totalQ,
        correct,
        incorrect,
        accuracy,
        d.deltaCredits || 0,
        event.game,
      ];

      targetRange = `'Resumen de Jugadores'!A:J:append?valueInputOption=USER_ENTERED`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [playerRow],
          }),
        }
      );
    }
  } catch {
    // Non-blocking background error
  }
}
