import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchSessions, postSession, sampleSessions } from "./api";

function scoreClass(score) {
  if (score < 0.4) return "score-ok";
  if (score <= 0.7) return "score-warn";
  return "score-bad";
}

function formatTs(ts) {
  return new Date(ts * 1000).toLocaleString();
}

function durationSec(session) {
  return Math.max(0, session.ended_at - session.started_at);
}

function timelinePercent(session, ts) {
  const total = Math.max(1, session.ended_at - session.started_at);
  return ((ts - session.started_at) / total) * 100;
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  const loadSessions = async () => {
    try {
      setError("");
      const data = await fetchSessions();
      setSessions(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].session_id);
      }
      if (selectedId && !data.some((s) => s.session_id === selectedId)) {
        setSelectedId(data[0]?.session_id ?? null);
      }
    } catch (err) {
      setError(err.message || "Unable to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const timer = setInterval(loadSessions, 10000);
    return () => clearInterval(timer);
  }, []);

  const selected = useMemo(
    () => sessions.find((s) => s.session_id === selectedId) ?? sessions[0],
    [sessions, selectedId]
  );

  const chartData = useMemo(() => {
    return [...sessions]
      .sort((a, b) => a.started_at - b.started_at)
      .map((s) => ({
        session_id: s.session_id,
        started_at: s.started_at,
        drift_score: s.drift_score,
        severity: scoreClass(s.drift_score),
      }));
  }, [sessions]);

  const onTrendPointClick = (point) => {
    const nextId = point?.session_id ?? point?.payload?.session_id;
    if (nextId) {
      setSelectedId(nextId);
    }
  };

  const seedData = async () => {
    console.log("Seeding sample data...");
    setSeeding(true);
    setError("");
    try {
      const existingIds = new Set(sessions.map((s) => s.session_id));
      const now = Date.now();
      const pending = sampleSessions().map((item, idx) => {
        if (!existingIds.has(item.session_id)) {
          existingIds.add(item.session_id);
          return item;
        }

        const nextId = `${item.session_id}-${now}-${idx}`;
        existingIds.add(nextId);
        return {
          ...item,
          session_id: nextId,
        };
      });
      const failures = [];
      for (const item of pending) {
        try {
          await postSession(item);
        } catch (err) {
          const message = String(err?.message || "");
          const isDuplicate = message.toLowerCase().includes("already exists");
          if (!isDuplicate) {
            failures.push(`${item.session_id}: ${message || "unknown error"}`);
          }
        }
      }
      
      if (failures.length > 0) {
        console.error("Failed to seed some sessions:", failures);
        throw new Error(`Failed to seed some sessions (${failures.length}). ${failures[0]}`);
      }

      await loadSessions();
    } catch (err) {
      console.error("Error seeding sample data:", err);
      setError(err.message || "Failed to seed sample data");
    } finally {
      console.log("Seeding complete.");
      setSeeding(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sploink</p>
          <h1>Drift Timeline Dashboard</h1>
        </div>
        <button onClick={seedData} disabled={seeding}>
          {seeding ? "Loading..." : "Load sample data"}
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="trend-card">
        <h2>Drift Trend</h2>
        <div className="trend-wrap">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#2c344a" />
              <XAxis
                dataKey="started_at"
                tickFormatter={(v) => new Date(v * 1000).toLocaleTimeString()}
                stroke="#9eaad1"
              />
              <YAxis domain={[0, 1]} stroke="#9eaad1" />
              <Tooltip
                contentStyle={{ background: "#101729", border: "1px solid #2a3554" }}
                labelFormatter={(v) => formatTs(Number(v))}
              />
              <Line type="monotone" dataKey="drift_score" stroke="#6dd5ed" strokeWidth={2} dot={false} />
              <Scatter
                data={chartData}
                dataKey="drift_score"
                onClick={onTrendPointClick}
                shape={(props) => {
                  const cls = props.payload.severity;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      className={`point ${cls}`}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <main className="content-grid">
        <aside className="session-list">
          <h2>Sessions</h2>
          {loading ? <p>Loading sessions...</p> : null}
          {sessions.map((s) => (
            <button
              key={s.session_id}
              className={`session-row ${selected?.session_id === s.session_id ? "selected" : ""}`}
              onClick={() => setSelectedId(s.session_id)}
            >
              <div>
                <p className="agent">{s.agent}</p>
                <p className="timestamp">{formatTs(s.started_at)}</p>
              </div>
              <p className={`score ${scoreClass(s.drift_score)}`}>{s.drift_score.toFixed(2)}</p>
            </button>
          ))}
        </aside>

        <section className="detail-view">
          {!selected ? (
            <p>No session selected.</p>
          ) : (
            <>
              <h2>Session Detail</h2>
              <div className="score-card">
                <p>Drift Score</p>
                <p className={`large-score ${scoreClass(selected.drift_score)}`}>
                  {selected.drift_score.toFixed(2)}
                </p>
              </div>

              <div className="detail-stats">
                <div>
                  <p className="label">Duration</p>
                  <p>{durationSec(selected)}s</p>
                </div>
                <div>
                  <p className="label">Signals Fired</p>
                  <p>{selected.threshold_crossings.length}</p>
                </div>
              </div>

              <div className="timeline">
                <h3>Threshold Crossings</h3>
                <div className="timeline-track">
                  {selected.threshold_crossings.length === 0 ? (
                    <p className="empty">No threshold crossings in this session.</p>
                  ) : (
                    selected.threshold_crossings.map((c, idx) => (
                      <div
                        className="marker"
                        key={`${c.timestamp}-${idx}`}
                        style={{ left: `${timelinePercent(selected, c.timestamp)}%` }}
                      >
                        <div className="dot" />
                        <div className="marker-label">
                          <p>{c.signal}</p>
                          <span>{formatTs(c.timestamp)}</span>
                          <span>{c.label}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
