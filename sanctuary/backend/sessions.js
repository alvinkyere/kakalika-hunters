const { randomUUID } = require("crypto");

/**
 * Session shape:
 * {
 *   id: string,           // UUID used as the Socket.io room name
 *   createdAt: number,    // Date.now()
 *   hostSocketId: string | null,
 *   attendeeCount: number,
 *   languageCounts: Map<string, number>,  // { "ES": 3, "KO": 1 }
 * }
 *
 * Nothing is written to disk. When a session ends, it's gone.
 */

const sessions = new Map();

function createSession() {
  const id = randomUUID();
  const session = {
    id,
    createdAt: Date.now(),
    hostSocketId: null,
    attendeeCount: 0,
    languageCounts: new Map(),
  };
  sessions.set(id, session);
  console.log(`[Sessions] Created session: ${id}`);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

function endSession(sessionId) {
  const existed = sessions.has(sessionId);
  sessions.delete(sessionId);
  if (existed) console.log(`[Sessions] Ended session: ${sessionId}`);
  return existed;
}

function getAllSessions() {
  return Array.from(sessions.values());
}

// ── Attendee tracking ─────────────────────────────────────────────────────────

function addAttendee(sessionId, language = "EN") {
  const session = getSession(sessionId);
  if (!session) return false;
  session.attendeeCount += 1;
  const lang = language.toUpperCase();
  session.languageCounts.set(lang, (session.languageCounts.get(lang) ?? 0) + 1);
  return true;
}

function removeAttendee(sessionId, language = "EN") {
  const session = getSession(sessionId);
  if (!session) return false;
  session.attendeeCount = Math.max(0, session.attendeeCount - 1);
  const lang = language.toUpperCase();
  const current = session.languageCounts.get(lang) ?? 0;
  if (current <= 1) {
    session.languageCounts.delete(lang);
  } else {
    session.languageCounts.set(lang, current - 1);
  }
  return true;
}

/**
 * Returns a plain object safe to send over the wire:
 * { attendeeCount: number, languageCounts: { ES: 2, KO: 1 } }
 */
function getSessionStats(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  return {
    attendeeCount: session.attendeeCount,
    languageCounts: Object.fromEntries(session.languageCounts),
  };
}

module.exports = {
  createSession,
  getSession,
  endSession,
  getAllSessions,
  addAttendee,
  removeAttendee,
  getSessionStats,
};