import fs from "fs";
import path from "path";
const logFile = path.join(process.cwd(), "src/logs/audit.log");

export function audit(event, meta = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, meta });
  fs.appendFile(logFile, line + "\n", () => {});
}
