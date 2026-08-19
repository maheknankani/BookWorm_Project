import { io } from "socket.io-client";
import { API_URL } from "../constants/api";

// Derive Socket URL from API_URL (removing /api at the end)
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket.IO Client] Connected with id:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO Client] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.log("[Socket.IO Client] Connection error:", error.message);
    });
  }

  return socket;
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit("join_user_room", { userId });
  }
};

export const joinSessionRoom = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit("join_session", { sessionId });
  }
};

export const leaveSessionRoom = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit("leave_session", { sessionId });
  }
};

export const emitProgressUpdate = (data) => {
  const s = getSocket();
  if (s) {
    s.emit("update_progress", data);
  }
};
