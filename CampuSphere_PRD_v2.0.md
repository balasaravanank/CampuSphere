# CAMPUSPHERE — Product Requirements Document v2.0

> **All-in-One College Student Workspace Platform**
> Solo-Dev Edition · Security-Hardened · Production-Grade

---

| Field | Value |
|-------|-------|
| **Version** | 2.0 (Clean Rewrite) |
| **Date** | April 2026 |
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
6. [Core Modules — v1.0 (P0)](#6-core-modules--v10-p0)
7. [Future Modules — v1.1 Backlog (P1–P3)](#7-future-modules--v11-backlog-p1p3)
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

CampuSphere replaces Saveetha Engineering College's aging Learner Portal (`learner.saveetha.in`) with a modern, AI-powered student workspace. The current portal — built on Django + jQuery + Bootstrap — suffers from poor mobile experience, zero personalization, no real-time updates, and an attendance system trivially exploitable via OTP sharing.

**CampuSphere v1.0 delivers 6 laser-focused modules:**

| # | Module | Why It's P0 |
|---|--------|-------------|
| 1 | **Auth & Identity** | Foundation — every other module depends on it |
| 2 | **Smart Attendance** | College's #1 operational pain point |
| 3 | **Circulars & Announcements** | 98+ unread circulars = zero information reach |
| 4 | **Assignment & Deadline Tracker** | Students miss deadlines due to scattered channels |
| 5 | **Smart Notification Center** | Glue that makes all modules useful in real-time |
| 6 | **AI Study Assistant** | Flagship differentiator — the wow factor |

**What's NOT in v1.0:** GPA calculator, marketplace, resume builder, study groups, opportunity board, lost & found, mentorship portal, event booking. These are scoped for v1.1 after stable launch.

**Key Differentiators from Existing Portal:**
- Mobile-first PWA (works offline)
- Anti-cheat attendance (device-bound OTP + geo-fence)
- AI-powered circular summaries (no more reading 5-page PDFs)
- Real-time WebSocket notifications (no page refresh)
- Modern, Notion-like UI (not a government portal)

---

## 2. Problem Statement

### 2.1 Current Pain Points

| # | Pain Point | Impact | Affected Users |
|---|-----------|--------|----------------|
| 1 | **OTP sharing** via WhatsApp groups defeats attendance purpose | Attendance data is unreliable | Faculty, Admin |
| 2 | **98+ unread circulars** — no priority, no filtering | Students miss critical deadlines | Students |
| 3 | **Desktop-only** — portal unusable on phones | Students don't check portal outside lab | All |
| 4 | **No real-time updates** — must refresh page to see changes | Request status unknown for days | Students, Faculty |
| 5 | **Zero personalization** — every student sees same interface | Low engagement, feels like ERP | Students |
| 6 | **Assignment deadlines scattered** across WhatsApp, email, verbal | Students miss submissions | Students, Faculty |
| 7 | **No AI tools** — students use ChatGPT outside the portal | Missed opportunity for contextual assistance | Students |

### 2.2 Opportunity

> 5,000+ students spend 4 years on campus. The digital tools they use daily should match the quality of apps they choose voluntarily — Notion, Discord, Swiggy. CampuSphere bridges this gap.

---

## 3. Target Users & Personas

### 3.1 Primary Personas

| Persona | Role | Key Need | Usage Pattern |
|---------|------|----------|---------------|
| **Arjun** (Student) | 2nd year CSE | Quick attendance, deadline tracking, AI help for concepts | Mobile, 5-10 min sessions, 4-6x daily |
| **Dr. Lakshmi** (Faculty) | Associate Professor | Generate OTP, track attendance, post assignments | Desktop + tablet, longer sessions, 2-3x daily |
| **Mentor Raj** (Mentor) | Assigned mentor for 20 students | Track mentee academic health, schedule meetings | Desktop, weekly 30-min sessions |
| **Admin Priya** (Admin) | Department coordinator | Post circulars, approve workflows, view analytics | Desktop, continuous during work hours |

### 3.2 RBAC Role Matrix

| Permission | Student | Faculty | Mentor | Admin |
|-----------|---------|---------|--------|-------|
| View own attendance | ✅ | — | ✅ (mentees) | ✅ (all) |
| Generate attendance OTP | ❌ | ✅ | ❌ | ❌ |
| Submit attendance OTP | ✅ | ❌ | ❌ | ❌ |
| Create circulars | ❌ | ✅ | ❌ | ✅ |
| Post assignments | ❌ | ✅ | ❌ | ✅ |
| Submit assignments | ✅ | ❌ | ❌ | ❌ |
| Grade assignments | ❌ | ✅ | ❌ | ❌ |
| Use AI assistant | ✅ | ✅ | ✅ | ❌ |
| View analytics (own) | ✅ | ✅ | ✅ | ✅ |
| View analytics (all) | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

---

## 4. Goals & Success Metrics

### 4.1 Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Reduce attendance disputes | ↓ 80% | Dispute ticket count before/after |
| Increase circular read-rate | 20% → 70% | `circular_reads` table analytics |
| Eliminate OTP sharing | < 5% proxy attendance | Geo-fence + device binding logs |
| Self-hosted, zero recurring SaaS cost | ₹0/month for hosting | All services on college Ubuntu server |

### 4.2 Product Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Daily active users | > 60% of enrolled students | DAU/MAU ratio |
| Mobile Lighthouse score | > 90 | Automated CI lighthouse audit |
| Time to first meaningful paint | < 2 seconds | Core Web Vitals (LCP) |
| Critical security vulnerabilities | 0 at launch | OWASP ZAP scan + manual review |
| Uptime during academic hours (8 AM–6 PM) | 99.5% | UptimeRobot / Prometheus alerts |

---

## 5. Scope Strategy (Solo Dev)

### 5.1 The Hard Truth

> [!CAUTION]
> A solo developer cannot ship 17 features with AI, WebSocket, RAG, PWA, and marketplace in 16 weeks. Attempting it guarantees a buggy, insecure product. This PRD scopes aggressively.

### 5.2 Scope Tiers

```
┌─────────────────────────────────────────────────────┐
│  v1.0 — LAUNCH (Weeks 1–20)                        │
│  ┌───────────────────────────────────────────────┐  │
│  │ P0: Auth · Attendance · Circulars ·           │  │
│  │     Assignments · Notifications · AI          │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  v1.1 — POST-LAUNCH (Weeks 21–30)                  │
│  P1: Schedule/Timetable · GPA Calculator ·          │
│      Opportunity Board · Study Groups ·             │
│      Personal Analytics · Mentorship Portal         │
├─────────────────────────────────────────────────────┤
│  v1.2 — EXPANSION (Weeks 31+)                      │
│  P2: Resume Builder · Event Booking (upgraded)      │
│  P3: Marketplace · Lost & Found                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 Feature-Cut Rationale

| Cut Feature | Why Cut from v1.0 | When It Returns |
|-------------|-------------------|-----------------|
| Smart Schedule | React Big Calendar is complex; basic timetable served via static data first | v1.1 Week 21 |
| GPA Calculator | Requires grading policy integration — low urgency | v1.1 Week 23 |
| Opportunity Board | Web scraping is fragile; manual posting can start in v1.1 | v1.1 Week 24 |
| Study Groups | Requires real-time chat infra — too much for solo dev v1.0 | v1.1 Week 26 |
| Mentorship Portal | Existing portal handles this adequately for now | v1.1 Week 28 |
| Event Booking | Current system works; upgrade after core is stable | v1.2 |
| Resume Builder | Nice-to-have, not critical for daily campus life | v1.2 |
| Marketplace | Requires moderation system, payment trust — complex | v1.2 |
| Lost & Found | Trivially handled by WhatsApp groups for now | v1.2 |

---

## 6. Core Modules — v1.0 (P0)

### 6.1 Auth & Identity Service

#### Overview
Single Sign-On (SSO) via college Google Workspace as the **primary and recommended** auth method, with email/password fallback for students without GSuite access. JWT-based session management with refresh token rotation.

#### Auth Flow — SSO (Primary)

```
Student opens CampuSphere
        │
        ▼
┌─────────────────┐
│  Login Screen    │
│  [Sign in with   │
│   College Email] │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google OAuth2   │
│  Consent Screen  │
│  (@saveetha.ac.in │
│   emails only)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Backend validates:  │
│  1. Email domain     │
│  2. User exists in   │
│     users table      │
│  3. Account active   │
└────────┬────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
     YES │        NO
         ▼         ▼
  Issue JWT    403 Forbidden
  + Refresh    "Account not
  Token        provisioned"
```

#### Auth Flow — Email/Password (Fallback)

```
┌─────────────────┐
│  Email + Password│
│  [Login]         │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Rate check:             │
│  > 5 attempts in 15min?  │
│  → 429 Too Many Requests │
│  → Lock account 30min    │
└────────┬─────────────────┘
         │ (under limit)
         ▼
┌──────────────────────────┐
│  Verify:                 │
│  1. bcrypt hash match    │
│  2. Account not locked   │
│  3. Account is active    │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
     YES │        NO
         ▼         ▼
  Issue JWT    Increment
  + Refresh    fail_count
  Token        + 401 error
```

#### JWT Token Strategy

| Token | Lifetime | Storage | Rotation |
|-------|----------|---------|----------|
| Access Token | 15 minutes | Memory (JS variable) — **never localStorage** | On every API call if expired |
| Refresh Token | 7 days | HttpOnly, Secure, SameSite=Strict cookie | **Single-use** — new refresh token on each rotation |
| CSRF Token | Per-session | Double-submit cookie pattern | On login |

> [!IMPORTANT]
> **Refresh tokens are single-use.** When a refresh token is used, it is immediately invalidated and a new one is issued. If an attacker replays an old refresh token, ALL tokens for that user are revoked (token family invalidation). This detects token theft.

#### Password Policy (Fallback Auth)

```
Minimum 10 characters
At least 1 uppercase letter
At least 1 lowercase letter
At least 1 digit
At least 1 special character (!@#$%^&*)
Not in the top 10,000 common passwords list (haveibeenpwned)
Not the same as reg_no or email prefix
bcrypt with 12 rounds (cost factor)
```

#### Session Management

| Rule | Implementation |
|------|---------------|
| Concurrent sessions | Max 3 devices per user |
| Session pinning | Token bound to User-Agent + IP subnet (/24) |
| Force logout | Admin can revoke all sessions for any user |
| Inactivity timeout | 30 minutes of no API calls → require re-auth |
| Logout | Clear refresh cookie + blacklist token in Redis (TTL = token remaining life) |

---

### 6.2 Smart Attendance System

#### Overview
Enhanced OTP-based attendance with **anti-cheat measures** (device binding + geo-fencing), real-time WebSocket broadcast, attendance health analytics, and manual correction workflows.

#### Anti-Cheat: The OTP Sharing Problem

> [!WARNING]
> **The #1 vulnerability in OTP attendance is students sharing the OTP via WhatsApp.** Without anti-cheat, the entire attendance system is theater. CampuSphere addresses this with a layered approach.

##### Layer 1: Device Fingerprint Binding

```
When student submits OTP:
  1. Collect device fingerprint (FingerprintJS):
     - Canvas hash
     - WebGL renderer
     - Screen resolution
     - Timezone
     - Audio context hash
  2. Hash fingerprint → device_hash
  3. First submission on a new device → prompt: "New device detected. Verify with college email OTP."
  4. After verification, bind device_hash to student
  5. Max 2 registered devices per student
  6. Submission from unregistered device → REJECTED
```

##### Layer 2: Geo-Fence (Optional — WiFi-based)

```
When student submits OTP:
  1. Check if device is connected to college WiFi SSID (via NetworkInformation API)
     OR
  2. Geolocation API → check if within 500m radius of campus center
     (lat: 12.8523, lng: 80.2206 — Saveetha campus)
  3. If neither condition met → FLAG as "off-campus submission"
  4. Faculty sees flagged submissions in real-time dashboard
  5. Auto-flag does NOT auto-reject — faculty decides
```

> [!NOTE]
> Geo-fencing is opt-in per faculty. Some faculty may teach hybrid classes where remote attendance is valid. The system flags but doesn't block by default.

##### Layer 3: Time-Window Compression

```
OTP validity: 3 minutes (not 10 — reduces sharing window)
OTP is 6-digit numeric, regenerated every 3 minutes
OUT OTP is different from IN OTP
Faculty can manually invalidate and regenerate OTP
OTP displayed on faculty's screen only — not sent via message
```

#### Attendance State Machine

```
                    ┌─────────┐
                    │ ABSENT  │ (default state for all students at session start)
                    └────┬────┘
                         │
                    [IN OTP submitted + validated]
                         │
                         ▼
                    ┌─────────┐
                    │ CHECKED │
                    │   IN    │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
    [OUT OTP submitted       [Session ends without
     + validated]             OUT OTP from student]
              │                     │
              ▼                     ▼
        ┌──────────┐         ┌───────────┐
        │ PRESENT  │         │  PARTIAL  │
        │  (FULL)  │         │           │
        └──────────┘         └───────────┘
              │                     │
              │                     │
    [Medical cert / Leave]   [Manual correction
              │                request by student]
              ▼                     │
        ┌──────────┐                ▼
        │ ON_LEAVE │         ┌───────────────┐
        └──────────┘         │ CORRECTION    │
                             │ _REQUESTED    │
                             └──────┬────────┘
                                    │
                           [Faculty approves/rejects]
                                    │
                              ┌─────┴─────┐
                              ▼           ▼
                        ┌──────────┐ ┌──────────┐
                        │ PRESENT  │ │ REJECTED │
                        │ (manual) │ │          │
                        └──────────┘ └──────────┘
```

#### Valid State Transitions

| From | To | Trigger | Who |
|------|----|---------|-----|
| ABSENT | CHECKED_IN | IN OTP submitted | Student |
| CHECKED_IN | PRESENT | OUT OTP submitted | Student |
| CHECKED_IN | PARTIAL | Session ends (cron) | System |
| ABSENT | ON_LEAVE | Leave approved | Faculty/System |
| ABSENT/PARTIAL | CORRECTION_REQUESTED | Student uploads proof | Student |
| CORRECTION_REQUESTED | PRESENT | Faculty approves | Faculty |
| CORRECTION_REQUESTED | REJECTED | Faculty rejects | Faculty |

> [!CAUTION]
> **Invalid transitions are hard-blocked.** A student cannot go from ABSENT to PRESENT without going through CHECKED_IN. The state machine is enforced at the database level via a CHECK constraint, not just application logic.

#### Attendance Health Widget

```
┌────────────────────────────────────────┐
│ 📊 Attendance Health                   │
├────────────────────────────────────────┤
│ Overall: ████████░░ 82%  ✅ Safe       │
│                                        │
│ Data Structures   ███████░░░ 75% ⚠️    │
│ Operating Systems █████████░ 90% ✅    │
│ DBMS              ██████░░░░ 65% 🔴    │
│ AI & ML           ████████░░ 85% ✅    │
│                                        │
│ ⚠️ "If you skip DBMS today,            │
│    attendance drops to 61% — DANGER"   │
└────────────────────────────────────────┘
```

#### Real-Time OTP Broadcast (WebSocket)

```
Faculty clicks "Generate OTP"
        │
        ▼
┌────────────────────────┐
│ Backend:               │
│ 1. Generate 6-digit OTP│
│ 2. Store in Redis      │
│    key: otp:{session_id}│
│    TTL: 180 seconds    │
│ 3. Broadcast via WS    │
│    to all subscribed    │
│    students in room    │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Student's phone:       │
│ ┌────────────────────┐ │
│ │ 🔔 OTP Available!  │ │
│ │ Enter OTP: [______]│ │
│ │ Expires in: 2:43   │ │
│ └────────────────────┘ │
└────────────────────────┘
```

> [!NOTE]
> The OTP value is **NOT** broadcast via WebSocket. Only the signal "OTP is available" is sent. The student must visually read the OTP from the faculty's projected screen and type it. This is a deliberate anti-sharing design — the OTP only exists on the faculty's device and in Redis.

---

### 6.3 Circulars & Announcements (AI-Triage)

#### Overview
Redesigned circulars feed with AI-generated summaries, priority ranking, action tracking, and deadline countdowns. Solves the "98 unread circulars" problem.

#### Circular Data Flow

```
Admin/Faculty creates circular
        │
        ▼
┌─────────────────────────┐
│ Backend:                │
│ 1. Validate input       │
│ 2. Determine targets    │
│    (role + department    │
│     + year filter)      │
│ 3. Save to DB           │
│ 4. Queue AI summary job │
│ 5. Queue notifications  │
│    for target users     │
└────────┬────────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────┐    ┌────────────────┐
│ Celery:  │    │ Celery:        │
│ AI       │    │ Notification   │
│ Summary  │    │ Dispatch       │
│ (Groq)   │    │ (WS + Email)   │
└────┬─────┘    └────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Update circular with:   │
│ - ai_summary (2 lines)  │
│ - auto-priority tag     │
│   (URGENT/ACTION/INFO)  │
└─────────────────────────┘
```

#### Priority Classification Logic

```python
def classify_priority(circular):
    """AI-assisted priority classification with rule-based fallback."""

    # Rule-based overrides (always take precedence)
    if circular.has_deadline and days_until(circular.deadline) <= 1:
        return "URGENT"
    if circular.has_deadline and days_until(circular.deadline) <= 3:
        return "ACTION_REQUIRED"
    if circular.created_by.role == "Admin":
        return "ACTION_REQUIRED"  # Admin circulars are always important

    # AI classification (Groq)
    prompt = f"""
    Classify this college circular into one category:
    URGENT, ACTION_REQUIRED, INFORMATIONAL, LOW_PRIORITY

    Title: {circular.title}
    Content: {circular.content[:500]}
    Has deadline: {circular.has_deadline}
    """
    return groq_classify(prompt)  # fallback: "INFORMATIONAL"
```

#### Circular Feed UI Behavior

| Feature | Behavior |
|---------|----------|
| Default sort | Priority (URGENT first) → then by date (newest) |
| AI summary | Shown as 2-line preview; expand for full content |
| Deadline countdown | Red badge: "2 days left" / "Expired" |
| Read receipt | Marked read when circular is expanded (not on scroll-past) |
| Filters | Department, role, priority, date range, read/unread |
| Pin | Faculty/Admin can pin up to 3 circulars to top |
| Search | Full-text search on title + content (pg_trgm) |

---

### 6.4 Assignment & Deadline Tracker

#### Overview
Kanban-style assignment board. Faculty post assignments with deadlines; students manage them through stages. Escalating reminders prevent missed submissions.

#### Assignment State Machine

```
┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌───────────┐     ┌────────┐
│  TO_DO   │────▶│ IN_PROGRESS │────▶│  REVIEW  │────▶│ SUBMITTED │────▶│ GRADED │
└──────────┘     └─────────────┘     └──────────┘     └───────────┘     └────────┘
     │                                                       │
     │              ┌────────────┐                           │
     └─────────────▶│  OVERDUE   │◀──────────────────────────┘
                    └────────────┘  (deadline passed without
                                     SUBMITTED status)
```

| Transition | Trigger | Who |
|-----------|---------|-----|
| TO_DO → IN_PROGRESS | Student moves card | Student |
| IN_PROGRESS → REVIEW | Student self-marks for review | Student |
| REVIEW → SUBMITTED | Student uploads file + clicks submit | Student |
| SUBMITTED → GRADED | Faculty grades and adds feedback | Faculty |
| * → OVERDUE | Cron job at deadline time | System |
| OVERDUE → SUBMITTED | Late submission (if faculty allows) | Student |

#### Reminder Escalation

```
Deadline: April 30, 11:59 PM
        │
        ▼
April 23 (7 days before)  → 🔔 Normal: "Assignment X due in 7 days"
April 27 (3 days before)  → 🔔 Warning: "Assignment X due in 3 days"
April 29 (1 day before)   → 🔔 Urgent: "Assignment X due TOMORROW"
April 30, 10 PM (2 hours) → 🔔 Critical: "Assignment X due in 2 HOURS"
April 30, 11:59 PM        → System: Move to OVERDUE if not SUBMITTED
```

#### File Submission Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Max file size | 25 MB per file | Prevents storage abuse |
| Max files per submission | 5 | Reasonable for any assignment |
| Allowed MIME types | PDF, DOCX, PPTX, ZIP, PNG, JPG, TXT, PY, JAVA, C, CPP, JS | Academic files only |
| **Blocked** | EXE, BAT, SH, SVG, HTML, PHP, JSP | Executable/XSS vectors |
| Virus scan | ClamAV before MinIO storage | Malware prevention |
| File naming | `{reg_no}_{assignment_id}_{timestamp}.{ext}` | Unique, traceable |
| Overwrite | New submission replaces old (old archived) | Students can improve |

---

### 6.5 Smart Notification Center

#### Overview
Unified, priority-ranked notification hub with real-time WebSocket delivery, browser push notifications (PWA), and daily email digest. Replaces the current zero-notification experience.

#### Notification Architecture

```
┌─────────────────────────────────────────────────────┐
│                 EVENT SOURCES                        │
├──────────┬──────────┬────────────┬──────────────────┤
│Attendance│ Circular │ Assignment │ System/Admin     │
│  OTP     │  Posted  │  Deadline  │  Alerts          │
└────┬─────┴────┬─────┴─────┬──────┴──────┬───────────┘
     │          │           │             │
     └──────────┴───────────┴─────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │ Notification     │
           │ Service          │
           │ (Priority Queue) │
           └────────┬─────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ WebSocket│ │ Browser │ │ Email   │
   │ (instant)│ │ Push    │ │ Digest  │
   │          │ │ (PWA)   │ │ (daily) │
   └─────────┘ └─────────┘ └─────────┘
   CRITICAL+     HIGH+       ALL
   HIGH          NORMAL      (8 AM batch)
```

#### Priority Levels & Routing

| Priority | Examples | In-App | Push | Email |
|----------|----------|--------|------|-------|
| **CRITICAL** | Attendance OTP available, Account locked | ✅ Instant | ✅ Instant | ✅ Instant |
| **HIGH** | Assignment due in 24h, Urgent circular | ✅ Instant | ✅ Instant | ✅ Digest |
| **NORMAL** | New circular, Grade posted | ✅ Instant | ❌ | ✅ Digest |
| **LOW** | Reward points update, System maintenance | ✅ Batched (hourly) | ❌ | ❌ |

#### Smart Features

| Feature | Behavior |
|---------|----------|
| **DND Mode** | Auto-enable during exam hours (configurable by student) |
| **Grouping** | Batch 5+ notifications of same type into one: "5 new circulars posted" |
| **Read tracking** | Notification marked read on click (not on scroll-into-view) |
| **Unread badge** | Real-time count on bell icon via WebSocket |
| **Mute per source** | Student can mute non-critical notifications from specific modules |

---

### 6.6 AI Study Assistant

#### Overview
In-app AI assistant powered by Groq (fast inference) as primary, with Ollama (local Llama 3) as fallback. RAG pipeline using college syllabus indexed in Qdrant vector store. Streaming responses via SSE.

#### AI Architecture

```
Student asks: "Explain binary search trees from my DSA syllabus"
        │
        ▼
┌────────────────────────────┐
│ Context Injection:          │
│ - Student's enrolled subjects│
│ - Current semester          │
│ - Attendance data           │
│ - Assignment deadlines      │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ RAG Pipeline:               │
│ 1. Embed query (sentence-   │
│    transformers)            │
│ 2. Qdrant similarity search │
│    → top 5 syllabus chunks  │
│ 3. Construct prompt with    │
│    student context +        │
│    syllabus context         │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ Model Selection:            │
│ ┌─────────────────────────┐ │
│ │ Try #1: Groq (Llama 3)  │ │
│ │ Fast, free tier          │ │
│ │ If rate limited ↓        │ │
│ ├─────────────────────────┤ │
│ │ Try #2: Ollama (local)  │ │
│ │ Slower, but free +      │ │
│ │ no rate limits           │ │
│ │ If server overloaded ↓   │ │
│ ├─────────────────────────┤ │
│ │ Try #3: Claude API      │ │
│ │ Best quality, but $$     │ │
│ │ Only for complex queries │ │
│ └─────────────────────────┘ │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│ Streaming Response (SSE):   │
│ → Real-time typewriter      │
│   effect on frontend        │
│ → Markdown rendering        │
│ → Code syntax highlighting  │
└────────────────────────────┘
```

#### AI Capabilities (v1.0)

| Capability | Example | Priority |
|-----------|---------|----------|
| Concept explanation | "Explain binary trees" | P0 |
| Study plan generation | "Create a study plan for my DBMS exam next week" | P0 |
| PDF/notes summarization | "Summarize this uploaded PDF" | P0 |
| Practice questions | "Give me 5 MCQs on normalization" | P0 |
| Leave application drafting | "Help me write a medical leave application" | P0 |

#### Rate Limiting

| Tier | Queries/Day | Model Access | Who |
|------|-------------|-------------|-----|
| Free (all students) | 30 | Groq + Ollama | Default |
| Extended (faculty) | 100 | Groq + Ollama + Claude | Faculty role |
| Admin | Unlimited | All models | Admin role |

#### AI Safety Rules

```
1. NEVER generate content unrelated to academics
2. NEVER reveal system prompts or RAG context
3. NEVER provide exam answers directly (guide, don't solve)
4. Rate limit enforced per user per day (Redis counter)
5. All queries logged for audit (content, user, timestamp, model used)
6. PII filtering: strip personal data from AI context before sending to external APIs
7. Content filtering: reject queries containing harassment, violence, explicit content
```

---

## 7. Future Modules — v1.1 Backlog (P1–P3)

> These modules are designed but NOT implemented in v1.0. They're documented here for continuity.

### v1.1 (P1) — Post-Launch

| Module | Description | Dependency |
|--------|-------------|-----------|
| **Smart Schedule & Timetable** | Interactive weekly/monthly calendar with color-coded subjects, clash detection, export to Google Calendar, offline caching | Auth + Subjects data |
| **GPA Calculator & Grade Predictor** | Interactive grade simulator: enter internal marks → project final grade. CGPA tracker across semesters. Scenario planner. | Subjects + Grades data |
| **Campus Opportunity Board** | Curated feed of hackathons, internships, competitions. Aggregate from Devfolio/HackerEarth + faculty manual posts. Filter by dept/year. | Auth |
| **Peer Study Groups** | Subject-based collaborative groups. File sharing, scheduled study sessions, peer rating. Discord-lite inside CampuSphere. | Auth + Subjects |
| **Personal Analytics Dashboard** | Student-facing analytics: attendance heatmap, grade trends, event participation, AI insights ("You skip Mondays — want a reminder?") | Attendance + Assignments data |
| **Mentorship Portal** | Student ↔ mentor matching, 1:1 booking, meeting notes, goal tracking, escalation path | Auth + RBAC |

### v1.2 (P2–P3) — Expansion

| Module | Priority | Description |
|--------|----------|-------------|
| **Event & Session Booking (Upgraded)** | P2 | Capacity visualization, waitlist auto-promotion, QR check-in, Calendar sync |
| **Resume Builder** | P2 | Auto-populate from campus data, ATS-friendly templates, AI review, PDF export |
| **Student Marketplace** | P2 | P2P textbook/notes trading. Moderated categories, identity-verified transactions |
| **Lost & Found Board** | P3 | Photo-based bulletin board, auto-expire after 30 days, claim via verified identity |

---

## 8. Tech Stack

### 8.1 Frontend

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **React 19** + TypeScript | Ecosystem, hiring pool, component model |
| Build Tool | **Vite 6** | Fast HMR, ESBuild speed |
| CSS | **TailwindCSS v4** + **shadcn/ui** | Rapid UI development, consistent design system |
| State (Server) | **TanStack Query v5** | Cache, refetch, optimistic updates for API data |
| State (Client) | **Zustand** | Minimal, no boilerplate, devtools support |
| Routing | **React Router v7** | File-based routing, loaders, error boundaries |
| Forms | **React Hook Form** + **Zod** | Validated forms with zero re-renders |
| Tables | **TanStack Table v8** | Headless, sortable, filterable, paginated |
| Charts | **Recharts** | React-native, responsive, composable |
| Icons | **Lucide React** | Tree-shakeable, consistent, 1000+ icons |
| Rich Text | **Tiptap** | Extensible, collaborative-ready |
| PWA | **Vite PWA Plugin** | Service worker, offline caching, push notifications |
| Real-time | **Native WebSocket** | No library needed — browser API is sufficient |

### 8.2 Backend

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **FastAPI** (Python 3.12) | Async, auto-docs, Pydantic, fastest Python framework |
| ASGI Server | **Uvicorn** + **Gunicorn** | Production-grade, multi-worker |
| ORM | **SQLAlchemy 2.0** (async) | Mature, type-safe, migration support |
| Migrations | **Alembic** | Schema versioning, rollback support |
| Task Queue | **Celery** + **Redis** (broker) | Background tasks, scheduled jobs |
| Auth | **python-jose** (JWT) + **passlib** (bcrypt) | Token generation + password hashing |
| Validation | **Pydantic v2** (strict mode) | Request/response validation, zero trust |
| WebSocket | **FastAPI WebSocket** native | Built-in, no extra dependency |
| Email | **FastAPI-Mail** | Async SMTP, template support |
| Rate Limiting | **slowapi** | Redis-backed, per-IP + per-user |
| Linting | **Ruff** | 10-100x faster than flake8+isort+black combined |
| Testing | **Pytest** + **httpx** (async) | Coverage, fixtures, async test support |

### 8.3 Database & Storage

| Layer | Technology | Why |
|-------|-----------|-----|
| Primary DB | **PostgreSQL 16** | ACID, JSON columns, full-text search, pgcrypto |
| Cache/Broker | **Redis 7** | Sessions, OTP store, Celery broker, rate limiting |
| File Storage | **MinIO** | Self-hosted S3, buckets, pre-signed URLs |
| Vector DB | **Qdrant** | AI RAG pipeline, fast similarity search |

### 8.4 AI & ML

| Layer | Technology | Why |
|-------|-----------|-----|
| Primary LLM | **Groq** (Llama 3 70B) | Free tier, fastest inference |
| Local Fallback | **Ollama** (Llama 3 8B) | No API cost, runs on college server |
| Premium LLM | **Claude API** (Haiku) | Best reasoning, use sparingly |
| Embeddings | **sentence-transformers** | Local embedding generation |
| Orchestration | **LangChain** | RAG pipeline, prompt management |
| Vector Store | **Qdrant** | Similarity search for syllabus context |

### 8.5 Infrastructure & DevOps

| Layer | Technology | Why |
|-------|-----------|-----|
| Containerization | **Docker** + **Docker Compose** | Reproducible, isolated services |
| Reverse Proxy | **Nginx 1.26** | SSL termination, static files, rate limiting |
| SSL | **Certbot** (Let's Encrypt) | Free TLS certificates, auto-renewal |
| CI/CD | **GitHub Actions** | Lint, test, build, deploy pipeline |
| Container Registry | **ghcr.io** | GitHub's free container registry |
| Monitoring | **Prometheus** + **Grafana** | Metrics, dashboards, alerts |
| Error Tracking | **Sentry** | Real-time error tracking with stack traces |
| Log Aggregation | **Loki** + **Promtail** | Centralized logs, Grafana integration |
| OS | **Ubuntu 24.04 LTS** | College server — stable, long-term support |

---

## 9. System Architecture

### 9.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (TLS 1.3)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     NGINX (Reverse Proxy)                     │
│  - SSL termination (Certbot)                                 │
│  - Rate limiting (100 req/min auth, 300 req/min general)     │
│  - Static file serving (React build)                         │
│  - WebSocket upgrade handling                                │
│  - CORS enforcement (single domain whitelist)                │
│  - Security headers (CSP, HSTS, X-Frame-Options)            │
└──────────┬──────────────┬────────────────────────────────────┘
           │              │
    /api/* │       static │ files
           ▼              ▼
┌──────────────────┐  ┌────────────────┐
│   FastAPI         │  │  React SPA     │
│   (Uvicorn ×4)    │  │  (Nginx-served)│
│                   │  │                │
│  ┌─────────────┐  │  │  ┌──────────┐ │
│  │ Auth        │  │  │  │ PWA      │ │
│  │ Service     │  │  │  │ Service  │ │
│  ├─────────────┤  │  │  │ Worker   │ │
│  │ Attendance  │  │  │  └──────────┘ │
│  │ Service     │  │  └────────────────┘
│  ├─────────────┤  │
│  │ Circular    │  │
│  │ Service     │  │
│  ├─────────────┤  │
│  │ Assignment  │  │
│  │ Service     │  │
│  ├─────────────┤  │
│  │ Notification│  │
│  │ Service     │  │
│  ├─────────────┤  │
│  │ AI Service  │  │
│  └─────────────┘  │
└────────┬───────────┘
         │
    ┌────┼──────────────────────────────────┐
    │    │                                  │
    ▼    ▼                                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │   Redis      │  │   MinIO      │
│ (Port 5432)  │  │ (Port 6379)  │  │ (Port 9000)  │
│              │  │              │  │              │
│ - User data  │  │ - OTP store  │  │ - File       │
│ - Attendance │  │ - JWT black  │  │   uploads    │
│ - Circulars  │  │   list       │  │ - Submissions│
│ - Assignments│  │ - Rate limit │  │ - Certificates│
│ - Notif.     │  │   counters   │  │              │
│              │  │ - Celery     │  │              │
│ + pgcrypto   │  │   broker     │  │              │
│ (PII encrypt)│  │ - Cache      │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
         │
         │
    ┌────┼───────────────────┐
    ▼    ▼                   ▼
┌──────────────┐  ┌──────────────────────────┐
│   Qdrant     │  │   Celery Workers         │
│ (Port 6333)  │  │   + Celery Beat          │
│              │  │                          │
│ - Syllabus   │  │ - AI summary generation  │
│   embeddings │  │ - Email digest dispatch  │
│ - RAG search │  │ - Deadline reminder cron │
│              │  │ - Attendance overdue cron│
└──────────────┘  │ - File virus scanning    │
                  └──────────────────────────┘
```

### 9.2 Docker Compose Services

| Service | Container Name | Port | Exposed |
|---------|---------------|------|---------|
| Nginx | `campusphere_nginx` | 80, 443 | ✅ Public |
| React (Nginx-served) | `campusphere_frontend` | — | Via Nginx |
| FastAPI | `campusphere_api` | 8000 | Internal only |
| Celery Worker | `campusphere_worker` | — | Internal |
| Celery Beat | `campusphere_beat` | — | Internal |
| PostgreSQL | `campusphere_postgres` | 5432 | Internal only |
| Redis | `campusphere_redis` | 6379 | Internal only |
| MinIO | `campusphere_minio` | 9000 | Internal only |
| Qdrant | `campusphere_qdrant` | 6333 | Internal only |
| Ollama | `campusphere_ollama` | 11434 | Internal only |
| Prometheus | `campusphere_prometheus` | 9090 | Internal only |
| Grafana | `campusphere_grafana` | 3001 | Internal only |

> [!IMPORTANT]
> **Only Nginx port 80/443 is exposed to the internet.** All other services communicate via Docker's internal network. PostgreSQL, Redis, and MinIO are NEVER directly accessible from outside.

---

## 10. Database Design

### 10.1 Core Tables

| Table | Key Columns | Relationships | Security |
|-------|------------|---------------|----------|
| `users` | id, reg_no, name, email, role, department, year, avatar_url, is_active, failed_login_count, locked_until, device_hashes[] | Has many: enrollments, attendance_records, notifications, submissions | PII encrypted (pgcrypto) |
| `subjects` | id, code, name, credits, department, semester | Has many: slots, enrollments, assignments | — |
| `slots` | id, subject_id, faculty_id, time_start, time_end, venue, day_of_week | Belongs to: subject, faculty | — |
| `attendance_sessions` | id, slot_id, date, in_otp_hash, out_otp_hash, otp_expires_at, status, geo_fence_enabled | Has many: attendance_records | OTP stored as bcrypt hash |
| `attendance_records` | id, session_id, student_id, in_time, out_time, status, device_hash, geo_data, approved_by, created_at | Belongs to: session, student | Status CHECK constraint |
| `circulars` | id, title, content, priority, role_targets[], department_targets[], deadline, ai_summary, created_by, pinned, created_at | Has many: circular_reads, attachments | — |
| `circular_reads` | id, circular_id, user_id, read_at | Belongs to: circular, user | — |
| `assignments` | id, subject_id, title, description, due_at, max_marks, allow_late, faculty_id, created_at | Has many: submissions | — |
| `submissions` | id, assignment_id, student_id, file_paths[], status, grade, feedback, submitted_at, graded_at | Belongs to: assignment, student | File path validated |
| `notifications` | id, user_id, type, title, body, priority, source_type, source_id, read_at, created_at | Belongs to: user | — |
| `ai_queries` | id, user_id, query_text, response_text, model_used, tokens_used, created_at | Belongs to: user | Audit log |
| `workflow_requests` | id, type, student_id, status, payload_json, created_at, resolved_at, escalated_at | Has many: workflow_approvals | — |
| `workflow_approvals` | id, request_id, approver_id, action, comment, acted_at | Belongs to: request, approver | — |
| `refresh_tokens` | id, user_id, token_hash, family_id, is_revoked, expires_at, created_at | Belongs to: user | Token family tracking |

### 10.2 Indexing Strategy

```sql
-- Performance-critical indexes
CREATE UNIQUE INDEX idx_users_reg_no ON users(reg_no);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_attendance_records_session_student ON attendance_records(session_id, student_id);
CREATE INDEX idx_attendance_records_student_date ON attendance_records(student_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_circulars_role_targets ON circulars USING GIN(role_targets);
CREATE INDEX idx_circulars_department_targets ON circulars USING GIN(department_targets);
CREATE INDEX idx_assignments_subject_due ON assignments(subject_id, due_at);
CREATE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);

-- Full-text search
CREATE INDEX idx_circulars_search ON circulars USING GIN(
  to_tsvector('english', title || ' ' || content)
);
CREATE INDEX idx_assignments_search ON assignments USING GIN(
  to_tsvector('english', title || ' ' || description)
);
```

### 10.3 Security Constraints

```sql
-- Attendance status must follow valid state machine
ALTER TABLE attendance_records ADD CONSTRAINT chk_attendance_status
  CHECK (status IN ('ABSENT', 'CHECKED_IN', 'PRESENT', 'PARTIAL',
                    'ON_LEAVE', 'CORRECTION_REQUESTED', 'REJECTED'));

-- Submission status must follow valid states
ALTER TABLE submissions ADD CONSTRAINT chk_submission_status
  CHECK (status IN ('TO_DO', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED',
                    'GRADED', 'OVERDUE'));

-- Role must be one of defined roles
ALTER TABLE users ADD CONSTRAINT chk_user_role
  CHECK (role IN ('student', 'faculty', 'mentor', 'admin'));

-- Notification priority must be valid
ALTER TABLE notifications ADD CONSTRAINT chk_notification_priority
  CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'LOW'));

-- Circular priority must be valid
ALTER TABLE circulars ADD CONSTRAINT chk_circular_priority
  CHECK (priority IN ('URGENT', 'ACTION_REQUIRED', 'INFORMATIONAL', 'LOW_PRIORITY'));

-- Row-Level Security (RLS) for multi-tenant data isolation
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_own_attendance ON attendance_records
  FOR SELECT USING (student_id = current_setting('app.current_user_id')::INT
                    OR current_setting('app.current_user_role') IN ('faculty', 'admin'));
```

---

## 11. API Design

### 11.1 Conventions

| Aspect | Convention |
|--------|-----------|
| Base URL | `https://campusphere.saveetha.edu.in/api/v1/` |
| Auth | Bearer token (JWT) in `Authorization` header |
| Response envelope | `{ "data": ..., "meta": { "page": ..., "total": ... }, "error": null }` |
| Error envelope | `{ "data": null, "meta": null, "error": { "code": "AUTH_401", "message": "...", "details": [...] } }` |
| Pagination | Cursor-based: `?cursor=<opaque>&limit=20` (max 100) |
| Versioning | URL-based: `/v1/`, `/v2/` |
| Rate limiting | Auth endpoints: 20 req/min. General: 300 req/min. AI: 30 req/day |
| CORS | Whitelist: `https://campusphere.saveetha.edu.in` — **NO wildcard** |

### 11.2 Core Endpoints

#### Auth

| Method | Endpoint | Auth | Description | Rate Limit |
|--------|----------|------|-------------|------------|
| `POST` | `/auth/login` | Public | Email + password login → JWT pair | 20/min |
| `POST` | `/auth/google` | Public | Google OAuth2 callback → JWT pair | 20/min |
| `POST` | `/auth/refresh` | Refresh Cookie | Rotate access token | 60/min |
| `POST` | `/auth/logout` | Bearer | Invalidate refresh token + blacklist access token | — |
| `GET` | `/auth/me` | Bearer | Current user profile | 60/min |

#### Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/attendance/sessions` | Student | List sessions for current term |
| `POST` | `/attendance/otp/generate` | Faculty | Generate IN or OUT OTP for a session |
| `POST` | `/attendance/otp/submit` | Student | Submit OTP with device fingerprint |
| `GET` | `/attendance/health` | Student | Attendance percentages per subject |
| `GET` | `/attendance/impact?skip={subject_id}` | Student | "If you skip today" calculator |
| `POST` | `/attendance/correction` | Student | Request manual attendance correction |
| `PATCH` | `/attendance/correction/{id}` | Faculty | Approve/reject correction request |
| `WS` | `/ws/attendance/{session_id}` | Bearer | Live OTP availability broadcast |

#### Circulars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/circulars` | Student | Paginated, filtered circular feed |
| `GET` | `/circulars/{id}` | Student | Full circular detail |
| `POST` | `/circulars` | Faculty/Admin | Create new circular |
| `POST` | `/circulars/{id}/read` | Student | Mark circular as read |
| `PATCH` | `/circulars/{id}/pin` | Faculty/Admin | Pin/unpin circular |
| `GET` | `/circulars/search?q=` | Student | Full-text search |

#### Assignments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/assignments` | Student | List assignments for enrolled subjects |
| `POST` | `/assignments` | Faculty | Create new assignment |
| `PATCH` | `/assignments/{id}/status` | Student | Move assignment to new status column |
| `POST` | `/assignments/{id}/submit` | Student | Upload submission files |
| `PATCH` | `/assignments/{id}/grade` | Faculty | Grade a submission |

#### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | Bearer | Paginated notification feed |
| `GET` | `/notifications/unread-count` | Bearer | Unread count for badge |
| `PATCH` | `/notifications/{id}/read` | Bearer | Mark single notification read |
| `PATCH` | `/notifications/read-all` | Bearer | Mark all notifications read |
| `WS` | `/ws/notifications` | Bearer | Real-time notification stream |

#### AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ai/query` | Student/Faculty | Submit question → SSE streaming response |
| `GET` | `/ai/history` | Student/Faculty | Past AI conversations |
| `GET` | `/ai/quota` | Student/Faculty | Remaining queries today |

---

## 12. Security Model

### 12.1 Security Principles

```
1. ZERO TRUST — validate every request, even from authenticated users
2. DEFENSE IN DEPTH — multiple security layers, no single point of failure
3. LEAST PRIVILEGE — each role has minimum required permissions
4. FAIL SECURE — on error, deny access (never fail open)
5. AUDIT EVERYTHING — log all security-relevant events
```

### 12.2 Authentication Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt, 12 rounds |
| JWT storage | Access: memory only. Refresh: HttpOnly + Secure + SameSite=Strict cookie |
| Token rotation | Single-use refresh tokens with family-based theft detection |
| Brute force | Lock account after 5 failures in 15 min. Progressive delay: 1s, 2s, 4s, 8s, 16s |
| Session limit | Max 3 concurrent sessions per user |
| CSRF protection | Double-submit cookie pattern for state-changing requests |
| OAuth2 | State parameter + PKCE for Google SSO |

### 12.3 Data Security

| Measure | Implementation |
|---------|---------------|
| In-transit encryption | TLS 1.3 via Nginx + Certbot (HSTS enabled, min 1 year) |
| At-rest encryption (PII) | pgcrypto for: email, phone, medical docs, contact info |
| OTP storage | bcrypt hash in Redis — plaintext never stored |
| File uploads | ClamAV scan → allowed MIME whitelist → size limit (25MB) → MinIO |
| Backup encryption | GPG-encrypted pg_dump before off-site sync |
| Log sanitization | PII stripped from application logs (email, reg_no masked) |

### 12.4 API Security

| Measure | Implementation |
|---------|---------------|
| Input validation | Pydantic v2 strict mode — reject unexpected fields |
| SQL injection | SQLAlchemy ORM — parameterized queries only. **No raw SQL.** |
| XSS | React auto-escapes. CSP header blocks inline scripts |
| CORS | Single-origin whitelist: `campusphere.saveetha.edu.in` |
| Rate limiting | Per-IP + per-user via slowapi + Redis |
| Request size limit | 10MB body limit for API, 25MB for file uploads |
| File type validation | Server-side MIME detection (python-magic), not just extension |
| Path traversal | File names sanitized + stored with UUID, original name in DB |

### 12.5 Infrastructure Security

| Measure | Implementation |
|---------|---------------|
| Network isolation | Only Nginx exposed. All services on Docker internal network |
| Docker security | Non-root containers. Read-only file systems where possible |
| Secrets management | `.env` file with strict permissions (600). Never in git. |
| Dependency scanning | GitHub Dependabot + `pip-audit` + `npm audit` in CI |
| OWASP headers | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin |
| SSH hardening | Key-based auth only. Fail2ban. No root SSH. Port changed from 22 |

### 12.6 Security Audit Checklist (Pre-Launch)

- [ ] OWASP Top 10 review against all endpoints
- [ ] ZAP automated scan with no HIGH/CRITICAL findings
- [ ] JWT implementation review (no algorithm confusion, proper validation)
- [ ] File upload penetration test (SVG XSS, path traversal, zip bomb)
- [ ] Rate limiting verification under load
- [ ] RBAC matrix tested — every role × every endpoint
- [ ] Refresh token rotation theft detection tested
- [ ] Geo-fence + device binding tested with spoofed data
- [ ] Dependency audit — no known CVEs
- [ ] Backup restore tested — data integrity verified
- [ ] SSL configuration: A+ rating on ssllabs.com

---

## 13. UI/UX Design System

### 13.1 Design Philosophy

> **"Calm Tech"** — powerful features presented without cognitive overload.
> The UI should feel closer to **Notion** or **Linear** than a government ERP portal.

### 13.2 Design Tokens

#### Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--brand-primary` | `#1E3A5F` | `#60A5FA` | Navigation, headings, key actions |
| `--accent` | `#2563EB` | `#3B82F6` | Buttons, links, active states, progress |
| `--success` | `#059669` | `#34D399` | Present, submitted, confirmed |
| `--warning` | `#D97706` | `#FBBF24` | Partial, deadline near, low attendance |
| `--danger` | `#DC2626` | `#F87171` | Absent, overdue, critical alerts |
| `--bg-primary` | `#FFFFFF` | `#0F172A` | Page background |
| `--bg-secondary` | `#F8FAFC` | `#1E293B` | Cards, panels |
| `--bg-tertiary` | `#F1F5F9` | `#334155` | Hover states, dividers |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Body text |
| `--text-secondary` | `#64748B` | `#94A3B8` | Labels, placeholders |
| `--border` | `#E2E8F0` | `#334155` | Card borders, dividers |

#### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-body` | `'Inter', sans-serif` | All body text, UI labels |
| `--font-heading` | `'Sora', sans-serif` | Display headings, page titles |
| `--font-mono` | `'JetBrains Mono', monospace` | Code blocks, OTP display |
| `--text-xs` | `0.75rem (12px)` | Labels, badges |
| `--text-sm` | `0.875rem (14px)` | Body text, table data |
| `--text-base` | `1rem (16px)` | Primary content |
| `--text-lg` | `1.125rem (18px)` | Section headings |
| `--text-xl` | `1.25rem (20px)` | Card titles |
| `--text-2xl` | `1.5rem (24px)` | Page titles |

#### Spacing & Borders

| Token | Value |
|-------|-------|
| `--radius-sm` | `6px` — inputs, small elements |
| `--radius-md` | `8px` — cards, panels |
| `--radius-lg` | `12px` — modals, popovers |
| `--radius-full` | `9999px` — avatars, badges |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` |

### 13.3 Layout System

```
DESKTOP (≥1024px)                    MOBILE (<1024px)
┌────┬─────────────────┐            ┌─────────────────┐
│    │                 │            │                 │
│ S  │    Main         │            │    Main         │
│ I  │    Content      │            │    Content      │
│ D  │    Area         │            │    Area         │
│ E  │                 │            │                 │
│ B  │                 │            │                 │
│ A  │                 │            │                 │
│ R  │                 │            ├─────────────────┤
│    │                 │            │ ☐  ☐  ☐  ☐  ☐ │
└────┴─────────────────┘            │  Bottom Tab Bar │
 240px    flex-1                    └─────────────────┘
```

### 13.4 Key UX Decisions

| Decision | Implementation | Rationale |
|----------|---------------|-----------|
| Mobile-first | Design for 375px first, then scale up | 80%+ of student usage will be mobile |
| Sidebar → Tab bar | Desktop sidebar collapses to mobile bottom tabs | Thumb-reachable navigation |
| Dark mode | System preference detection + manual toggle | Reduces eye strain in late-night study |
| Skeleton loading | Every data-fetching view shows animated placeholder | Feels faster than blank → content flash |
| Empty states | Illustrated empty states with clear CTA | New users aren't confused by blank screens |
| Toasts | Top-right (desktop) / top-center (mobile), auto-dismiss 5s | Non-blocking success/error feedback |
| Keyboard navigation | All interactive elements reachable via Tab + Enter | Accessibility — WCAG 2.1 AA |
| Reduced motion | Respect `prefers-reduced-motion` CSS media query | Accessibility — vestibular sensitivity |
| Optimistic updates | Attendance submit, notification read — update UI before server confirms | Feels instant |

### 13.5 Component Library (shadcn/ui)

Pre-built components to use (not reinvent):

| Component | Usage |
|-----------|-------|
| `Button` | Primary, Secondary, Ghost, Danger variants |
| `Card` | Circular cards, assignment cards, attendance widgets |
| `Dialog` | OTP entry, confirmation modals |
| `Toast` | Success/error feedback |
| `Badge` | Priority tags, status indicators |
| `Tabs` | Module sub-navigation |
| `Table` | Assignment list, attendance records |
| `Command` | Search palette (Cmd+K) |
| `Sheet` | Mobile action panels |
| `Skeleton` | Loading states |

---

## 14. Deployment Strategy

### 14.1 Infrastructure

| Aspect | Detail |
|--------|--------|
| Server | Saveetha Engineering College's Ubuntu 24.04 LTS server |
| Domain | `campusphere.saveetha.edu.in` |
| SSL | Certbot (Let's Encrypt) with auto-renewal cron |
| DNS | Managed by college IT — CNAME to server IP |
| Orchestration | Docker Compose (not Kubernetes — overkill for single server) |

### 14.2 CI/CD Pipeline

```
Developer pushes to feature/* branch
        │
        ▼
┌────────────────────────────┐
│ GitHub Actions Trigger:     │
│ 1. ESLint + TypeScript check│
│ 2. Ruff (Python lint)       │
│ 3. Vitest (frontend tests)  │
│ 4. Pytest (backend tests)   │
│ 5. pip-audit + npm audit    │
│ 6. OWASP ZAP baseline scan │
└────────┬───────────────────┘
         │ All pass?
         ▼
┌────────────────────────────┐
│ PR merged to main:         │
│ 1. Build Docker images     │
│ 2. Push to ghcr.io          │
│ 3. SSH into college server  │
│ 4. docker compose pull      │
│ 5. docker compose up -d     │
│ 6. Health check (curl /api/ │
│    health returns 200)      │
│ 7. Sentry release + notify  │
└────────────────────────────┘
         │ Health check fails?
         ▼
┌────────────────────────────┐
│ Auto-rollback:              │
│ 1. docker compose down      │
│ 2. Revert to previous image │
│ 3. docker compose up -d     │
│ 4. Alert dev via Sentry     │
└────────────────────────────┘
```

### 14.3 Backup Strategy

| Data | Frequency | Method | Retention |
|------|-----------|--------|-----------|
| PostgreSQL | Daily 2 AM | `pg_dump` → GPG encrypt → MinIO backup bucket | 30 days |
| PostgreSQL WAL | Continuous | WAL archiving for point-in-time recovery | 7 days |
| MinIO files | Daily 3 AM | `rclone sync` to external drive | 30 days |
| Redis | Continuous | AOF persistence | Last state only |
| Off-site | Weekly (Sunday 4 AM) | Encrypted backup to off-campus storage | 90 days |

### 14.4 Monitoring & Alerting

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| Server uptime | UptimeRobot | Down > 1 minute |
| API response time | Prometheus | P95 > 500ms |
| Error rate | Sentry | > 1% 5xx in 5 min window |
| Disk usage | Prometheus | > 80% |
| PostgreSQL connections | Prometheus | > 80% of max_connections |
| Redis memory | Prometheus | > 70% of max memory |
| Failed logins | Application logs | > 20 per IP in 5 minutes |
| Certificate expiry | Certbot + cron | < 14 days until expiry |

---

## 15. Development Roadmap (Solo Dev)

> [!IMPORTANT]
> **20 weeks, not 16.** Extending by 4 weeks is realistic for a solo developer building a production-grade, security-hardened platform. Cutting corners on security to save 4 weeks is not acceptable for a system handling student PII.

### Phase 1 — Foundation (Weeks 1–5)

| Week | Deliverables | Focus |
|------|-------------|-------|
| 1 | Project scaffolding: Vite + React + FastAPI + Docker Compose + PostgreSQL + Redis + MinIO. CI/CD pipeline (GitHub Actions). Linting + formatting config. | Infrastructure |
| 2 | Database schema (all tables) + Alembic migrations. Seed data script (sample students, faculty, subjects). | Database |
| 3 | Auth system: Google OAuth2 SSO + email/password fallback. JWT with refresh token rotation. RBAC middleware. Rate limiting. | Security |
| 4 | Auth UI: Login page, protected routes, role-based navigation. Sidebar + bottom tab layout. Dark mode toggle. | Frontend |
| 5 | Integration testing for auth flows. Security review of JWT implementation. Device fingerprinting setup. | Testing |

### Phase 2 — Core Modules (Weeks 6–12)

| Week | Deliverables | Focus |
|------|-------------|-------|
| 6 | Attendance API: OTP generation, submission with anti-cheat (device binding), state machine, WebSocket broadcast. | Backend |
| 7 | Attendance UI: OTP entry modal, attendance health widget, heatmap, leave impact calculator. Faculty dashboard. | Frontend |
| 8 | Circulars API + UI: CRUD, AI summary generation (Groq), priority classification, filtering, search, read receipts, pin. | Full Stack |
| 9 | Assignments API + UI: CRUD, Kanban board, file submission with validation, deadline reminders (Celery). | Full Stack |
| 10 | Notification system: WebSocket hub, priority queue, browser push (PWA), email digest (Celery Beat). | Full Stack |
| 11 | PWA setup: service worker, offline caching, install prompt, push notification subscription. | Frontend |
| 12 | Integration testing for all modules. Cross-module testing (e.g., assignment creates notification). | Testing |

### Phase 3 — AI & Polish (Weeks 13–17)

| Week | Deliverables | Focus |
|------|-------------|-------|
| 13 | AI backend: Groq + Ollama integration, RAG pipeline with Qdrant, syllabus PDF indexing, rate limiting. | AI/Backend |
| 14 | AI UI: Chat interface, streaming response display, query history, quota display. Content safety filters. | Frontend |
| 15 | Workflow requests: leave application, attendance correction, reward claim. Pipeline engine + SLA timer. | Full Stack |
| 16 | Monitoring stack: Prometheus + Grafana + Loki + Sentry. Alert rules. Health check endpoint. | DevOps |
| 17 | Performance optimization: Lighthouse audit, bundle analysis, lazy loading, image optimization, query optimization. | Performance |

### Phase 4 — Security & Launch (Weeks 18–20)

| Week | Deliverables | Focus |
|------|-------------|-------|
| 18 | Security audit: OWASP ZAP scan, RBAC matrix test, file upload pen test, JWT review, rate limit verification. Fix all findings. | Security |
| 19 | Beta launch with 1 department (~200 students). Collect feedback. Fix P0/P1 bugs. | Launch |
| 20 | Bug fixes from beta. Documentation (API docs, deployment guide). Full launch to remaining departments. | Launch |

---

## 16. Risk Analysis & Mitigation

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Server downtime during exams** | Medium | Critical | Nginx caching + PWA offline mode for cached data. UptimeRobot alerts. |
| 2 | **OTP anti-cheat circumvented** | Medium | High | Layer 1 (device binding) is hard to spoof. Layer 2 (geo) is supplementary. Layer 3 (3-min window) limits sharing time. Faculty dashboard shows flagged entries. |
| 3 | **Solo dev burnout** | High | Critical | 20-week timeline with buffer. P0 features only. shadcn/ui to eliminate UI work. Weekly scope check. |
| 4 | **Groq/Claude API outage** | Low | Medium | Ollama (local Llama 3) as automatic fallback. AI feature degrades gracefully — rest of app unaffected. |
| 5 | **Data privacy breach** | Low | Critical | Encrypted PII, strict RBAC, no third-party analytics, no wildcard CORS, security audit at Week 18. |
| 6 | **Low student adoption** | Medium | High | Onboarding tour for first login. Attendance system mandated by faculty (not optional). Push notifications for engagement. |
| 7 | **Scope creep** | High | Medium | Feature freeze after Week 12. All new ideas go to v1.1 backlog. PRD is the single source of truth. |
| 8 | **AI generating harmful content** | Low | High | Content safety filters, academic-only system prompt, query logging, rate limiting. |
| 9 | **File upload storage exhaustion** | Medium | Low | 25MB per file, 5 files per submission. Monitoring alerts at 80% disk. MinIO lifecycle policies for old files. |
| 10 | **College IT blocks required ports** | Low | Medium | Only port 80/443 needed. All services on Docker internal network. Pre-coordinate with IT team. |

---

## 17. Appendix

### 17.1 Glossary

| Term | Definition |
|------|-----------|
| **OTP** | One-Time Password — used for attendance verification |
| **RBAC** | Role-Based Access Control — permission system based on user roles |
| **RAG** | Retrieval-Augmented Generation — AI technique combining search + generation |
| **PWA** | Progressive Web App — installable, offline-capable web application |
| **SPA** | Single Page Application — client-side rendered web app |
| **SSE** | Server-Sent Events — one-way streaming from server to client |
| **SLA** | Service Level Agreement — response time commitment for workflows |
| **PKCE** | Proof Key for Code Exchange — OAuth2 security extension |
| **CSP** | Content Security Policy — browser header preventing XSS |
| **HSTS** | HTTP Strict Transport Security — forces HTTPS connections |
| **WAL** | Write-Ahead Logging — PostgreSQL recovery mechanism |
| **P0/P1/P2/P3** | Priority levels: P0 = launch blocker, P3 = nice-to-have |

### 17.2 Old Stack vs New Stack

| Category | Old Stack | New Stack |
|----------|----------|-----------|
| Frontend | Django Templates + jQuery + Bootstrap | React 19 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Backend | Django | FastAPI (Python 3.12) |
| Database | Unknown (likely MySQL) | PostgreSQL 16 + Redis 7 |
| File Storage | Local filesystem | MinIO (self-hosted S3) |
| Charts | Chart.js | Recharts |
| Icons | Bootstrap Icons + Font Awesome | Lucide React |
| Web Server | Nginx 1.18 | Nginx 1.26 (Docker) |
| OS | Ubuntu (unknown version) | Ubuntu 24.04 LTS |
| AI | None | Groq + Ollama + Claude + Qdrant + LangChain |
| Containers | None | Docker + Docker Compose |
| Monitoring | None | Prometheus + Grafana + Sentry + Loki |
| CI/CD | None | GitHub Actions → ghcr.io → SSH deploy |
| Real-time | None | WebSocket (FastAPI native) |
| Mobile | None (desktop-only) | PWA (service worker, push notifications, offline) |
| Security | Basic Django auth | JWT + SSO + RBAC + pgcrypto + ClamAV + rate limiting |

### 17.3 API Response Format Examples

#### Success Response
```json
{
  "data": {
    "id": 1,
    "title": "5G Hackathon Registration Open",
    "ai_summary": "Registration open for 5G Hackathon on May 15. Teams of 3-4. Register by May 10.",
    "priority": "ACTION_REQUIRED",
    "deadline": "2026-05-10T23:59:00Z"
  },
  "meta": {
    "cursor": "eyJpZCI6IDEwfQ==",
    "has_more": true
  },
  "error": null
}
```

#### Error Response
```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "ATTENDANCE_OTP_EXPIRED",
    "message": "The OTP has expired. Please ask your faculty to generate a new one.",
    "details": [
      {
        "field": "otp",
        "issue": "OTP expired 45 seconds ago"
      }
    ]
  }
}
```

### 17.4 Environment Variables Template

```env
# === DATABASE ===
DATABASE_URL=postgresql+asyncpg://campusphere:CHANGE_ME@campusphere_postgres:5432/campusphere
REDIS_URL=redis://campusphere_redis:6379/0

# === AUTH ===
JWT_SECRET_KEY=CHANGE_ME_64_CHAR_RANDOM_STRING
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=CHANGE_ME
ALLOWED_EMAIL_DOMAIN=saveetha.ac.in

# === STORAGE ===
MINIO_ENDPOINT=campusphere_minio:9000
MINIO_ACCESS_KEY=CHANGE_ME
MINIO_SECRET_KEY=CHANGE_ME
MINIO_BUCKET=campusphere-uploads

# === AI ===
GROQ_API_KEY=CHANGE_ME
CLAUDE_API_KEY=CHANGE_ME  # optional
OLLAMA_BASE_URL=http://campusphere_ollama:11434
QDRANT_URL=http://campusphere_qdrant:6333
AI_DAILY_QUOTA_STUDENT=30
AI_DAILY_QUOTA_FACULTY=100

# === EMAIL ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=campusphere@saveetha.ac.in
SMTP_PASSWORD=CHANGE_ME

# === MONITORING ===
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# === SECURITY ===
CORS_ORIGINS=https://campusphere.saveetha.edu.in
RATE_LIMIT_AUTH=20/minute
RATE_LIMIT_GENERAL=300/minute
```

---

> **— END OF DOCUMENT —**
>
> CampuSphere PRD v2.0 | Bala Saravanan K | Saveetha Engineering College | April 2026
