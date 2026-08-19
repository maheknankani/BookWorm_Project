import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req, res) => {
  res.json({ message: "BookWorm API is running" });
});

app.get("/api", (req, res) => {
  res.json({ message: "BookWorm API Endpoint is active", health: "/api/health" });
});

app.get("/api/health", async (req, res) => {
  const isConnected = await connectDB();
  res.json({
    status: "ok",
    database: isConnected ? "connected" : "disconnected",
  });
});

// Middleware to ensure DB connection is ready on serverless requests
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/api" || req.path === "/api/health") {
    return next();
  }
  const isConnected = await connectDB();
  if (!isConnected) {
    return res.status(500).json({
      message: "Database connection failed. Please verify MONGO_URI.",
    });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/notifications", notificationRoutes);

connectDB();

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[Server] BookWorm API & Socket.IO server running on port ${PORT}`);
  });
}

export default app;