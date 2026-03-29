# Sploink Monorepo

A simple monorepo with:
- FastAPI backend in `apps/backend`
- React + Vite frontend in `apps/frontend`

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

## Monorepo layout

- `apps/backend`: FastAPI + SQLite + tests
- `apps/frontend`: React dashboard
