import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url, sessionId }) {
    return (
        <div className="qr-card">
            <p className="qr-label">Scan to follow along</p>
            <div className="qr-code-wrapper">
                <QRCodeSVG
                    value={url}
                    size={160}
                    bgColor="transparent"
                    fgColor="currentColor"
                    level="M"
                />
            </div>
            <p className="qr-session-id">Session: {sessionId}</p>
            <p className="qr-url">{url}</p>
        </div>
    );
}