from typing import List

from pydantic import BaseModel, Field, field_validator


class ThresholdCrossingIn(BaseModel):
    timestamp: int
    signal: str = Field(min_length=1)
    value: float
    label: str = Field(min_length=1)


class SessionCreate(BaseModel):
    session_id: str = Field(min_length=1)
    agent: str = Field(min_length=1)
    started_at: int
    ended_at: int
    drift_score: float = Field(ge=0.0, le=1.0)
    threshold_crossings: List[ThresholdCrossingIn] = Field(default_factory=list)

    @field_validator("ended_at")
    @classmethod
    def ended_after_started(cls, v: int, info):
        started = info.data.get("started_at")
        if started is not None and v < started:
            raise ValueError("ended_at must be greater than or equal to started_at")
        return v


class ThresholdCrossingOut(BaseModel):
    timestamp: int
    signal: str
    value: float
    label: str


class SessionOut(BaseModel):
    session_id: str
    agent: str
    started_at: int
    ended_at: int
    drift_score: float
    threshold_crossings: List[ThresholdCrossingOut]


class ErrorResponse(BaseModel):
    detail: str
