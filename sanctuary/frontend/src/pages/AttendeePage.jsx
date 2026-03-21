import { useState, useEffect } from "react";
import LanguageSelector, { LANGUAGES } from "../components/LanguageSelector";
import AccessibilityBar, { FONT_SIZES } from "../components/AccessibilityBar";
import CaptionDisplay from "../components/CaptionDisplay";
import { registerAttendeeEvents, emitJoinSession, emitSetLanguage } from "../socketEvents";
import "../styles/attendee.css";

export default function AttendeePage() {
  const sessionCode = new URLSearchParams(window.location.search).get("session") ?? "DEMO";

  const [history,     setHistory]     = useState([]);
  const [current,     setCurrent]     = useState("Joining session…");
  const [isLive,      setIsLive]      = useState(false);
  const [language,    setLanguage]    = useState("en");
  const [fontSizeIdx, setFontSizeIdx] = useState(2);
  const [highContrast,setHighContrast]= useState(false);
  const [dyslexic,    setDyslexic]    = useState(false);

  useEffect(() => {
    if (!sessionCode || sessionCode === "DEMO") return;
    emitJoinSession(sessionCode, "EN");
    setIsLive(true);
  }, [sessionCode]);

  useEffect(() => {
    const cleanup = registerAttendeeEvents({
      onCaptionUpdate: ({ text }) => receiveCaption(text),
      onSessionEnded:  () => {
        setCurrent("This session has ended. Thank you for joining.");
        setIsLive(false);
      },
      onConnect:    () => setIsLive(true),
      onDisconnect: () => setIsLive(false),
    });
    return cleanup;
  }, []);

  function receiveCaption(text) {
    setCurrent(text);
    setHistory((prev) => [...prev.slice(-5), text]);
  }

  function handleLanguageChange(code) {
    setLanguage(code);
    emitSetLanguage(sessionCode, code.toUpperCase());
  }

  const fontSize   = FONT_SIZES[fontSizeIdx];
  const fontFamily = dyslexic ? "'OpenDyslexic', 'Comic Sans MS', cursive" : "var(--ff-serif)";
  const textColor  = highContrast ? "#FFFF00" : undefined;

  return (
    <div
      className={`phone-frame${highContrast ? " high-contrast" : ""}`}
      style={highContrast ? { background: "#000", color: "#FFFF00" } : {}}
    >
      <header className="phone-header">
        <div className="ph-status">
          <span className={`ph-dot${isLive ? " live" : ""}`} />
          <span className="ph-status-text">
            {isLive ? `LIVE · ${sessionCode.toUpperCase().slice(0, 8)}` : "CONNECTING…"}
          </span>
        </div>
        <LanguageSelector
          value={language}
          onChange={handleLanguageChange}
        />
      </header>

      <AccessibilityBar
        fontSizeIdx={fontSizeIdx}
        highContrast={highContrast}
        dyslexic={dyslexic}
        onFontInc={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
        onFontDec={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
        onToggleHC={() => setHighContrast((v) => !v)}
        onToggleDy={() => setDyslexic((v) => !v)}
      />

      <CaptionDisplay
        variant="attendee"
        history={history}
        current={current}
        fontSize={fontSize}
        fontFamily={fontFamily}
        color={textColor}
      />

      <footer className="ph-footer">
        <span className="ph-footer-txt">SESSION · {sessionCode.toUpperCase().slice(0, 8)}</span>
        <span className="ph-footer-txt">
          {LANGUAGES.find((l) => l.code === language)?.label ?? "English"}
        </span>
      </footer>
    </div>
  );
}
