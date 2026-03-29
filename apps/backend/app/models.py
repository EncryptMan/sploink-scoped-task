from typing import Optional

from sqlmodel import Field, SQLModel


class SessionCrossing(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    timestamp: int
    signal: str
    value: float
    label: str


class AgentSession(SQLModel, table=True):
    session_id: str = Field(primary_key=True)
    agent: str = Field(index=True)
    started_at: int = Field(index=True)
    ended_at: int
    drift_score: float = Field(index=True)
