import { handleTranscript, handleSessionEnd, handleSessionStart, handleError } from "./socketEvents.js";

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

let socket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let sessionCode = null;
let language = "EN";
let manuallyClosed = false;

// ─────────────────────────────────────────
// Derive WebSocket URL from current page URL
// Works for both localhost and production
// ─────────────────────────────────────────
function getSocketURL(code) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}?room=${code}&lang=${language}`;
}

// ─────────────────────────────────────────
// Connect
// ─────────────────────────────────────────
export function connect(code, selectedLanguage = "EN") {
  sessionCode = code;
  language = selectedLanguage;
  manuallyClosed = false;

  if (socket && socket.readyState === WebSocket.OPEN) {
    console.warn("[Socket] Already connected.");
    return;
  }

  _createSocket();
}

function _createSocket() {
  const url = getSocketURL(sessionCode);
  console.log(`[Socket] Connecting to ${url}`);

  socket = new WebSocket(url);

  socket.addEventListener("open", _onOpen);
  socket.addEventListener("message", _onMessage);
  socket.addEventListener("close", _onClose);
  socket.addEventListener("error", _onError);
}

// ─────────────────────────────────────────
// Disconnect
// ─────────────────────────────────────────
export function disconnect() {
  manuallyClosed = true;
  clearTimeout(reconnectTimer);

  if (socket) {
    socket.close();
    socket = null;
  }

  console.log("[Socket] Disconnected.");
}

// ─────────────────────────────────────────
// Send language preference update
// Called when attendee switches language mid-session
// ─────────────────────────────────────────
export function updateLanguage(newLang) {
  language = newLang;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "set_language", lang: newLang }));
    console.log(`[Socket] Language updated to ${newLang}`);
  }
}

// ─────────────────────────────────────────
// Connection state helpers
// ─────────────────────────────────────────
export function isConnected() {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

// ─────────────────────────────────────────
// Internal handlers
// ─────────────────────────────────────────
function _onOpen() {
  console.log("[Socket] Connection established.");
  reconnectAttempts = 0;
}

function _onMessage(event) {
  let data;

  try {
    data = JSON.parse(event.data);
  } catch {
    console.warn("[Socket] Received non-JSON message:", event.data);
    return;
  }

  switch (data.type) {
    case "transcript":
      handleTranscript(data);
      break;

    case "session_start":
      handleSessionStart(data);
      break;

    case "session_end":
      handleSessionEnd(data);
      break;

    case "error":
      handleError(data);
      break;

    default:
      console.warn("[Socket] Unknown message type:", data.type);
  }
}

function _onClose(event) {
  console.log(`[Socket] Closed (code ${event.code}).`);

  if (manuallyClosed) return;

  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(
      `[Socket] Reconnecting in ${RECONNECT_DELAY_MS}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
    );
    reconnectTimer = setTimeout(_createSocket, RECONNECT_DELAY_MS);
  } else {
    console.error("[Socket] Max reconnect attempts reached. Giving up.");
    handleError({ message: "Connection lost. Please refresh the page." });
  }
}

function _onError(event) {
  console.error("[Socket] WebSocket error:", event);
}