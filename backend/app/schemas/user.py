"""User schemas for auth and profile operations."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    reg_no: str = Field(min_length=3, max_length=20)
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    department: str = Field(min_length=2, max_length=100)
    year: int | None = Field(default=None, ge=1, le=5)
    section: str | None = Field(default=None, max_length=10)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    reg_no: str
    name: str
    email: str
    role: str
    department: str
    year: int | None
    section: str | None
    avatar_url: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=500)
    department: str | None = Field(default=None, max_length=100)
    year: int | None = Field(default=None, ge=1, le=5)
    section: str | None = Field(default=None, max_length=10)


class AdminUserUpdateRequest(UserUpdateRequest):
    role: str | None = None
    is_active: bool | None = None


class AdminUserCreateRequest(BaseModel):
    reg_no: str = Field(min_length=3, max_length=20)
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: str
    department: str = Field(min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)
