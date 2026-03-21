// pages/AttendeePage.jsx
// The mobile web page that loads after an attendee scans the QR code.
// Reads ?session= from the URL, joins the room, and displays live captions.
//
// Socket events wired here:
//   emit → attendee:join, attendee:set-language
//   on   → caption:update, session:ended

import { useState, useEffect } from "react";
import LanguageSelector, { LANGUAGES } from "../components/LanguageSelector";
import AccessibilityBar, { FONT_SIZES } from "../components/AccessibilityBar";
import CaptionDisplay from "../components/CaptionDisplay";
import { registerAttendeeEvents, emitJoinSession } from "../socketEvents";
import "../styles/attendee.css";

// ── Demo stream (remove once backend is wired) ─────────────────────────────────
const DEMO_CAPTIONS = [
  "Good morning. Welcome, all of you.",
  "We are so glad you chose to be here today.",
  "Whether this is your first time with us, or you've been coming for thirty years —",
  "you belong here.",
  "This morning, I want to talk about something that doesn't get said enough.",
  "About the people who sit quietly at the back.",
  "Every community has them. Every congregation has them.",
  "And today, we're going to talk about what it means to truly include them.",
  "Not as a program. Not as an initiative. But as a practice of love.",
];

export default function AttendeePage() {
  // Session
  const sessionCode = new URLSearchParams(window.location.search).get("session") ?? "DEMO";

  // Caption state
  const [history,  setHistory]  = useState([]);
  const [current,  setCurrent]  = useState("Joining session…");
  const [isLive,   setIsLive]   = useState(false);

  // Accessibility state
  const [language,      setLanguage]      = useState("en");
  const [fontSizeIdx,   setFontSizeIdx]   = useState(2);   // default: 2rem
  const [highContrast,  setHighContrast]  = useState(false);
  const [dyslexic,      setDyslexic]      = useState(false);

  // ── Join on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    // In real app: emitJoinSession(sessionCode);
    // Demo: pretend we connected after a short delay
    const t = setTimeout(() => setIsLive(true), 1200);
    return () => clearTimeout(t);
  }, [sessionCode]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = registerAttendeeEvents({
      onCaptionUpdate: ({ text }) => receiveCaption(text),
      onSessionEnded:  ()         => {
        setCurrent("This session has ended. Thank you for joining.");
        setIsLive(false);
      },
      onConnect:    () => setIsLive(true),
      onDisconnect: () => setIsLive(false),
    });
    return cleanup;
  }, []);

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // DELETE once backend is wired.
  useEffect(() => {
    if (!isLive) return;
    let idx = 0;
    receiveCaption(DEMO_CAPTIONS[0]);
    idx++;
    const interval = setInterval(() => {
      receiveCaption(DEMO_CAPTIONS[idx % DEMO_CAPTIONS.length]);
      idx++;
    }, 3800);
    return () => clearInterval(interval);
  }, [isLive]);

  function receiveCaption(text) {
    setCurrent(text);
    setHistory((prev) => [...prev.slice(-5), text]);
  }

  // ── Accessibility helpers ──────────────────────────────────────────────────
  const fontSize   = FONT_SIZES[fontSizeIdx];
  const fontFamily = dyslexic
    ? "'OpenDyslexic', 'Comic Sans MS', cursive"
    : "var(--ff-serif)";
  const textColor  = highContrast ? "#FFFF00" : undefined;

  return (
    <div
      className={`phone-frame${highContrast ? " high-contrast" : ""}`}
      style={highContrast ? { background: "#000", color: "#FFFF00" } : {}}
    >
      {/* ── Header ── */}
      <header className="phone-header">
        <div className="ph-status">
          <span className={`ph-dot${isLive ? " live" : ""}`} />
          <span className="ph-status-text">
            {isLive ? `LIVE · ${sessionCode.toUpperCase()}` : "CONNECTING…"}
          </span>
        </div>
        <LanguageSelector
          value={language}
          onChange={(code) => setLanguage(code)}
        />
      </header>

      {/* ── Accessibility bar ── */}
      <AccessibilityBar
        fontSizeIdx={fontSizeIdx}
        highContrast={highContrast}
        dyslexic={dyslexic}
        onFontInc={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
        onFontDec={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
        onToggleHC={() => setHighContrast((v) => !v)}
        onToggleDy={() => setDyslexic((v) => !v)}
      />

      {/* ── Captions ── */}
      <CaptionDisplay
        variant="attendee"
        history={history}
        current={current}
        fontSize={fontSize}
        fontFamily={fontFamily}
        color={textColor}
      />

      {/* ── Footer ── */}
      <footer className="ph-footer">
        <span className="ph-footer-txt">SESSION · {sessionCode.toUpperCase()}</span>
        <span className="ph-footer-txt">
          {LANGUAGES.find((l) => l.code === language)?.label ?? "English"}
        </span>
      </footer>
    </div>
  );
}
