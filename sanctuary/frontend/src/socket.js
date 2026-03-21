import { io } from "socket.io-client";

const socket = io("https://kakalika-hunters.onrender.com", {
  autoConnect: true,
});

export default socket;
