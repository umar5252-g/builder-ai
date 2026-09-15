import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";

const app = express();

await connectToDatabase();

app.use(cors({ origin: process.env.ORIGINS.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app is listning on port: ${port}`);
});

app.get("/", (req, res) => res.send("server is live!"));
app.use("/api/auth", authRouter);
