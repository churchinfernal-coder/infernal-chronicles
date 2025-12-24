import React, { useState, useEffect, useRef } from "react";

const API = "http://localhost:3000";
const TOKEN = localStorage.getItem("superadmin_jwt") || ""; // Retained for compatibility

const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function AppAIInterface() { 
  // Chat console state 
  const [chatInput, setChatInput] = useState("");
  const [chatStream, setChatStream] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  // Archetype controls
  const [archetypeLoading, setArchetypeLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Advanced controls
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
  const [batching, setBatching] = useState(false);
  const [caching, setCaching] = useState(true);

  // System status
  const [systemStatus, setSystemStatus] = useState({ load: 0, latency: 0, uptime: 0, tokensSec: 0 });
  const [statusError, setStatusError] = useState("");

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsError, setLogsError] = useState("");

  // Hallucination monitoring
  const [hallucinationDetected, setHallucinationDetected] = useState(false);

  // Fetch system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await fetchWithAuth(`${API}/superadmin/metrics`);
        setSystemStatus(data);
        setStatusError("");
      } catch (err) {
        setStatusError("Failed to fetch system status");
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await fetchWithAuth(`${API}/superadmin/logs`);
        setAuditLogs(logs);
        setLogsError("");
      } catch (err) {
        setLogsError("Failed to fetch audit logs");
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatStream]);

  // Chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setIsStreaming(true);
    setHallucinationDetected(false);
    try {
      const res = await fetchWithAuth(`${API}/ai/console`, {
        method: "POST",
        body: JSON.stringify({ message: chatInput, temperature, maxTokens, batching, caching, streaming: isStreaming }),
      });
      // Hallucination monitoring
      if (!res || typeof res.response !== "string" || res.response.match(/(error|fail|notfound|default|hallucination)/i)) {
        setHallucinationDetected(true);
      }
      setChatStream((prev) => [...prev, { role: "user", content: chatInput }, { role: "ai", content: res.response }]);
      setChatInput("");
    } catch (err) {
      setChatStream((prev) => [...prev, { role: "user", content: chatInput }, { role: "ai", content: "[Error: Unable to process]" }]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Archetype controls
  const handleSummonArchetype = async () => {
    setArchetypeLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/ai/archetype/summon`, { method: "POST" });
      setChatStream((prev) => [...prev, { role: "system", content: `Archetype summoned: ${res.name}` }]);
    } catch (err) {
      setChatStream((prev) => [...prev, { role: "system", content: "Failed to summon archetype" }]);
    } finally {
      setArchetypeLoading(false);
    }
  };
  const handleDissectMutation = async () => {
    setMutationLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/ai/mutation/dissect`, { method: "POST" });
      setChatStream((prev) => [...prev, { role: "system", content: `Mutation dissected: ${res.details}` }]);
    } catch (err) {
      setChatStream((prev) => [...prev, { role: "system", content: "Failed to dissect mutation" }]);
    } finally {
      setMutationLoading(false);
    }
  };

  // Advanced controls toggles
  const handleToggle = async (feature, value) => {
    try {
      await fetchWithAuth(`${API}/superadmin/toggle/${feature}`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
      if (feature === "batching") setBatching(value);
      if (feature === "caching") setCaching(value);
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-0 m-0">
      {/* Header / Branding */}
      <header className="py-8 text-center bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--gold))] to-[hsl(var(--primary-glow))] bg-clip-text text-transparent">
        <h1 className="text-5xl font-extrabold tracking-tight" style={{ background: "var(--gradient-crimson)", WebkitBackgroundClip: "text", color: "transparent" }}>
          INFERNAL AI: Advanced Neural Interface
        </h1>
      </header>

      {/* System Status Panel */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card text-foreground shadow-[var(--shadow-crimson)] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">System Status</h2>
          {statusError ? (
            <div className="text-destructive">{statusError}</div>
          ) : (
            <ul className="space-y-1 text-lg">
              <li>Neural Load: <span className="font-mono text-accent">{systemStatus.load}</span></li>
              <li>Latency: <span className="font-mono text-accent">{systemStatus.latency} ms</span></li>
              <li>Uptime: <span className="font-mono text-accent">{systemStatus.uptime} s</span></li>
              <li>Tokens/sec: <span className="font-mono text-accent">{systemStatus.tokensSec}</span></li>
            </ul>
          )}
        </div>
        <div className="bg-card text-foreground shadow-[var(--shadow-crimson)] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-2">Advanced Controls</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold">Temperature</label>
              <input type="range" min="0" max="1" step="0.01" value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-32 accent-[hsl(var(--primary))]" />
              <span className="font-mono">{temperature}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold">Max Tokens</label>
              <input type="number" min="1" max="4096" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="w-24 bg-input border border-border rounded px-2" />
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold">Batching</label>
              <button className={`px-3 py-1 rounded ${batching ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => handleToggle("batching", !batching)}>{batching ? "Enabled" : "Disabled"}</button>
              <label className="font-semibold">Caching</label>
              <button className={`px-3 py-1 rounded ${caching ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => handleToggle("caching", !caching)}>{caching ? "Enabled" : "Disabled"}</button>
              <label className="font-semibold">Streaming</label>
              <button className={`px-3 py-1 rounded ${isStreaming ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => setIsStreaming(!isStreaming)}>{isStreaming ? "Enabled" : "Disabled"}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Console */}
      <section className="max-w-4xl mx-auto mb-8">
        <div className="bg-card rounded-xl shadow-[var(--shadow-crimson-lg)] p-6 border border-border">
          <h2 className="text-2xl font-bold mb-4">Chat Console</h2>
          <div className="overflow-y-auto max-h-64 mb-4 border border-[hsl(var(--primary))] rounded-lg p-3" style={{ boxShadow: "0 0 12px hsl(var(--primary-glow))" }}>
            {chatStream.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.role === "ai" ? "text-accent" : msg.role === "system" ? "text-gold" : "text-foreground"}`}>
                <span className="font-bold mr-2">{msg.role.toUpperCase()}:</span>
                <span>{msg.content}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-input border border-border rounded px-3 py-2 text-lg"
              placeholder="Whisper to the Engine..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={isStreaming}
              autoFocus
            />
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded shadow-[var(--shadow-crimson)] font-bold text-lg" disabled={isStreaming}>
              Send
            </button>
          </form>
          {hallucinationDetected && (
            <div className="mt-2 text-destructive font-bold">Possible hallucination detected in AI output.</div>
          )}
        </div>
      </section>

      {/* Archetype Controls */}
      <section className="max-w-4xl mx-auto mb-8 grid grid-cols-2 gap-6">
        <button
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-primary-foreground font-bold py-3 rounded-xl shadow-[var(--shadow-gold)] hover:scale-105 transition"
          onClick={handleSummonArchetype}
          disabled={archetypeLoading}
        >
          {archetypeLoading ? "Summoning..." : "Summon Archetype"}
        </button>
        <button
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-primary-foreground font-bold py-3 rounded-xl shadow-[var(--shadow-gold)] hover:scale-105 transition"
          onClick={handleDissectMutation}
          disabled={mutationLoading}
        >
          {mutationLoading ? "Dissecting..." : "Dissect Mutation"}
        </button>
      </section>

      {/* Audit Log Viewer */}
      <section className="max-w-4xl mx-auto mb-8">
        <div className="bg-card rounded-xl shadow-[var(--shadow-crimson)] p-6 border border-border">
          <h2 className="text-2xl font-bold mb-4">Audit Log Viewer</h2>
          {logsError ? (
            <div className="text-destructive">{logsError}</div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              <ul className="divide-y divide-border">
                {auditLogs.map((log, idx) => (
                  <li key={idx} className="p-3 hover:bg-muted transition cursor-pointer text-sm text-muted-foreground border-b border-border">
                    <span className="font-mono text-accent">[{log.timestamp}]</span> <span className="ml-2">{log.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
