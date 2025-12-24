import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const logFile = path.join(process.cwd(), "src/logs/audit.log");
let toggles = { streaming: true, caching: true };

// --- Superadmin credentials (replace with env vars in production) ---
const SUPERADMIN = {
  username: process.env.SUPERADMIN_USER || "root",
  password: process.env.SUPERADMIN_PASS || "infernal"
};

// --- LOGIN ---
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === SUPERADMIN.username && password === SUPERADMIN.password) {
    return res.json({ ok: true, token: "superadmin-token" });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

// --- LOGS ---
router.get("/logs", (req, res) => {
  if (!fs.existsSync(logFile)) return res.json([]);
  const lines = fs.readFileSync(logFile, "utf-8").trim().split("\n");
  res.json(lines.slice(-200).map(l => JSON.parse(l)));
});

// --- METRICS ---
router.get("/metrics", (req, res) => {
  res.json({
    uptime: process.uptime(),
    mem: process.memoryUsage(),
    toggles,
    ts: new Date().toISOString(),
  });
});

// --- TOGGLE ---
router.post("/toggle/:feature", (req, res) => {
  const { feature } = req.params;
  if (!(feature in toggles)) return res.status(400).json({ error: "Unknown feature" });
  toggles[feature] = !toggles[feature];
  res.json({ feature, enabled: toggles[feature] });
});

export default router;

