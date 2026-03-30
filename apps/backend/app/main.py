from typing import Optional, Sequence

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, col, desc, select

from .db import create_db_and_tables, get_session
from .models import AgentSession, SessionCrossing
from .schemas import ErrorResponse, SessionCreate, SessionOut, ThresholdCrossingOut

app = FastAPI(title="Sploink Session API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


def _to_session_out(db_session: AgentSession, crossings: Sequence[SessionCrossing]) -> SessionOut:
    return SessionOut(
        session_id=db_session.session_id,
        agent=db_session.agent,
        started_at=db_session.started_at,
        ended_at=db_session.ended_at,
        drift_score=db_session.drift_score,
        threshold_crossings=[
            ThresholdCrossingOut(
                timestamp=c.timestamp,
                signal=c.signal,
                value=c.value,
                label=c.label,
            )
            for c in crossings
        ],
    )


@app.post("/sessions", response_model=SessionOut, responses={422: {"model": ErrorResponse}})
def create_session(payload: SessionCreate, session: Session = Depends(get_session)) -> SessionOut:
    existing = session.get(AgentSession, payload.session_id)
    if existing:
        raise HTTPException(status_code=422, detail="session_id already exists")

    db_session = AgentSession(
        session_id=payload.session_id,
        agent=payload.agent,
        started_at=payload.started_at,
        ended_at=payload.ended_at,
        drift_score=payload.drift_score,
    )
    session.add(db_session)

    db_crossings = [
        SessionCrossing(
            session_id=payload.session_id,
            timestamp=c.timestamp,
            signal=c.signal,
            value=c.value,
            label=c.label,
        )
        for c in payload.threshold_crossings
    ]
    for crossing in db_crossings:
        session.add(crossing)

    try:
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"database error: {exc.__class__.__name__}") from exc

    return _to_session_out(db_session, db_crossings)


@app.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    agent: Optional[str] = None,
    min_drift: Optional[float] = Query(default=None, ge=0.0, le=1.0),
    limit: int = Query(default=20, ge=1, le=200),
    session: Session = Depends(get_session),
) -> list[SessionOut]:
    stmt = select(AgentSession)
    if agent:
        stmt = stmt.where(AgentSession.agent == agent)
    if min_drift is not None:
        stmt = stmt.where(AgentSession.drift_score >= min_drift)

    stmt = stmt.order_by(desc(AgentSession.started_at)).limit(limit)
    sessions = session.exec(stmt).all()

    results: list[SessionOut] = []
    for s in sessions:
        crossings = session.exec(
            select(SessionCrossing)
            .where(SessionCrossing.session_id == s.session_id)
            .order_by(col(SessionCrossing.timestamp))
        ).all()
        results.append(_to_session_out(s, crossings))
    return results


@app.get("/sessions/{session_id}", response_model=SessionOut, responses={404: {"model": ErrorResponse}})
def get_session_by_id(session_id: str, session: Session = Depends(get_session)) -> SessionOut:
    db_session = session.get(AgentSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="session not found")

    crossings = session.exec(
        select(SessionCrossing)
        .where(SessionCrossing.session_id == session_id)
        .order_by(col(SessionCrossing.timestamp))
    ).all()
    return _to_session_out(db_session, crossings)
