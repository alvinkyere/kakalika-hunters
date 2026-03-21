import { useState, useEffect, useRef } from "react";
import SanctuaryLogo from "../components/SanctuaryLogo";
import QRCode from "../components/QRCode";
import { registerHostEvents, emitHostSession } from "../socketEvents";
import socket from "../socket";
import "../styles/host.css";

const LANG_IDS = ["en", "es", "fr", "ko", "zh", "ht"];
const LANG_LABELS = { en: "English", es: "Español", fr: "Français", ko: "한국어", zh: "普通话", ht: "Kreyòl Ayisyen" };

export default function HostPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId,     setSessionId]     = useState(null);
  const [audioSource,   setAudioSource]   = useState("mic");
  const [transcript,    setTranscript]    = useState([]);
  const [listenerCount, setListenerCount] = useState(0);
  const [langCounts,    setLangCounts]    = useState({ en:0, es:0, fr:0, ko:0, zh:0, ht:0 });
  const [duration,      setDuration]      = useState(0);
  const [wordCount,     setWordCount]     = useState(0);
  const [error,         setError]         = useState(null);
  const [phase,         setPhase]         = useState("idle");

  const durationRef    = useRef(null);
  const recognitionRef = useRef(null);
  const sessionIdRef   = useRef(null);

  useEffect(() => {
    const cleanup = registerHostEvents({
      onCaptionUpdate: ({ text }) => {
        console.log("[Host] caption received:", text);
        setWordCount((w) => w + text.split(" ").length);
        setTranscript((prev) => [...prev.slice(-4), text]);
      },
      onSessionStats: (stats) => {
        setListenerCount(stats.attendeeCount);
        const counts = { en:0, es:0, fr:0, ko:0, zh:0, ht:0 };
        Object.entries(stats.languageCounts || {}).forEach(([lang, count]) => {
          const key = lang.toLowerCase();
          if (key in counts) counts[key] = count;
        });
        setLangCounts(counts);
      },
      onSessionEnded: () => resetSession(),
      onSessionError: ({ message }) => { setError(message); setPhase("idle"); },
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(durationRef.current);
  }, [sessionActive]);

  async function startSession() {
    setError(null);
    setPhase("starting");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Use Chrome — Safari does not support speech recognition.");
      setPhase("idle");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/sessions", { method: "POST" });
      const { sessionId: id } = await res.json();
      setSessionId(id);
      sessionIdRef.current = id;
      console.log("[Host] Session created:", id);

      emitHostSession(id);

      const recognition = new SpeechRecognition();
      recognition.continuous     = true;
      recognition.interimResults = true;
      recognition.lang           = "en-US";
      recognitionRef.current     = recognition;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text    = event.results[i][0].transcript.trim();
          const isFinal = event.results[i].isFinal;
          console.log("[Speech] text:", text, "final:", isFinal, "sessionId:", sessionIdRef.current);
          if (!text) continue;
          socket.emit("new-transcript", { sessionId: sessionIdRef.current, text, isFinal });
        }
      };

      recognition.onerror = (event) => {
        console.error("[Speech] Error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone access denied.");
          stopSession();
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current && sessionIdRef.current) {
          recognition.start();
        }
      };

      recognition.start();
      setSessionActive(true);
      setPhase("live");

    } catch (err) {
      console.error(err);
      setError("Could not start session. Make sure the backend is running.");
      setPhase("idle");
    }
  }

  async function stopSession() {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (sessionIdRef.current) {
      await fetch(`http://localhost:4000/api/sessions/${sessionIdRef.current}`, { method: "DELETE" });
    }
    resetSession();
  }

  function resetSession() {
    clearInterval(durationRef.current);
    sessionIdRef.current = null;
    setSessionActive(false);
    setSessionId(null);
    setTranscript([]);
    setListenerCount(0);
    setWordCount(0);
    setDuration(0);
    setLangCounts({ en:0, es:0, fr:0, ko:0, zh:0, ht:0 });
    setPhase("idle");
  }

  const durationLabel = `${Math.floor(duration/60)}:${String(duration%60).padStart(2,"0")}`;
  const activeLangs   = Object.values(langCounts).filter(Boolean).length;
  const joinUrl       = sessionId ? `${window.location.origin}/join?session=${sessionId}` : "Start a session to generate a link";

  return (
    <div className="host-page">
      <header className="host-header">
        <SanctuaryLogo size="md" />
        <div className={`session-badge${sessionActive ? " live" : ""}`}>
          <span className="badge-dot" />
          {sessionActive ? `Session live · ${sessionId?.slice(0,8)}` : "No active session"}
        </div>
      </header>

      <div className="host-body">
        <main className="host-main">
          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"0.75rem 1rem", fontSize:"0.85rem", color:"#991b1b" }}>
              {error}
            </div>
          )}

          <div>
            <div className="section-label">Session control</div>
            <div className="start-area">
              <button
                className={`start-btn${sessionActive ? " end-btn" : ""}`}
                onClick={sessionActive ? stopSession : startSession}
                disabled={phase === "starting"}
              >
                <span className="start-btn-icon">
                  {sessionActive
                    ? <svg width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" rx="1" fill="white"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="3,2 10,6 3,10" fill="white"/></svg>
                  }
                </span>
                {phase === "starting" ? "Starting…" : sessionActive ? "End session" : "Start session"}
              </button>
              <p className="start-hint">
                {sessionActive
                  ? "Listening via browser microphone. Speak clearly."
                  : "Click to begin. Allow mic access when Chrome asks."
                }
              </p>
            </div>
          </div>

          <div>
            <div className="section-label">Audio source</div>
            <div className="audio-source-row">
              {[
                { id:"mic", title:"Laptop microphone", desc:"Works anywhere, no setup needed" },
                { id:"xlr", title:"Soundboard feed",   desc:"Plug in via USB audio interface" },
                { id:"usb", title:"USB microphone",    desc:"Dedicated mic at podium or altar" },
              ].map(({ id, title, desc }) => (
                <div key={id} className={`audio-opt${audioSource===id?" selected":""}`} onClick={() => setAudioSource(id)}>
                  <div className="audio-opt-title">{title}</div>
                  <div className="audio-opt-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:".75rem" }}>
            <div className="section-label">Live transcript</div>
            <div className="transcript-box">
              <div className="transcript-lines">
                {transcript.length === 0 ? (
                  <p className="transcript-empty">
                    {sessionActive ? "Listening… start speaking into the microphone." : "Transcript will appear here once the session begins."}
                  </p>
                ) : (
                  transcript.map((line, i) => (
                    <p key={i} className={`transcript-line${i===transcript.length-1?" current":""}`}>{line}</p>
                  ))
                )}
              </div>
            </div>
          </div>

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

        <aside className="host-sidebar">
          <div>
            <div className="section-label">Attendee QR code</div>
            <div className="qr-card">
              <div className="qr-frame"><QRCode size={140} faded={!sessionActive} /></div>
              <p className="qr-caption">Attendees scan this to follow along on their phone</p>
              <span className="qr-url" style={{ wordBreak:"break-all", textAlign:"center", fontSize:"0.65rem" }}>{joinUrl}</span>
            </div>
          </div>

          <div>
            <div className="section-label">Active languages</div>
            <div className="lang-checklist">
              {LANG_IDS.map((code) => {
                const count = langCounts[code] ?? 0;
                return (
                  <div key={code} className="lang-row">
                    <span className="lang-name">{LANG_LABELS[code]}</span>
                    <span className={`lang-count${count>0?" has-users":""}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="privacy-note">
            <strong>No data is stored.</strong> When this session ends, the transcript is gone. No recordings, no database.
          </div>
        </aside>
      </div>
    </div>
  );
}
