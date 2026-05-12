"""Common response schemas — API envelope format."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: str | None = None
    issue: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []


class MetaResponse(BaseModel):
    cursor: str | None = None
    has_more: bool = False
    total: int | None = None


class APIResponse(BaseModel, Generic[T]):
    data: T | None = None
    meta: MetaResponse | None = None
    error: ErrorResponse | None = None

    @classmethod
    def success(cls, data: Any, meta: MetaResponse | None = None) -> "APIResponse":
        return cls(data=data, meta=meta, error=None)

    @classmethod
    def fail(cls, code: str, message: str, details: list[ErrorDetail] | None = None) -> "APIResponse":
        return cls(data=None, meta=None, error=ErrorResponse(code=code, message=message, details=details or []))
