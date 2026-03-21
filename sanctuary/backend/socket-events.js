/**
 * socket-events.js  —  SHARED FILE
 *
 * Two responsibilities:
 *  1. EVENT_NAMES: the single source of truth for every socket event string.
 *     Import this on both client and server so a typo in one place doesn't
 *     silently break the other.
 *
 *  2. registerSocketEvents(): wires up all server-side socket handlers.
 *     Called once per connection in server.js.
 *
 * ─────────────────────────────────────────────────────────────────
 *  EDITING POLICY: Never edit this file alone.
 *  Any change to an event name or payload shape must be coordinated
 *  with Person 1 (frontend) and Person 3 (transcribe/translate).
 * ─────────────────────────────────────────────────────────────────
 */

const {
  getSession,
  addAttendee,
  removeAttendee,
  getSessionStats,
} = require("./sessions");

const { translate } = require("./translate");

// ── Event name constants ──────────────────────────────────────────────────────
const EVENT_NAMES = {
  // Client → Server
  JOIN_SESSION: "join-session",       // attendee joins a room
  HOST_SESSION: "host-session",       // host claims a room
  LEAVE_SESSION: "leave-session",     // explicit leave (language changes also trigger)
  NEW_TRANSCRIPT: "new-transcript",   // Person 3 pushes raw transcript text here
  CHANGE_LANGUAGE: "change-language", // attendee switches language dropdown

  // Server → Client
  CAPTION_UPDATE: "caption-update",   // broadcast: { text, isFinal, lang }
  SESSION_STATS: "session-stats",     // broadcast to host: { attendeeCount, languageCounts }
  SESSION_ENDED: "session-ended",     // broadcast when host ends the session
  SESSION_ERROR: "session-error",     // unicast error back to sender
};

// ── Handler registration ──────────────────────────────────────────────────────

/**
 * registerSocketEvents(io, socket)
 *
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
function registerSocketEvents(io, socket) {

  // ── Host claims a session room ──────────────────────────────────────────────
  socket.on(EVENT_NAMES.HOST_SESSION, (sessionId) => {
    const session = getSession(sessionId);
    if (!session) {
      socket.emit(EVENT_NAMES.SESSION_ERROR, { message: "Session not found." });
      return;
    }
    session.hostSocketId = socket.id;
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.role = "host";
    console.log(`[Socket] Host ${socket.id} claimed session ${sessionId}`);

  socket.on("audio-chunk", async (buffer) => {
  const { sendAudioChunk } = require("./transcribe");
  sendAudioChunk(buffer);
});


  });

  // ── Attendee joins a session room ───────────────────────────────────────────
  socket.on(EVENT_NAMES.JOIN_SESSION, ({ sessionId, language = "EN" }) => {
    const session = getSession(sessionId);
    if (!session) {
      socket.emit(EVENT_NAMES.SESSION_ERROR, { message: "Session not found or has ended." });
      return;
    }

    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.language = language.toUpperCase();
    socket.data.role = "attendee";

    addAttendee(sessionId, language);
    broadcastStats(io, sessionId);
    console.log(`[Socket] Attendee ${socket.id} joined session ${sessionId} (${language})`);
  });

  // ── Attendee changes their display language ─────────────────────────────────
  socket.on(EVENT_NAMES.CHANGE_LANGUAGE, (payload) => {
  const sessionId   = payload?.sessionId;
  const newLanguage = payload?.newLanguage ?? payload?.language ?? "EN";
  const oldLanguage = socket.data.language ?? "EN";
  const lang        = newLanguage.toUpperCase();

  removeAttendee(sessionId, oldLanguage);
  socket.data.language = lang;
  addAttendee(sessionId, lang);

  broadcastStats(io, sessionId);
  console.log(`[Socket] ${socket.id} changed language ${oldLanguage} → ${lang}`);
});

  // ── Person 3 pushes a transcript chunk ─────────────────────────────────────
  //
  // Payload: { sessionId, text, isFinal }
  //
  // Strategy:
  //   - Collect all sockets in the room.
  //   - Group them by target language.
  //   - Translate once per unique language (not once per socket).
  //   - Emit the right text to each socket individually.
  //
  socket.on(EVENT_NAMES.NEW_TRANSCRIPT, async ({ sessionId, text, isFinal }) => {
    console.log("[Transcript] received:", text, "for session:", sessionId);

    if (!text) return;

    const session = getSession(sessionId);
    if (!session) return;

    // Build a map of language → [socketId, ...]
    const socketsInRoom = await io.in(sessionId).fetchSockets();
    const langGroups = new Map(); // "ES" → [socket, socket, ...]

    for (const s of socketsInRoom) {
      if (s.data.role !== "attendee") continue;
      const lang = s.data.language ?? "EN";
      if (!langGroups.has(lang)) langGroups.set(lang, []);
      langGroups.get(lang).push(s);
    }
    socket.emit(EVENT_NAMES.CAPTION_UPDATE, { text, isFinal, lang: "EN" });

    // Translate once per language, then fan out
    const translationJobs = Array.from(langGroups.entries()).map(async ([lang, sockets]) => {
      let translatedText = text;

      if (lang !== "EN") {
        translatedText = await translate(text, lang);
      }

      const payload = { text: translatedText, isFinal, lang };
      for (const s of sockets) {
        s.emit(EVENT_NAMES.CAPTION_UPDATE, payload);
      }
    });

    await Promise.all(translationJobs);
  });

  // ── Explicit leave ──────────────────────────────────────────────────────────
  socket.on(EVENT_NAMES.LEAVE_SESSION, () => {
    handleDisconnect(io, socket);
  });

  // ── Implicit disconnect ─────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    handleDisconnect(io, socket);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function handleDisconnect(io, socket) {
  const { sessionId, language, role } = socket.data ?? {};
  if (!sessionId) return;

  if (role === "attendee") {
    removeAttendee(sessionId, language ?? "EN");
    broadcastStats(io, sessionId);
  }
}

function broadcastStats(io, sessionId) {
  const stats = getSessionStats(sessionId);
  if (!stats) return;
  // Only the host needs live stats (sidebar counts)
  io.to(sessionId).emit(EVENT_NAMES.SESSION_STATS, stats);
}

module.exports = { EVENT_NAMES, registerSocketEvents };
