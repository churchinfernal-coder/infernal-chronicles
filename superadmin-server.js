const http = require("http");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0"; // Binds to all interfaces by default

const server = http.createServer((req, res) => {
    console.log("Request:", req.method, req.url);

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.url === "/superadmin/logs" && req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            logs: [
                "Emergency superadmin access activated",
                "Timestamp: " + new Date().toISOString(),
                "Status: SYSTEM ONLINE"
            ]
        }));
    }
    else if (req.url === "/superadmin/metrics" && req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            users: 142,
            active_sessions: 23,
            performance: "98%",
            system_status: "OPERATIONAL"
        }));
    }
    else if (req.url === "/admin" && req.method === "GET") {
        res.setHeader("Content-Type", "text/html");
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>SUPERADMIN CONTROL PANEL - EMERGENCY ACCESS</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #d40000; }
                    a { display: inline-block; margin: 10px; padding: 10px 20px; background: #007cba; color: white; text-decoration: none; border-radius: 5px; }
                    a:hover { background: #005a87; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚨 EMERGENCY SUPERADMIN DASHBOARD</h1>
                    <p><strong>Full system control restored</strong></p>
                    <div>
                        <a href="/superadmin/logs" target="_blank">System Logs</a>
                        <a href="/superadmin/metrics" target="_blank">Performance Metrics</a>
                        <a href="/system/backend/admin" target="_blank">Backend Admin</a>
                    </div>
                    <p>Your superadmin privileges are now active</p>
                </div>
            </body>
            </html>
        `);
    }
    else if (req.url === "/system/backend/admin" && req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            message: "Backend admin system accessible",
            status: "ACTIVE",
            access_level: "SUPERADMIN"
        }));
    }
    else {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ 
            message: "Emergency API Server Running",
            available_routes: [
                "/admin - Superadmin Dashboard",
                "/superadmin/logs - System Logs", 
                "/superadmin/metrics - Performance Metrics",
                "/system/backend/admin - Backend Admin"
            ]
        }));
    }
});

server.listen(PORT, HOST, () => {
    console.log("  EMERGENCY SUPERADMIN SERVER RUNNING");
    console.log(`  Listening on http://${HOST}:${PORT}`);
    console.log("  Dashboard: /admin");
    console.log("  Logs: /superadmin/logs");
    console.log("  Metrics: /superadmin/metrics");
});

// Handle errors
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        const fallbackPort = PORT + 1;
        console.log(`Port ${PORT} busy. Trying port ${fallbackPort}...`);
        server.listen(fallbackPort, HOST);
    } else {
        console.log("Server error:", err);
    }
});
