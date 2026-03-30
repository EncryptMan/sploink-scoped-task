# Sploink – Agent Drift Monitoring Dashboard

**Sploink** is a real-time drift monitoring system designed to track behavioral changes and anomalies in AI agent sessions. It provides visibility into agent performance degradation through drift scoring, threshold detection, and interactive session analysis.

## Purpose

As AI agents operate in production, their behavior can drift from expected patterns due to model updates, environmental changes, or cumulative errors. Sploink helps detect and visualize this drift by:
- **Tracking drift scores** across agent sessions over time
- **Detecting threshold crossings** that signal significant behavioral anomalies (test regressions, schema mismatches, feedback loops)
- **Visualizing trends** through an interactive timeline dashboard
- **Analyzing sessions** with detailed breakdowns of signals, durations, and severity levels

This enables teams to monitor agent health, catch degradation early, and investigate root causes before they impact production.

## Architecture

A full-stack monorepo with:
- **FastAPI backend** in `apps/backend` – REST API for session management and persistence
- **React + Vite frontend** in `apps/frontend` – Interactive dashboard for drift visualization

## 1) Prerequisites
- Python 3.10+
- Node 20+

## 2) Install dependencies

Backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
npm run backend:install
```

Frontend:

```bash
npm run frontend:install
```

## 3) Run apps

Backend API (http://127.0.0.1:8000):

```bash
source .venv/bin/activate
npm run backend:dev
```

Frontend dashboard (http://127.0.0.1:5173):

```bash
npm run frontend:dev
```

## 4) Run tests

```bash
source .venv/bin/activate
npm run backend:test
```

## Project Structure

```
.
├── apps/
│   ├── backend/              FastAPI REST API + SQLite database
│   │   ├── app/
│   │   │   ├── main.py       REST endpoints (POST/GET /sessions)
│   │   │   ├── models.py     Database models (AgentSession, SessionCrossing)
│   │   │   ├── schemas.py    Request/response schemas
│   │   │   └── db.py         Database initialization & sessions
│   │   ├── tests/            pytest test suite
│   │   └── requirements.txt  Python dependencies
│   └── frontend/             React + Vite dashboard
│       ├── src/
│       │   ├── App.jsx       Main UI (trend chart, list, details)
│       │   ├── api.js        Backend API client
│       │   └── styles.css    Dark theme styling
│       ├── index.html        Entry point
│       ├── vite.config.js    Build configuration
│       └── package.json      Dependencies
├── package.json              Root npm workspaces
├── pytest.ini                pytest configuration
└── README.md                 This file
```

## Key Features

- **Drift Trend Chart** – Visualizes drift scores over time with severity-colored points (clickable to select sessions)
- **Session List** – Browse all monitored agent sessions; filter by agent or minimum drift threshold
- **Session Details** – Full metadata (duration, agent, timestamps) and threshold-crossing timeline
- **Sample Data Loading** – Pre-populated demo sessions for testing
- **Auto-refresh** – Dashboard updates every 10 seconds to reflect new data
