const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const AUDIT_LOG = path.join(__dirname, '../../audit.log');

function appendAuditLog(action, details, requestId) {
  const entry = {
    timestamp: new Date().toISOString(),
    requestId,
    action,
    details
  };
  fs.appendFileSync(AUDIT_LOG, JSON.stringify(entry) + '\n');
}

function roleGate(roles = []) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      if (!roles.includes(payload.role)) {
        appendAuditLog('role_gate_denied', { userId: payload.id, role: payload.role, required: roles }, req.headers['x-request-id'] || Date.now().toString());
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch (err) {
      appendAuditLog('role_gate_error', { error: err.message }, req.headers['x-request-id'] || Date.now().toString());
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = { appendAuditLog, roleGate };
