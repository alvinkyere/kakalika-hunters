// pages/ProjectionPage.jsx
// Full-screen caption display projected at the front of the church.
// No user interaction — purely a receiver.
//
// Socket events wired here:
//   on → caption:update, session:ended

import { useState, useEffect } from "react";
import SanctuaryLogo from "../components/SanctuaryLogo";
import QRCode from "../components/QRCode";
import CaptionDisplay from "../components/CaptionDisplay";
import { registerAttendeeEvents } from "../socketEvents";
import "../styles/projection.css";

// ── Demo stream (remove once backend is live) ─────────────────────────────────
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

export default function ProjectionPage() {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState("Waiting for session to begin…");

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = registerAttendeeEvents({
      onCaptionUpdate: ({ text }) => receiveCaption(text),
      onSessionEnded:  ()         => setCurrent("Session has ended."),
    });
    return cleanup;
  }, []);

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // DELETE once backend is wired.
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      receiveCaption(DEMO_CAPTIONS[idx % DEMO_CAPTIONS.length]);
      idx++;
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  function receiveCaption(text) {
    setCurrent(text);
    setHistory((prev) => [...prev.slice(-3), text]);
  }

  return (
    <div className="projection-page">
      {/* ── Top bar ── */}
      <header className="projection-header">
        <SanctuaryLogo dark size="sm" />
        <div className="proj-live-pill">
          <span className="proj-live-dot" />
          Live captions
        </div>
      </header>

      <div className="projection-body">
        {/* ── Captions (left) ── */}
        <CaptionDisplay
          variant="projection"
          history={history}
          current={current}
        />

        {/* ── QR sidebar (right) ── */}
        <aside className="proj-sidebar">
          <p className="proj-qr-label">Follow along on your phone</p>
          <div className="proj-qr-box">
            <QRCode size={160} />
          </div>
          <div className="proj-lang-pills">
            {["English","Español","Français","한국어","普通话","Kreyòl"].map((l) => (
              <span key={l} className="proj-lang-pill">{l}</span>
            ))}
          </div>
          <p className="proj-qr-sub">
            sanctuary.app/join/A7F2<br />No app needed
          </p>
        </aside>
      </div>
    </div>
  );
}
