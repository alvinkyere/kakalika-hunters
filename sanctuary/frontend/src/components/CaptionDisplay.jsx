// components/CaptionDisplay.jsx
// Renders the scrolling caption history + animated live line.
// Used by both ProjectionPage and AttendeePage — the `variant` prop
// switches between the two visual styles.
//
// Props:
//   history     {string[]}  — previous caption lines (oldest first)
//   current     {string}    — the current live caption text
//   fontSize    {string}    — CSS font-size value for the live line (attendee only)
//   fontFamily  {string}    — CSS font-family override (attendee dyslexic mode)
//   color       {string}    — CSS color override (attendee high-contrast mode)
//   variant     {"projection"|"attendee"}

import { useEffect, useRef, useState } from "react";

export default function CaptionDisplay({
  history = [],
  current = "",
  fontSize,
  fontFamily,
  color,
  variant = "attendee",
}) {
  const [animKey, setAnimKey] = useState(0);

  // Re-trigger the fade-up animation every time the live caption changes
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [current]);

  if (variant === "projection") {
    return (
      <div className="proj-captions">
        <div className="proj-history">
          {history.map((line, i) => (
            <p
              key={i}
              className={`proj-hist-line${i >= history.length - 2 ? " recent" : ""}`}
              style={{ fontSize: (1.1 + (i / Math.max(history.length, 1)) * 0.4) + "rem" }}
            >
              {line}
            </p>
          ))}
        </div>

        <p
          key={animKey}
          className="proj-live-line proj-in"
        >
          {current}
          <span className="proj-cursor" />
        </p>
      </div>
    );
  }

  // ── Attendee variant ────────────────────────────────────────────────────────
  return (
    <div className="ph-caption-area">
      <div className="ph-history" aria-hidden="true">
        {history.map((line, i) => {
          const ratio = (i + 1) / Math.max(history.length, 1);
          return (
            <p
              key={i}
              style={{
                fontSize: `calc(${fontSize || "2rem"} * ${0.4 + ratio * 0.1})`,
                opacity: 0.15 + ratio * 0.28,
                fontFamily,
              }}
            >
              {line}
            </p>
          );
        })}
      </div>

      <div className="ph-live-wrap">
        <p
          key={animKey}
          className="ph-caption ph-in"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ fontSize, fontFamily, color }}
        >
          {current}
          <span className="live-cursor" />
        </p>
      </div>
    </div>
  );
}
