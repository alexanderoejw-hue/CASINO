import type { AnalyticsEvent, PlayerStats } from '../types/casino.ts';
import { queueGoogleSheetsEvent } from './googleSheetsSync.ts';

const SESSION_KEY = 'machete_session_id';
const PLAYER_KEY = 'machete_player_id';

export function getOrCreatePlayerId(username: string): string {
  let pid = localStorage.getItem(`${PLAYER_KEY}_${username.toLowerCase()}`);
  if (!pid) {
    pid = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(`${PLAYER_KEY}_${username.toLowerCase()}`, pid);
  }
  return pid;
}

export function createNewSessionId(): string {
  const sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  sessionStorage.setItem(SESSION_KEY, sid);
  return sid;
}

export function getCurrentSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = createNewSessionId();
  }
  return sid;
}

// Queue of pending events to retry if offline
let pendingQueue: AnalyticsEvent[] = [];
let isFlushing = false;

export async function sendAnalyticsEvent(
  eventType: AnalyticsEvent['eventType'],
  game: AnalyticsEvent['game'],
  username: string,
  data: Record<string, any> = {}
): Promise<string> {
  const playerId = getOrCreatePlayerId(username);
  const sessionId = getCurrentSessionId();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const event: AnalyticsEvent = {
    eventId,
    eventType,
    playerId,
    username,
    sessionId,
    timestamp: new Date().toISOString(),
    game,
    data,
  };

  pendingQueue.push(event);
  flushQueue();
  queueGoogleSheetsEvent(event);

  return eventId;
}

async function flushQueue() {
  if (isFlushing || pendingQueue.length === 0) return;
  isFlushing = true;

  try {
    const toSend = [...pendingQueue];
    const res = await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend),
    });

    if (res.ok) {
      // Remove successfully processed events
      pendingQueue = pendingQueue.filter((evt) => !toSend.some((s) => s.eventId === evt.eventId));
    }
  } catch {
    // Keep in pending queue for next flush
  } finally {
    isFlushing = false;
  }
}

// Periodically flush pending queue
if (typeof window !== 'undefined') {
  window.setInterval(flushQueue, 5000);
}
