// components/AccessibilityBar.jsx
// Font-size controls, high-contrast toggle, and OpenDyslexic toggle.
// Used on the Attendee phone page.
//
// Props:
//   fontSizeIdx   {number}    — index into FONT_SIZES array (0–4)
//   highContrast  {bool}
//   dyslexic      {bool}
//   onFontInc     {function}
//   onFontDec     {function}
//   onToggleHC    {function}
//   onToggleDy    {function}

export const FONT_SIZES = ["1.3rem", "1.65rem", "2rem", "2.6rem", "3.2rem"];

export default function AccessibilityBar({
  fontSizeIdx,
  highContrast,
  dyslexic,
  onFontInc,
  onFontDec,
  onToggleHC,
  onToggleDy,
}) {
  const atMin = fontSizeIdx === 0;
  const atMax = fontSizeIdx === FONT_SIZES.length - 1;

  return (
    <div className="ph-a11y" role="toolbar" aria-label="Accessibility controls">
      {/* Font size */}
      <span className="ph-a11y-label">Size</span>
      <button
        onClick={onFontDec}
        disabled={atMin}
        aria-label="Decrease font size"
      >
        A−
      </button>
      <button
        onClick={onFontInc}
        disabled={atMax}
        aria-label="Increase font size"
      >
        A+
      </button>

      <div className="ph-a11y-sep" />

      {/* High contrast */}
      <button
        className={highContrast ? "on" : ""}
        aria-pressed={highContrast}
        onClick={onToggleHC}
      >
        ◑ Contrast
      </button>

      <div className="ph-a11y-sep" />

      {/* Dyslexia-friendly font */}
      <button
        className={dyslexic ? "on" : ""}
        aria-pressed={dyslexic}
        onClick={onToggleDy}
      >
        𝖠 Dyslexic
      </button>
    </div>
  );
}
