import React from 'react';
import { QRCodeSVG } from 'qrcode.react';  // npm package, no API key needed

export default function QRCode({ url, sessionId }) {
  return (
    <div className="qr-card">
      <p className="qr-label">Scan to follow along</p>
      <div className="qr-code-wrapper">
        <QRCodeSVG
          value={url}          /* the URL encoded into the QR — e.g. /join/ABC12345 */
          size={160}           /* px — big enough to scan from across a table */
          bgColor="transparent" /* matches dark background */
          fgColor="currentColor" /* inherits CSS color = white in dark mode */
          level="M"           /* error correction level (M = medium, good balance) */
        />
      </div>
      <p className="qr-session-id">Session: {sessionId}</p>
      <p className="qr-url">{url}</p>  {/* shown for people who can't scan */}
    </div>
  );
}
