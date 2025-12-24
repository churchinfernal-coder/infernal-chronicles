// HallucinationMonitor.ts
// Monitors and logs hallucinated or anomalous AI outputs for audit and alerting

import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(__dirname, '../logs/hallucination.log');

export function logHallucination(event: {
  source: string;
  input: string;
  output: string;
  reason: string;
  timestamp?: string;
}) {
  const entry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

export function getHallucinationLog(limit = 100) {
  if (!fs.existsSync(LOG_PATH)) return [];
  const lines = fs.readFileSync(LOG_PATH, 'utf-8').trim().split('\n');
  return lines.slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

export function clearHallucinationLog() {
  if (fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH, '');
}
