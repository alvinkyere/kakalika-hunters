// pages/HostPage.jsx
// The laptop-facing dashboard. Lets the AV volunteer start/end a session,
// choose the audio source, watch the live transcript, and monitor listeners.
//
// Socket events wired here:
//   emit  → host:start-session, host:end-session, host:set-audio-source
//   on    → session:created, caption:update, session:listener-count, session:lang-counts

import { useState, useEffect, useRef } from "react";
import SanctuaryLogo from "../components/SanctuaryLogo";
import QRCode from "../components/QRCode";
import {
  registerHostEvents,
  emitStartSession,
  emitEndSession,
  emitSetAudioSource,
} from "../socketEvents";
import "../styles/host.css";

// ── Demo caption stream (remove once AssemblyAI backend is wired) ─────────────
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

const LANG_IDS = ["en", "es", "fr", "ko", "zh", "ht"];
const LANG_LABELS = {
  en: "English", es: "Español", fr: "Français",
  ko: "한국어", zh: "普通话", ht: "Kreyòl Ayisyen",
};
const LISTENER_RATIO = { en: 0.6, es: 0.15, fr: 0.08, ko: 0.06, zh: 0.08, ht: 0.03 };

export default function HostPage() {
  const [sessionActive, setSessionActive]   = useState(false);
  const [sessionCode,   setSessionCode]     = useState(null);
  const [audioSource,   setAudioSource]     = useState("xlr");
  const [transcript,    setTranscript]      = useState([]);
  const [listenerCount, setListenerCount]   = useState(0);
  const [langCounts,    setLangCounts]      = useState({ en: 0, es: 0, fr: 0, ko: 0, zh: 0, ht: 0 });
  const [duration,      setDuration]        = useState(0);
  const [wordCount,     setWordCount]       = useState(0);

  const durationRef = useRef(null);
  const captionRef  = useRef(null);
  const captionIdx  = useRef(0);

  // ── Socket event handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = registerHostEvents({
      onSessionCreated: ({ sessionCode: code }) => {
        setSessionCode(code);
        setSessionActive(true);
      },
      onCaptionUpdate: ({ text }) => pushCaption(text),
      onListenerCount: (count)   => setListenerCount(count),
      onLangCounts:    (counts)  => setLangCounts(counts),
      onSessionEnded:  ()        => resetSession(),
    });
    return cleanup;
  }, []);

  // ── Demo mode: simulate captions + listener growth ─────────────────────────
  // DELETE this block once the real backend emits CAPTION_UPDATE events.
  useEffect(() => {
    if (!sessionActive) return;

    let localListeners = 1;
    const listenerMilestones = [
      { at: 5,  n: 5  },
      { at: 12, n: 8  },
      { at: 20, n: 11 },
      { at: 35, n: 14 },
    ];

    durationRef.current = setInterval(() => {
      setDuration((d) => {
        const next = d + 1;
        const milestone = listenerMilestones.find((m) => m.at === next);
        if (milestone) {
          localListeners = milestone.n;
          setListenerCount(milestone.n);
          const newCounts = {};
          LANG_IDS.forEach((code) => {
            newCounts[code] = Math.max(code === "en" ? 1 : 0, Math.floor(milestone.n * LISTENER_RATIO[code]));
          });
          setLangCounts(newCounts);
        }
        return next;
      });
    }, 1000);

    captionRef.current = setInterval(() => {
      const text = DEMO_CAPTIONS[captionIdx.current % DEMO_CAPTIONS.length];
      captionIdx.current++;
      pushCaption(text);
    }, 3800);

    return () => {
      clearInterval(durationRef.current);
      clearInterval(captionRef.current);
    };
  }, [sessionActive]);

  function pushCaption(text) {
    setWordCount((w) => w + text.split(" ").length);
    setTranscript((prev) => [...prev.slice(-4), text]);
  }

  // ── Session controls ───────────────────────────────────────────────────────
  function startSession() {
    // In real app: emitStartSession(audioSource)
    // For demo, we fake the server ack:
    setSessionCode("A7F2");
    setSessionActive(true);
  }

  function endSession() {
    // In real app: emitEndSession(sessionCode)
    resetSession();
  }

  function resetSession() {
    setSessionActive(false);
    setSessionCode(null);
    setTranscript([]);
    setListenerCount(0);
    setWordCount(0);
    setDuration(0);
    setLangCounts({ en: 0, es: 0, fr: 0, ko: 0, zh: 0, ht: 0 });
    captionIdx.current = 0;
  }

  function handleAudioSource(src) {
    setAudioSource(src);
    if (sessionActive) emitSetAudioSource(src);
  }

  // ── Duration formatting ────────────────────────────────────────────────────
  const durationLabel = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;
  const activeLangs   = Object.values(langCounts).filter(Boolean).length;
  const joinUrl       = sessionCode ? `sanctuary.app/join/${sessionCode}` : "sanctuary.app/join/—";

  return (
    <div className="host-page">
      {/* ── Header ── */}
      <header className="host-header">
        <SanctuaryLogo size="md" />
        <div className={`session-badge${sessionActive ? " live" : ""}`}>
          <span className="badge-dot" />
          {sessionActive ? `Session live · ${sessionCode}` : "No active session"}
        </div>
      </header>

      <div className="host-body">
        {/* ── Main panel ── */}
        <main className="host-main">

          {/* Session control */}
          <div>
            <div className="section-label">Session control</div>
            <div className="start-area">
              <button
                className={`start-btn${sessionActive ? " end-btn" : ""}`}
                onClick={sessionActive ? endSession : startSession}
              >
                <span className="start-btn-icon">
                  {sessionActive
                    ? <svg width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" rx="1" fill="white"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="3,2 10,6 3,10" fill="white"/></svg>
                  }
                </span>
                {sessionActive ? "End session" : "Start session"}
              </button>
              <p className="start-hint">
                {sessionActive
                  ? "Session is active. Audio is being transcribed and streamed to all connected attendees. Click to end."
                  : "Click to begin capturing audio. A QR code will appear for attendees to scan. Nothing is saved."
                }
              </p>
            </div>
          </div>

          {/* Audio source */}
          <div>
            <div className="section-label">Audio source</div>
            <div className="audio-source-row">
              {[
                { id: "mic", title: "Laptop microphone", desc: "Works anywhere, no setup needed" },
                { id: "xlr", title: "Soundboard feed",   desc: "Recommended — direct from PA system" },
                { id: "usb", title: "USB microphone",    desc: "Dedicated mic at podium or altar" },
              ].map(({ id, title, desc }) => (
                <div
                  key={id}
                  className={`audio-opt${audioSource === id ? " selected" : ""}`}
                  onClick={() => handleAudioSource(id)}
                >
                  <div className="audio-opt-title">{title}</div>
                  <div className="audio-opt-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live transcript */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div className="section-label">Live transcript</div>
            <div className="transcript-box">
              <div className="transcript-lines">
                {transcript.length === 0 ? (
                  <p className="transcript-empty">
                    Transcript will appear here once the session begins.
                  </p>
                ) : (
                  transcript.map((line, i) => (
                    <p
                      key={i}
                      className={`transcript-line${i === transcript.length - 1 ? " current" : ""}`}
                    >
                      {line}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {sessionActive && (
            <div className="stats-row">
              {[
                { num: listenerCount, label: "Listeners" },
                { num: durationLabel, label: "Duration" },
                { num: wordCount,     label: "Words spoken" },
                { num: activeLangs,   label: "Languages active" },
              ].map(({ num, label }) => (
                <div key={label} className="stat-card">
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── Sidebar ── */}
        <aside className="host-sidebar">

          {/* QR code */}
          <div>
            <div className="section-label">Attendee QR code</div>
            <div className="qr-card">
              <div className="qr-frame">
                <QRCode size={140} faded={!sessionActive} />
              </div>
              <p className="qr-caption">
                Attendees scan this to follow along on their phone
              </p>
              <span className="qr-url">{joinUrl}</span>
            </div>
          </div>

          {/* Language counts */}
          <div>
            <div className="section-label">Active languages</div>
            <div className="lang-checklist">
              {LANG_IDS.map((code) => {
                const count = langCounts[code] ?? 0;
                return (
                  <div key={code} className="lang-row">
                    <span className="lang-name">{LANG_LABELS[code]}</span>
                    <span className={`lang-count${count > 0 ? " has-users" : ""}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy note */}
          <div className="privacy-note">
            <strong>No data is stored.</strong> When this session ends, the
            transcript is gone. No recordings, no database — Sanctuary serves
            the moment, not an archive.
          </div>

        </aside>
      </div>
    </div>
  );
}
