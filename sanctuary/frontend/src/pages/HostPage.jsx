import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { EVENTS } from '../socketEvents';
import CaptionDisplay from '../components/CaptionDisplay';
import QRCodeComponent from '../components/QRCode';
import SessionControls from '../components/SessionControls';

export default function HostPage() {
  const [phase, setPhase] = useState('idle');
  const [sessionId, setSessionId] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [listenerCount, setListenerCount] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // open the WebSocket connection to the backend
    socket.connect();  

    // Backend says "session created, here's your ID"
    socket.on(EVENTS.SESSION_VALID, ({ sessionId: id }) => {
      setSessionId(id);   // save it — used to build the QR URL
      setPhase('live');  // switch to the live screen
    });

    // Backend sends how many phones are connected
    socket.on(EVENTS.LISTENER_COUNT, ({ count }) => {
      setListenerCount(count);
    });

    // Backend sends caption text — see Part 3 for the logic
    socket.on(EVENTS.CAPTION, ({ text, isFinal }) => {
      setCaptions(prev => {
        if (!isFinal) {
          // Partial: replace the last item if it was also partial
          // This creates the "live typing" effect
          const updated = [...prev];
          if (updated.length > 0 && !updated[updated.length - 1].isFinal) {
            updated[updated.length - 1] = { text, isFinal };  // replace
          } else {
            updated.push({ text, isFinal });  // first partial, add it
          }
          return updated;
        } else {
          // Final: keep only the finalized sentences, add this one
          // Slice to last 8 so screen doesn't fill up forever
          const updated = prev.filter(c => c.isFinal);
          updated.push({ text, isFinal: true });
          return updated.slice(-8);
        }
      });
    });

    // Cleanup: remove listeners when component unmounts
    return () => {
      socket.off(EVENTS.SESSION_VALID);
      socket.off(EVENTS.LISTENER_COUNT);
      socket.off(EVENTS.CAPTION);
    };
  }, []);

  const handleStart = async () => {
    setPhase('starting');

    try {
      // 1. Ask browser for mic access — shows the permission popup
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // mono — AssemblyAI requires this
          sampleRate: 16000,      // 16kHz — AssemblyAI requires this
          echoCancellation: true, // removes room echo
          noiseSuppression: true, // removes background noise
        },
      });
      streamRef.current = stream;  // save so we can stop it later

      // 2. Tell server to create a session room
      socket.emit(EVENTS.START_SESSION);
      // Server responds with SESSION_VALID → our listener above sets phase='live'

      // 3. Set up MediaRecorder to chop audio into chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      // This fires every 250ms with a chunk of audio data
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket.connected) {
          const buffer = await event.data.arrayBuffer(); // convert Blob → binary
          socket.emit(EVENTS.AUDIO_CHUNK, buffer);       // send to backend
        }
      };

      mediaRecorder.start(250);  // 250ms chunks = smooth real-time transcription
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or error starting recording.");
      setPhase('idle');
    }
  };

  const handleEnd = () => {
    mediaRecorderRef.current?.stop();          // stop recording audio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop()); // release the mic
    }
    socket.emit(EVENTS.END_SESSION);             // tell backend — it notifies all phones
    setPhase('ended');
  };

  return (
    <div className="host-page flex flex-col items-center p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-8">Host Dashboard</h1>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {phase === 'idle' || phase === 'ended' ? (
        <button 
          onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-700 text-white text-3xl font-bold py-8 px-16 rounded-full shadow-lg"
        >
          {phase === 'ended' ? 'Restart Session' : 'Start Session'}
        </button>
      ) : phase === 'starting' ? (
        <div className="text-xl">Waiting for server/microphone...</div>
      ) : (
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <SessionControls 
            onEnd={handleEnd} 
            listenerCount={listenerCount} 
          />
          
          <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="flex-1 bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col">
              <CaptionDisplay captions={captions} />
            </div>
            
            <div className="w-full md:w-80 flex flex-col items-center shrink-0 bg-white rounded-xl shadow p-6 border border-gray-100">
              <h3 className="text-xl font-bold mb-4 text-center">Scan to View Captions</h3>
              {sessionId && (
                <QRCodeComponent 
                  sessionId={sessionId} 
                  url={`${window.location.origin}/attendee/${sessionId}`} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}