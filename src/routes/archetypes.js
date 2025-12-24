import { Router } from "express";
import { audit } from "../lib/audit.js";
import { broadcast } from "../lib/bus.js";

const router = Router();

router.post("/summon", (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "Missing name" });
  const payload = { name, status: "summoned" };
  audit("archetype.summon", payload);
  broadcast({ type: "archetype", payload });
  res.json(payload);
});

router.post("/dissect", (req, res) => {
  const { target } = req.body || {};
  if (!target) return res.status(400).json({ error: "Missing target" });
  const payload = { target, status: "dissected" };
  audit("archetype.dissect", payload);
  broadcast({ type: "archetype", payload });
  res.json(payload);
});

export default router;
