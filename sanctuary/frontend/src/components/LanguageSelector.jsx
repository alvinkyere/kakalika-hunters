// components/LanguageSelector.jsx
// The language dropdown used on the Attendee phone page.
// Sends the preference to the server via Socket.io when changed.
//
// Props:
//   value     {string}    — current language code, e.g. "en"
//   onChange  {function}  — called with (code, label) when a language is picked

import { useState, useEffect, useRef } from "react";
import { emitSetLanguage } from "../socketEvents";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "普通话" },
  { code: "ht", label: "Kreyòl Ayisyen" },
];

export default function LanguageSelector({ value = "en", onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function select(lang) {
    setOpen(false);
    emitSetLanguage(lang.code);
    onChange?.(lang.code, lang.label);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        className="ph-lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        🌐 {current.label}
        <span style={{ fontSize: "0.6rem", opacity: 0.5, marginLeft: 2 }}>▼</span>
      </button>

      <div
        id="ph-lang-menu"
        className={`ph-lang-menu${open ? " open" : ""}`}
        role="listbox"
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            role="option"
            aria-selected={lang.code === value}
            className={lang.code === value ? "active" : ""}
            onClick={() => select(lang)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
