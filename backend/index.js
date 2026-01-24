import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import mongoDb from "./db/mongoDb.js";

import userRoutes from "./routes/user.routes.js";



dotenv.config();

const app = express();
const httpServer = createServer(app);

const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/game"
});

app.use(
    cors({
        // CHANGE 1: Allow Vite's default port (5173) instead of React's (3000)
        origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// CHANGE 2: Added 'v1' to match the frontend api.js baseURL
// Now your endpoints are like: http://localhost:8000/api/v1/users/register
app.use("/api/v1/users", userRoutes);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

// CHANGE 3: Set default port to 8000 (Common for backends, avoids conflict with frontend)
const PORT = process.env.PORT || 8000;

mongoDb()
    .then(() => {
       

        httpServer.listen(PORT, () => {
            console.log(` Backend running on http://localhost:${PORT}`);
            console.log(` WebSocket server running on ws://localhost:${PORT}/ws/game`);
        });
    })
    .catch((err) => {
        console.error(" Server not started. DB connection failed.", err);
    });