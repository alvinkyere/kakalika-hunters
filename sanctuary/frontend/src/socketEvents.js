import socket from "./socket";

export const EVENT_NAMES = {
  JOIN_SESSION:    "join-session",
  HOST_SESSION:    "host-session",
  LEAVE_SESSION:   "leave-session",
  NEW_TRANSCRIPT:  "new-transcript",
  CHANGE_LANGUAGE: "change-language",
  CAPTION_UPDATE:  "caption-update",
  SESSION_STATS:   "session-stats",
  SESSION_ENDED:   "session-ended",
  SESSION_ERROR:   "session-error",
};

export const emitJoinSession = (sessionId, language = "EN") =>
  socket.emit(EVENT_NAMES.JOIN_SESSION, { sessionId, language });

export const emitHostSession = (sessionId) =>
  socket.emit(EVENT_NAMES.HOST_SESSION, sessionId);

export const emitSetLanguage = (sessionId, newLanguage) =>
  socket.emit(EVENT_NAMES.CHANGE_LANGUAGE, { sessionId, newLanguage });
export const emitStartSession = () =>
  socket.emit("start-session");

export const emitEndSession = (sessionId) =>
  socket.emit("end-session", { sessionId });

export const emitSetAudioSource = (source) =>
  socket.emit("set-audio-source", { source });

export function registerHostEvents({ onCaptionUpdate, onSessionStats, onSessionEnded, onSessionError }) {
  socket.connect();
  socket.on(EVENT_NAMES.CAPTION_UPDATE, onCaptionUpdate);
  socket.on(EVENT_NAMES.SESSION_STATS,  onSessionStats);
  socket.on(EVENT_NAMES.SESSION_ENDED,  onSessionEnded);
  socket.on(EVENT_NAMES.SESSION_ERROR,  onSessionError);
  return () => {
    socket.off(EVENT_NAMES.CAPTION_UPDATE);
    socket.off(EVENT_NAMES.SESSION_STATS);
    socket.off(EVENT_NAMES.SESSION_ENDED);
    socket.off(EVENT_NAMES.SESSION_ERROR);
  };
}

export function registerAttendeeEvents({ onCaptionUpdate, onSessionEnded, onConnect, onDisconnect }) {
  socket.connect();
  socket.on(EVENT_NAMES.CAPTION_UPDATE, onCaptionUpdate);
  socket.on(EVENT_NAMES.SESSION_ENDED,  onSessionEnded);
  socket.on("connect",    onConnect);
  socket.on("disconnect", onDisconnect);
  return () => {
    socket.off(EVENT_NAMES.CAPTION_UPDATE);
    socket.off(EVENT_NAMES.SESSION_ENDED);
    socket.off("connect");
    socket.off("disconnect");
  };
}