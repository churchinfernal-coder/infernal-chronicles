const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, '../../logs/audit.log');

function auditLogger(req, res, next) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id || null,
    route: req.originalUrl,
    method: req.method,
    action: req.method + ' ' + req.originalUrl
  };
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  next();
}

module.exports = auditLogger;
