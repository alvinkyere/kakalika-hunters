import { QRCodeSVG } from "qrcode.react";

export default function QRCode({ size = 140, faded = false, url = "" }) {
  if (!url) {
    return (
      <div style={{ width: size, height: size, opacity: 0.2, background: "#eee", borderRadius: 8 }} />
    );
  }

  return (
    <div style={{ opacity: faded ? 0.2 : 1 }}>
      <QRCodeSVG
        value={url}
        size={size}
        bgColor="#ffffff"
        fgColor="#1c1a16"
        level="M"
      />
    </div>
  );
}
