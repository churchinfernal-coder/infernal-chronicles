import { Router } from "express";
import { audit } from "../lib/audit.js";
import { broadcast } from "../lib/bus.js";

const router = Router();

function processMessage(text, opts = {}) {
  const base = text.trim();
  if (!base) return { error: "Empty input" };
  if (base.startsWith("summon:")) return { result: `Archetype summoned: ${base.slice(7).trim()}` };
  if (base.startsWith("dissect:")) return { result: `Mutation dissected: ${base.slice(8).trim()}` };
  const maxTokens = Math.min(Number(opts.maxTokens ?? 256), 4096);
  const temperature = Number(opts.temperature ?? 0.7).toFixed(2);
  return { result: `Echo(${temperature}, ${maxTokens}): ${base}` };
}

router.post("/send", (req, res) => {
  const { text, options } = req.body || {};
  const out = processMessage(text ?? "", options);
  audit("chat.send", { text, out });
  broadcast({ type: "chat", payload: { text, out } });
  res.json(out);
});

export default router;
