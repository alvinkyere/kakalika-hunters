// ─────────────────────────────────────────
// socketEvents.js
// Handles all incoming WebSocket events and
// updates the caption UI accordingly.
// ─────────────────────────────────────────

// Expected DOM elements (set in your HTML):
//   #caption-text       — the live caption paragraph
//   #caption-box        — outer container (shown/hidden)
//   #status-indicator   — dot/label showing connection state
//   #session-banner     — shown when session starts
//   #error-banner       — shown on errors
//   #error-message      — text content of the error

const els = {
    get captionText()     { return document.getElementById("caption-text"); },
    get captionBox()      { return document.getElementById("caption-box"); },
    get statusIndicator() { return document.getElementById("status-indicator"); },
    get sessionBanner()   { return document.getElementById("session-banner"); },
    get errorBanner()     { return document.getElementById("error-banner"); },
    get errorMessage()    { return document.getElementById("error-message"); },
  };
  
  // Tracks the last final transcript so partial updates
  // don't overwrite already-committed text awkwardly
  let lastFinalText = "";
  let clearTimer = null;
  const CAPTION_CLEAR_DELAY_MS = 8000; // clear after 8s of silence
  
  // ─────────────────────────────────────────
  // Transcript
  // data: { type, text, isFinal, lang }
  // ─────────────────────────────────────────
  export function handleTranscript(data) {
    const { text, isFinal } = data;
    if (!text) return;
  
    const el = els.captionText;
    if (!el) return;
  
    // Reset the auto-clear timer on every new word
    clearTimeout(clearTimer);
  
    if (isFinal) {
      // Commit the text and store it
      lastFinalText = text;
      el.textContent = text;
      el.classList.remove("partial");
      el.classList.add("final");
  
      // Schedule a clear after silence
      clearTimer = setTimeout(() => {
        el.textContent = "";
        lastFinalText = "";
        el.classList.remove("final");
      }, CAPTION_CLEAR_DELAY_MS);
    } else {
      // Show partial result appended after last final
      const display = lastFinalText
        ? `${lastFinalText} ${text}`
        : text;
      el.textContent = display;
      el.classList.add("partial");
      el.classList.remove("final");
    }
  
    // Make sure the caption box is visible
    _show(els.captionBox);
  }
  
  // ─────────────────────────────────────────
  // Session start
  // data: { type, sessionId, startedAt }
  // ─────────────────────────────────────────
  export function handleSessionStart(data) {
    console.log("[Events] Session started:", data.sessionId);
  
    _setStatus("live", "Live");
    _show(els.sessionBanner);
    _hide(els.errorBanner);
  
    // Auto-hide the session banner after 3s
    setTimeout(() => _hide(els.sessionBanner), 3000);
  }
  
  // ─────────────────────────────────────────
  // Session end
  // data: { type, endedAt }
  // ─────────────────────────────────────────
  export function handleSessionEnd(data) {
    console.log("[Events] Session ended.");
  
    _setStatus("ended", "Session ended");
  
    const el = els.captionText;
    if (el) {
      el.textContent = "The session has ended.";
      el.classList.remove("partial");
      el.classList.add("final");
    }
  
    // Clear any pending auto-clear — keep the final message visible
    clearTimeout(clearTimer);
  }
  
  // ─────────────────────────────────────────
  // Error
  // data: { type, message }
  // ─────────────────────────────────────────
  export function handleError(data) {
    console.error("[Events] Error received:", data.message);
  
    _setStatus("error", "Connection issue");
  
    const msgEl = els.errorMessage;
    if (msgEl) msgEl.textContent = data.message || "Something went wrong.";
  
    _show(els.errorBanner);
  }
  
  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  function _show(el) {
    if (el) el.style.display = "";
  }
  
  function _hide(el) {
    if (el) el.style.display = "none";
  }
  
  // status: "live" | "ended" | "error" | "waiting"
  function _setStatus(status, label) {
    const el = els.statusIndicator;
    if (!el) return;
  
    el.dataset.status = status;
    el.textContent = label;
  }