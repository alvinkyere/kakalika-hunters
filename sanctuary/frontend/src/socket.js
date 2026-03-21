import { io } from 'socket.io-client';

// Connects to a local backend if running, otherwise falls back.
export const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:8080' : '/', {
    autoConnect: false // wait for HostPage to call connect() upon Start Session
});
