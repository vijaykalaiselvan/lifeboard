import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import financeRoutes from "./routes/finance.js";
import taskRoutes from "./routes/tasks.js";
import noteRoutes from "./routes/notes.js";
import habitRoutes from "./routes/habits.js";
import goalRoutes from "./routes/goals.js";
import dashboardRoutes from "./routes/dashboard.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

// All routes below require a valid JWT
app.use("/api/auth/me", requireAuth);
app.use("/api/finance", requireAuth, financeRoutes);
app.use("/api/tasks", requireAuth, taskRoutes);
app.use("/api/notes", requireAuth, noteRoutes);
app.use("/api/habits", requireAuth, habitRoutes);
app.use("/api/goals", requireAuth, goalRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
