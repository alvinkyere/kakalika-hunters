// components/SanctuaryLogo.jsx
// The chapel icon + "Sanctuary" wordmark.
//
// Props:
//   dark  {bool}  — use light colors for dark backgrounds (projection header)
//   size  {"sm"|"md"}  — sm = projection header, md = host header (default)

export default function SanctuaryLogo({ dark = false, size = "md" }) {
  const iconSize   = size === "sm" ? 28 : 36;
  const iconRadius = size === "sm" ? 6  : 8;
  const iconBg     = dark ? "rgba(255,255,255,0.08)" : "var(--ink)";
  const svgStroke  = dark ? "rgba(255,255,255,0.5)"  : "#faf7f2";
  const titleSize  = size === "sm" ? "1rem"  : "1.5rem";
  const titleColor = dark ? "rgba(255,255,255,0.45)" : "var(--ink)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {/* Icon */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          background: iconBg,
          borderRadius: iconRadius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2L10 18M4 7L10 2L16 7"
            stroke={svgStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 18V12C6 10.895 6.895 10 8 10H12C13.105 10 14 10.895 14 12V18"
            stroke={svgStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      {size === "md" ? (
        <div>
          <h1
            style={{
              fontFamily: "var(--ff-serif)",
              fontSize: titleSize,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: titleColor,
            }}
          >
            Sanctuary
          </h1>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--ink-muted)",
              marginTop: 2,
              letterSpacing: "0.02em",
            }}
          >
            Live captions for every congregation
          </p>
        </div>
      ) : (
        <span
          style={{
            fontFamily: "var(--ff-serif)",
            fontSize: titleSize,
            color: titleColor,
            letterSpacing: "0.02em",
          }}
        >
          Sanctuary
        </span>
      )}
    </div>
  );
}
