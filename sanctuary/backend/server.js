
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createSession, getSession, endSession, getAllSessions } = require("./sessions");
const { registerSocketEvents } = require("./socket-events");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const cors = require("cors");
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", activeSessions: getAllSessions().length });
});

// ── REST: create a new session (called by host on "Start session") ────────────
app.post("/api/sessions", (req, res) => {
  const session = createSession();
  res.json({ sessionId: session.id, joinUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/attend/${session.id}` });
});

// ── REST: end a session (called by host on "End session") ─────────────────────
app.delete("/api/sessions/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  // Notify all attendees that the session has ended before destroying it
  io.to(sessionId).emit("session-ended");
  endSession(sessionId);

  res.json({ ok: true });
});



// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  registerSocketEvents(io, socket);

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Sanctuary] Server running on port ${PORT}`);
});
