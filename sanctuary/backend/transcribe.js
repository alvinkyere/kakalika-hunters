const { AssemblyAI } = require("assemblyai");

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

let transcriber = null;

async function startTranscription(onTranscript) {
  transcriber = client.realtime.transcriber({
    sampleRate: 16000,
    wordBoost: [],
    encoding: "pcm_s16le",
  });

  transcriber.on("open", ({ sessionId }) => {
    console.log(`[AssemblyAI] Session opened: ${sessionId}`);
  });

  transcriber.on("transcript", (transcript) => {
    if (!transcript.text) return;

    const payload = {
      text: transcript.text,
      isFinal: transcript.message_type === "FinalTranscript",
    };

    onTranscript(payload);
  });

  transcriber.on("error", (err) => {
    console.error("[AssemblyAI] Error:", err);
  });

  transcriber.on("close", (code, reason) => {
    console.log(`[AssemblyAI] Session closed (${code}): ${reason}`);
  });

  await transcriber.connect();
  console.log("[AssemblyAI] Connected and ready to receive audio.");
}

function sendAudioChunk(buffer) {
  if (transcriber) {
    transcriber.sendAudio(buffer);
  }
}

async function stopTranscription() {
  if (transcriber) {
    await transcriber.close();
    transcriber = null;
    console.log("[AssemblyAI] Transcription stopped.");
  }
}

module.exports = { startTranscription, sendAudioChunk, stopTranscription };
