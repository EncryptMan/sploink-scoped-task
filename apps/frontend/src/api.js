const API_BASE = "http://127.0.0.1:8000";

export async function fetchSessions() {
  const response = await fetch(`${API_BASE}/sessions?limit=200`);
  if (!response.ok) {
    throw new Error(`Failed to load sessions: ${response.status}`);
  }
  return response.json();
}

export async function postSession(session) {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err?.detail || `Failed to create session (${response.status})`;
    throw new Error(message);
  }
  return response.json();
}

export function sampleSessions() {
  const base = 1742891234;
  return [
    {
      session_id: "sample-1",
      agent: "claude",
      started_at: base,
      ended_at: base + 600,
      drift_score: 0.32,
      threshold_crossings: [
        {
          timestamp: base + 200,
          signal: "minor_delta",
          value: 0.26,
          label: "Slight behavior change detected",
        },
      ],
    },
    {
      session_id: "sample-2",
      agent: "gpt",
      started_at: base + 1200,
      ended_at: base + 1880,
      drift_score: 0.58,
      threshold_crossings: [
        {
          timestamp: base + 1500,
          signal: "test_regression",
          value: 0.43,
          label: "A previously passing test began failing",
        },
      ],
    },
    {
      session_id: "sample-3",
      agent: "claude",
      started_at: base + 2400,
      ended_at: base + 3180,
      drift_score: 0.77,
      threshold_crossings: [
        {
          timestamp: base + 2780,
          signal: "schema_mismatch",
          value: 0.48,
          label: "Output schema mismatch appeared",
        },
      ],
    },
    {
      session_id: "sample-4",
      agent: "gpt",
      started_at: base + 3600,
      ended_at: base + 4200,
      drift_score: 0.41,
      threshold_crossings: [],
    },
    {
      session_id: "sample-5",
      agent: "claude",
      started_at: base + 4800,
      ended_at: base + 5670,
      drift_score: 0.88,
      threshold_crossings: [
        {
          timestamp: base + 5100,
          signal: "feedback_loop",
          value: 0.62,
          label: "Self-reinforcing wrong heuristic",
        },
        {
          timestamp: base + 5400,
          signal: "test_regression",
          value: 0.56,
          label: "Second test group regressed",
        },
      ],
    },
  ];
}
