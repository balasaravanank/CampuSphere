# CAMPUSPHERE — Product Requirements Document v3.0

> **All-in-One College Student Workspace Platform**
> Solo-Dev Edition · Security-Hardened · Production-Grade

---

| Field | Value |
|-------|-------|
| **Version** | 3.0 (Scale & Extensibility Update) |
| **Date** | May 2026 |
| **Author** | Bala Saravanan K (24900611) |
| **Institution** | Saveetha Engineering College — AI & Data Science |
| **Classification** | CONFIDENTIAL · INTERNAL USE ONLY |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Scope Strategy (Solo Dev)](#5-scope-strategy-solo-dev)
6. [Core Modules — v3.0 (P0)](#6-core-modules--v30-p0)
7. [Future Modules — v3.1 Backlog (P1–P3)](#7-future-modules--v31-backlog-p1p3)
8. [Tech Stack](#8-tech-stack)
9. [System Architecture](#9-system-architecture)
10. [Database Design](#10-database-design)
11. [API Design](#11-api-design)
12. [Security Model](#12-security-model)
13. [UI/UX Design System](#13-uiux-design-system)
14. [Deployment Strategy](#14-deployment-strategy)
15. [Development Roadmap (Solo Dev)](#15-development-roadmap-solo-dev)
16. [Risk Analysis & Mitigation](#16-risk-analysis--mitigation)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

CampuSphere replaces Saveetha Engineering College's aging Learner Portal (`learner.saveetha.in`) with a modern, AI-powered student workspace. The current portal suffers from poor mobile experience, zero personalization, no real-time updates, and rigid workflow systems. 

**CampuSphere v3.0 delivers 8 laser-focused modules:**

| # | Module | Why It's P0 |
|---|--------|-------------|
| 1 | **Auth & Identity** | Foundation — every other module depends on it |
| 2 | **Smart Attendance** | College's #1 operational pain point |
| 3 | **Circulars & Announcements** | 98+ unread circulars = zero information reach |
| 4 | **Assignment & Deadline Tracker** | Students miss deadlines due to scattered channels |
| 5 | **Smart Notification Center** | Glue that makes all modules useful in real-time |
| 6 | **AI Study Assistant** | Flagship differentiator — the wow factor |
| 7 | **Workflow Approval Engine** | Replaces static paper trails with dynamic multi-step approvals |
| 8 | **Mentorship & Workshop System** | Powers structured peer-to-peer and staff learning sessions |

**Key Differentiators from Existing Portal:**
- Mobile-first PWA (works offline)
- Anti-cheat attendance (device-bound OTP + geo-fence)
- AI-powered circular summaries
- Real-time WebSocket notifications
- Dynamic, multi-step pipeline for workflow requests
- End-to-end workshop & reward point ecosystem

---

## 2. Problem Statement

### 2.1 Current Pain Points

| # | Pain Point | Impact | Affected Users |
|---|-----------|--------|----------------|
| 1 | **OTP sharing** via WhatsApp groups | Attendance data is unreliable | Faculty, Admin |
| 2 | **Unread circulars** — no priority | Students miss critical deadlines | Students |
| 3 | **Desktop-only** — poor mobile UI | Low accessibility on phones | All |
| 4 | **No real-time updates** | Request status unknown for days | Students, Faculty |
| 5 | **Rigid approval processes** | Letters/leaves get stuck without visibility | Students, Admin |
| 6 | **Scattered workshops/mentorships** | Poor attendance tracking and point distribution | Mentors, Admin |

### 2.2 Opportunity

> 5,000+ students spend 4 years on campus. The digital tools they use daily should match the quality of apps they choose voluntarily. By adding dynamic workflows and integrated mentorship systems, CampuSphere moves from just a viewer portal to a fully operational campus OS.

---

## 3. Target Users & Personas

### 3.1 Primary Personas

| Persona | Role | Key Need | Usage Pattern |
|---------|------|----------|---------------|
| **Arjun** (Student) | 2nd year CSE | Quick attendance, AI help, tracking leave approvals | Mobile, 5-10 min sessions, 4-6x daily |
| **Dr. Lakshmi** (Faculty) | Associate Professor | Track attendance, post assignments, approve letters | Desktop + tablet, 2-3x daily |
| **Mentor Raj** (Mentor) | Assigned mentor | Host workshops, approve mentee workflows | Desktop, weekly 30-min sessions |
| **Admin Priya** (Admin/SCOFT) | Department coordinator | Oversee pipelines, configure approval templates | Desktop, continuous during work hours |

### 3.2 RBAC Role Matrix

| Permission | Student | Faculty | Mentor | Admin |
|-----------|---------|---------|--------|-------|
| Generate attendance OTP | ❌ | ✅ | ❌ | ❌ |
| Submit attendance OTP | ✅ | ❌ | ❌ | ❌ |
| Create circulars | ❌ | ✅ | ❌ | ✅ |
| Submit/Track workflows | ✅ | ✅ | ✅ | ✅ |
| Approve workflow step | ❌ | ✅ | ✅ | ✅ |
| Configure workflow chains| ❌ | ❌ | ❌ | ✅ |
| Host Workshops | ✅ | ✅ | ✅ | ✅ |

---

## 4. Goals & Success Metrics

### 4.1 Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Reduce attendance disputes | ↓ 80% | Dispute ticket count before/after |
| Speed up letter/leave approvals | ↓ 50% turnaround | Average workflow resolution time |
| Increase workshop engagement | ↑ 40% participation | Hosted events & booked slots count |

### 4.2 Product Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Daily active users | > 60% of enrolled students | DAU/MAU ratio |
| Mobile Lighthouse score | > 90 | Automated CI lighthouse audit |
| Time to first meaningful paint | < 2 seconds | Core Web Vitals (LCP) |

---

## 5. Scope Strategy (Solo Dev)

### 5.1 The Hard Truth

> [!CAUTION]
> A solo developer cannot ship everything at once. v3.0 aggressively integrates the dynamic approval engine and mentorship modules while deferring complex non-essentials.

### 5.2 Scope Tiers

```
┌─────────────────────────────────────────────────────┐
│  v3.0 — CORE EXTENSION                             │
│  ┌───────────────────────────────────────────────┐  │
│  │ P0: Auth · Attendance · Circulars ·           │  │
│  │     Assignments · Notifications · AI ·        │  │
│  │     Workflows · Mentorship Workshops          │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  v3.1 — POST-LAUNCH BACKLOG                        │
│  P1: Schedule/Timetable · GPA Calculator ·          │
│      Opportunity Board · Study Groups               │
├─────────────────────────────────────────────────────┤
│  v3.2 — EXPANSION                                  │
│  P2: Resume Builder · Marketplace                   │
└─────────────────────────────────────────────────────┘
```

---

## 6. Core Modules — v3.0 (P0)

### 6.1 Auth & Identity Service
Single Sign-On (SSO) via college Google Workspace, with email/password fallback. JWT-based session management with single-use refresh tokens and family invalidation.

### 6.2 Smart Attendance System
Enhanced OTP-based attendance with anti-cheat measures (device binding + geo-fencing), real-time WebSocket broadcast, and state machine enforcement.

### 6.3 Circulars & Announcements (AI-Triage)
AI-generated summaries, priority ranking, and deadline countdowns. Uses Groq Llama-3 to auto-classify urgency.

### 6.4 Assignment & Deadline Tracker
Kanban-style assignment board with escalating reminder notifications (Normal, Warning, Urgent, Critical) via WebSocket and PWA push.

### 6.5 Smart Notification Center
Unified, priority-ranked notification hub grouping alerts from attendance, circulars, workflows, and workshops.

### 6.6 AI Study Assistant
RAG pipeline using college syllabus indexed in Qdrant. Streaming responses via SSE with Ollama local fallback.

### 6.7 Dynamic Workflow Approval Engine

#### Overview
A scalable engine supporting diverse request types (General Letter, Leave, Certificates) with admin-configurable multi-step approval chains. Replaces static interfaces with dynamic pipelines.

#### Pipeline Architecture
```
[Student Request] ──▶ [Mentor Approval] ──▶ [HOD Approval] ──▶ [SCOFT Admin] ──▶ [Resolved]
```
- **Templates:** Admins define step-by-step chains per request type.
- **Visual Tracker:** Students see a clear UI timeline (e.g., "Waiting on HOD").
- **Timeouts/Escalations:** Alerts if a step is stalled for >48h.

### 6.8 Mentorship & Workshop Activity System

#### Overview
End-to-end management of campus workshops, peer learning, and mentorship. Connects booking, hosting, and reward distribution.

#### Workflow
1. **Creation:** Student/Staff proposes a workshop (Title, Date, Capacity).
2. **Approval:** Admin approves the event.
3. **Booking:** Students reserve limited slots.
4. **Execution:** Meeting links are shared; attendance is confirmed by the host.
5. **Rewards:** Automated distribution of reward points upon verified attendance.

---

## 7. Future Modules — v3.1 Backlog (P1–P3)

| Module | Priority | Description |
|--------|----------|-------------|
| **Smart Schedule & Timetable** | P1 | Interactive calendar, clash detection, Google Calendar sync. |
| **GPA Calculator** | P1 | Grade simulator and CGPA tracking. |
| **Opportunity Board** | P1 | Curated hackathons and internships feed. |
| **Peer Study Groups** | P1 | Subject-based collaborative groups (Discord-lite). |
| **Resume Builder** | P2 | Auto-populate from campus data, ATS-friendly templates. |
| **Marketplace** | P2 | P2P textbook/notes trading. |

---

## 8. Tech Stack

### 8.1 Frontend
- **React 19** + **Vite 6** + **TypeScript**
- **TailwindCSS v4** + **shadcn/ui**
- **TanStack Query v5** + **Zustand** + **React Router v7**
- **Vite PWA Plugin**

### 8.2 Backend
- **FastAPI** (Python 3.12) + **Uvicorn**
- **SQLAlchemy 2.0** (async) + **Alembic**
- **Celery** + **Redis** (broker)
- **Pydantic v2** + **FastAPI native WebSocket**

### 8.3 Infrastructure & DB
- **PostgreSQL 16** (Primary DB, JSON, pgcrypto)
- **Redis 7** (Cache, OTP, rate limits)
- **MinIO** (Self-hosted S3 for files/submissions)
- **Qdrant** (Vector DB for AI context)
- **Docker Compose** + **Nginx 1.26** (Reverse Proxy)

---

## 9. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     NGINX (Reverse Proxy)                     │
└──────────┬──────────────┬────────────────────────────────────┘
           │              │
    /api/* │       static │ files
           ▼              ▼
┌──────────────────┐  ┌────────────────┐
│   FastAPI         │  │  React SPA     │
│   (Uvicorn ×4)    │  │  (Nginx-served)│
│                   │  │                │
│  ┌─────────────┐  │  │  ┌──────────┐ │
│  │ Core Svcs   │  │  │  │ PWA      │ │
│  ├─────────────┤  │  │  │ Service  │ │
│  │ Workflows   │  │  │  │ Worker   │ │
│  ├─────────────┤  │  │  └──────────┘ │
│  │ Workshops   │  │  └────────────────┘
│  └─────────────┘  │
└────────┬───────────┘
         │
    ┌────┼──────────────────────────────────┐
    ▼    ▼                                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │   Redis      │  │   MinIO      │
│ (Port 5432)  │  │ (Port 6379)  │  │ (Port 9000)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 10. Database Design

### Key Tables Added in v3.0

| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `workflow_templates` | id, type, steps_json, created_at | Defines dynamic approval chains |
| `workflow_requests` | id, template_id, student_id, status, payload_json, current_step | Belongs to: template, student |
| `workflow_approvals` | id, request_id, approver_id, action, comment, acted_at | Belongs to: request, approver |
| `workshops` | id, title, host_id, capacity, status, start_time, meeting_link | Has many: workshop_bookings |
| `workshop_bookings`| id, workshop_id, student_id, attended, reward_points_granted | Belongs to: workshop, student |

---

## 11. API Design

### New Endpoints (v3.0)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows/templates` | List available workflow templates |
| `POST` | `/workflows/requests` | Submit a new workflow request |
| `PATCH` | `/workflows/requests/{id}/approve` | Approve/reject a workflow step |
| `POST` | `/workshops` | Create a mentorship/workshop session |
| `POST` | `/workshops/{id}/book` | Book a slot in a workshop |
| `PATCH` | `/workshops/{id}/attendance` | Host confirms attendee presence |

---

## 12. Security Model
- **Zero Trust** via strict Pydantic v2 validation.
- **In-transit:** TLS 1.3 via Nginx + Certbot.
- **At-rest:** `pgcrypto` for PII. MinIO bucket restrictions.
- **API Security:** CORS whitelist (NO wildcards). Rate limits per IP and User.
- **Docker Security:** Internal networks for Postgres, Redis, MinIO, Qdrant.

---

## 13. UI/UX Design System
- **Philosophy:** Calm Tech, Notion/Linear aesthetic.
- **Colors:** Deep blues (`#1E3A5F`) with vibrant accents (`#2563EB`).
- **Typography:** `Sora` for headings, `Inter` for body.
- **Layout:** Bottom tab bar for mobile, collapsible sidebar for desktop.
- **Workflow UI:** Stepper visual tracker (e.g., `Submitted -> Mentor Check -> HOD -> Approved`).

---

## 14. Deployment Strategy
- **Platform:** Ubuntu 24.04 LTS (College Server).
- **CI/CD:** GitHub Actions -> Lint/Test/Build -> ghcr.io -> SSH docker compose pull.
- **Backups:** Daily `pg_dump` to MinIO.
- **Monitoring:** Prometheus + Grafana, UptimeRobot, Sentry.

---

## 15. Development Roadmap (Solo Dev)
*Extended to 24 Weeks for v3.0 Scope*

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1-5 | Infrastructure, DB Schema, Auth SSO, RBAC |
| 2 | 6-12 | Attendance API/UI, Circulars AI, Assignments |
| 3 | 13-17 | Mentorship/Workshops, Dynamic Workflows, Notification Hub |
| 4 | 18-21 | AI integration (Groq/Qdrant), PWA setup, Analytics UI |
| 5 | 22-24 | Security audits (ZAP), Load testing, Beta launch, Polish |

---

## 16. Risk Analysis & Mitigation

| Risk | Mitigation |
|------|------------|
| Dynamic Workflow bottleneck | Escalate to Admin if approval is idle for 48h. |
| Workshop no-shows | Automated reminders 1h before; penalize points for frequent absentees. |
| Solo dev burnout | Strictly rely on `shadcn/ui`; cut P1/P2 features ruthlessly. |
| OTP sharing | Geofencing + strict device binding (max 2 devices). |

---

> **— END OF DOCUMENT —**
>
> CampuSphere PRD v3.0 | Bala Saravanan K | Saveetha Engineering College | May 2026
