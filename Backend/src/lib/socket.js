import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user's personal room for notifications
    socket.on("join_user_room", (data) => {
      const userId = typeof data === "string" ? data : data?.userId;
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join a Read Together session room
    socket.on("join_session", (data) => {
      const sessionId = typeof data === "string" ? data : data?.sessionId;
      if (sessionId) {
        socket.join(`session_${sessionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined session_${sessionId}`);
      }
    });

    // Leave a Read Together session room
    socket.on("leave_session", (data) => {
      const sessionId = typeof data === "string" ? data : data?.sessionId;
      if (sessionId) {
        socket.leave(`session_${sessionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left session_${sessionId}`);
      }
    });

    // Real-time progress update event from client
    socket.on("update_progress", (data) => {
      const { sessionId, userId, username, currentPage, totalPages, progressPercentage } = data;
      if (sessionId) {
        io.to(`session_${sessionId}`).emit("progress_updated", {
          sessionId,
          userId,
          username,
          currentPage,
          totalPages,
          progressPercentage,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;
