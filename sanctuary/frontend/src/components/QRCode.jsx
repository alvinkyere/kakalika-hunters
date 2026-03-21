// components/QRCode.jsx
// Renders the decorative QR code SVG used on both the Host sidebar
// and the Projection screen sidebar.
//
// Props:
//   size      {number}  — pixel width/height of the SVG (default 140)
//   faded     {bool}    — if true, renders at 0.2 opacity (pre-session state)

export default function QRCode({ size = 140, faded = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: faded ? 0.2 : 1, display: "block" }}
    >
      <rect width="140" height="140" fill="white" />

      {/* ── Finder patterns ── */}
      {/* Top-left */}
      <rect x="10" y="10" width="40" height="40" rx="3" fill="#1c1a16" />
      <rect x="16" y="16" width="28" height="28" rx="2" fill="white" />
      <rect x="21" y="21" width="18" height="18" rx="1" fill="#1c1a16" />
      {/* Top-right */}
      <rect x="90" y="10" width="40" height="40" rx="3" fill="#1c1a16" />
      <rect x="96" y="16" width="28" height="28" rx="2" fill="white" />
      <rect x="101" y="21" width="18" height="18" rx="1" fill="#1c1a16" />
      {/* Bottom-left */}
      <rect x="10" y="90" width="40" height="40" rx="3" fill="#1c1a16" />
      <rect x="16" y="96" width="28" height="28" rx="2" fill="white" />
      <rect x="21" y="101" width="18" height="18" rx="1" fill="#1c1a16" />

      {/* ── Data modules ── */}
      {[
        [58,10],[66,10],[74,10],[58,18],[74,18],[66,26],[58,34],[74,34],
        [10,58],[18,58],[26,58],[34,58],[10,66],[26,66],[10,74],[18,74],[34,74],
        [58,58],[66,66],[74,58],[82,66],[74,74],
        [90,58],[98,58],[106,58],[114,66],[90,74],[106,74],
        [58,82],[74,90],[66,98],[58,106],
        [82,90],[90,98],[98,90],[106,98],[114,90],
        [98,106],[114,106],[106,114],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="6" height="6" fill="#1c1a16" />
      ))}
    </svg>
  );
}
