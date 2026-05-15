import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import financeRoutes from "./routes/finance.js";
import taskRoutes from "./routes/tasks.js";
import noteRoutes from "./routes/notes.js";
import habitRoutes from "./routes/habits.js";
import goalRoutes from "./routes/goals.js";
import dashboardRoutes from "./routes/dashboard.js";
import { requireAuth } from "./middleware/auth.js";
import { requireProfile } from "./middleware/profile.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

// Profile management — auth only, no active profile needed
app.use("/api/auth/me", requireAuth);
app.use("/api/profiles", requireAuth, profileRoutes);

// All data routes — require both a valid JWT and an owned profile
app.use("/api/finance",   requireAuth, requireProfile, financeRoutes);
app.use("/api/tasks",     requireAuth, requireProfile, taskRoutes);
app.use("/api/notes",     requireAuth, requireProfile, noteRoutes);
app.use("/api/habits",    requireAuth, requireProfile, habitRoutes);
app.use("/api/goals",     requireAuth, requireProfile, goalRoutes);
app.use("/api/dashboard", requireAuth, requireProfile, dashboardRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
