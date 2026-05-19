
Admin: admin@campusphere.com / Admin@2026!
Staff: staff@saveetha.ac.in / Staff@2026!
Student: student@saveetha.ac.in / Student@2026!

CAMPUSPHERE
All-in-One College Student Workspace Platform
─────────────────────────────────────────


Product Requirements Document (PRD)
Version 1.0  |  April 2026
Saveetha Engineering College  |  AI & Data Science


Prepared by: Bala Saravanan K  (24900611)

CONFIDENTIAL  |  INTERNAL USE ONLY

Table of Contents
1.  Executive Summary
2.  Problem Statement
3.  Target Users & Personas
4.  Goals & Success Metrics
5.  Existing System Analysis (SEC Learner Portal)
6.  Core Features (Rebuilt & Enhanced)
7.  New Features (CampuSphere-Exclusive)
8.  Complete Tech Stack
9.  System Architecture
10. Database Design
11. API Design
12. UI/UX Design Principles
13. Security & Compliance
14. Deployment Strategy
15. Development Roadmap
16. Risk Analysis
17. Appendix

1. Executive Summary
CampuSphere is a modern, full-stack college student workspace platform designed to replace fragmented college portals with a single, beautifully designed, AI-powered hub. Built specifically for students at Saveetha Engineering College (and scalable to any institution), it consolidates attendance tracking, mentorship, event booking, circulars, academics, and 8+ brand-new features into one cohesive product.

The existing SEC Learner Portal (learner.saveetha.in) is functional but built on an aging stack — Django + jQuery + Bootstrap. CampuSphere replaces it with a modern React + FastAPI + PostgreSQL stack, hosted on the college's own infrastructure, while dramatically expanding features and student experience quality.


2. Problem Statement
2.1 Current Pain Points
Attendance system requires physical OTP entry with no offline support or error recovery.
No single view for all academic deadlines, events, and personal tasks.
Circulars (98+ unread) pile up with no intelligent filtering or priority marking.
Workflow requests (leave, attendance corrections) have no real-time status updates.
Zero AI or personalization — every student sees the exact same interface.
Mobile experience is unusable — the portal is desktop-only by design.
No peer collaboration tools — no study groups, peer notes, or shared resources.
No internship/hackathon discovery integrated with the academic system.
Reward points exist but lack gamification or meaningful redemption paths.

2.2 Opportunity
Students spend 4+ years on campus. The digital tools they use daily should be as good as the apps they choose voluntarily — Notion, Discord, Swiggy. CampuSphere bridges this gap by delivering a product-grade experience built by students, for students, on infrastructure the college already owns.

3. Target Users & Personas

4. Goals & Success Metrics
4.1 Business Goals
Reduce attendance-related disputes by 80% through transparent digital trails.
Increase circular read-rate from <20% to >70% via smart notification system.
Cut workflow request resolution time from 3-5 days to under 24 hours.
Provide a self-hosted, cost-effective alternative to third-party ERP systems.

4.2 Product Goals
Build a platform students actually want to open daily (DAU > 60% of enrolled students).
Ship a fully functional v1.0 on college servers within 16 weeks.
Achieve Lighthouse performance score > 90 on mobile.
Zero critical security vulnerabilities at launch.

4.3 Key Performance Indicators (KPIs)

5. Existing System Analysis
5.1 What the Current Portal Does Well
OTP-based dual-step attendance (IN + OUT) with audit trail is a strong concept.
Circular tracking with role-based filtering (Participant / Mentor).
Workflow engine for leave requests, attendance corrections, reward claims.
Event session booking with capacity management and waitlisting.
Integrated mentorship and mentee management.

5.2 What Needs to Change

6. Core Features (Rebuilt & Enhanced)
6.1 Smart Schedule & Timetable
Overview
A fully interactive weekly/monthly calendar view for all classes, events, and personal tasks — replacing the basic weekly grid.
Features
Week/day/month toggle with drag-scroll navigation.
Color-coded subject blocks (each subject gets a unique color per student preference).
Clash detection — alert when events overlap with classes.
Export schedule to Google Calendar / iCal format.
Semester view with exam dates highlighted.
Offline access — cached schedule available without internet.
User Stories
As a student, I can view my full week at a glance so I can plan study sessions.
As a student, I get notified 15 min before each class starts.
As a student, I can add personal tasks/events to my schedule.

6.2 Attendance System (OTP + Smart Recovery)
Overview
Enhanced OTP-based attendance with error recovery, real-time status, and attendance health analytics.
Features
IN OTP + OUT OTP flow preserved — with cleaner mobile UI.
Attendance health meter: shows % per subject, overall, and danger-zone alerts (<75%).
Leave impact calculator: 'If you skip today, your attendance drops to X%'.
Manual attendance request with supporting document upload.
Faculty dashboard: generate OTPs, view real-time attendance, flag absentees.
Attendance heatmap (GitHub-style) showing presence pattern over the semester.
Export attendance PDF for scholarship/placement purposes.
Attendance States

6.3 Circulars & Announcements (AI-Triage)
Overview
Redesigned circulars feed with AI summarization, priority ranking, and action tracking — solving the '98 unread' problem permanently.
Features
AI-generated 2-line summaries for each circular so students don't have to read 5-page PDFs.
Priority tags: URGENT / ACTION REQUIRED / INFO / DEADLINE TODAY.
Smart filter: filter by department, cluster, role, date, and status.
Deadline tracker: circulars with registration deadlines show countdown timers.
Read receipts with faculty/admin visibility toggle.
Pin important circulars to the top of the feed.
One-click registration for events linked to circulars (e.g., 5G Hackathon).

6.4 Workflow Requests (Automated Pipeline)
Supported Request Types
General Letter
Event Application
Leave Application (with medical certificate upload)
Manual Academic Attendance Correction
Manual Event Attendance
Reward Claim & Redemption
Enhancements
Real-time status updates with push notifications at each pipeline stage.
SLA timer: each request shows time remaining before escalation.
Auto-escalation: if approver is inactive >24h, request escalates to next authority.
Request templates: pre-fill common reasons (medical, family emergency, etc.).
Batch approval for faculty: approve multiple requests in one action.
Full audit log downloadable as PDF.

6.5 Mentorship Portal
Features
Student-facing: view assigned mentor, book 1:1 slots, chat, submit issues.
Mentor-facing: manage mentees list, track academic health, flag at-risk students.
Structured meeting notes: both parties can add notes post-meeting.
Goal setting: students set semester goals; mentor tracks progress.
Escalation path: mentor can escalate concerns to HoD with one click.
Mentorship analytics: meeting frequency, issue resolution rate, goal completion.

6.6 Event & Session Booking (Upgraded)
Features
Persistent booking state with cancel/reschedule within allowed windows.
Capacity visualizer: see how full each session is in real-time.
Waitlist auto-promotion with instant notification when a slot opens.
QR-code-based check-in at event venues (replaces manual registers).
Calendar sync: booked events auto-added to personal schedule.
Feedback form auto-triggered post-event.

6.7 Subjects Learning & Academics
Features
Subject cards with real-time attendance %, total sessions, and feedback status.
Study materials upload by faculty — students receive instant notifications.
Per-subject performance graph: session-by-session attendance trend.
Feedback reminder system — prompts students to submit pending feedback.
GPA calculator (see new features section).

7. New Features (CampuSphere-Exclusive)
These features do not exist in the current SEC portal and represent the key differentiators of CampuSphere.

7.1 AI Study Assistant
Priority:   P0 — Flagship Feature  
An in-app AI assistant powered by Groq (fast inference) + Claude API. Students can ask questions about their syllabus, get study plans, and request concept explanations — all within the campus workspace.
Capabilities
'Explain this concept from my syllabus' — subject-aware Q&A.
Auto-generate study plans based on exam schedule and current attendance.
Summarize uploaded PDFs and lecture notes.
Practice question generator by topic and difficulty level.
'Help me write a leave application' — workflow request drafting assistant.
Technical Implementation
Model: Groq Llama-3 for speed + Claude API for complex reasoning tasks.
RAG pipeline: college syllabus PDFs indexed in a vector store (Qdrant).
Context injection: student's schedule, enrolled subjects, and performance data fed as context.
Rate limiting: 20 queries/day for free tier, unlimited for premium.

7.2 Assignment & Deadline Tracker
Priority:   P0  
A Kanban-style assignment board integrated with the academic calendar. Faculty can post assignments; students manage them through stages.
Features
Kanban columns: To Do → In Progress → Review → Submitted → Graded.
Faculty can post assignments with attachments, rubrics, and deadlines.
Students receive escalating reminders: 7 days, 3 days, 1 day, 2 hours before deadline.
File submission within the app — no external email or portal needed.
Grade feedback visible in-app once faculty marks submissions.
Deadline heatmap: shows heavy-load weeks so students can plan ahead.

7.3 GPA Calculator & Grade Predictor
Priority:   P1  
An interactive grade simulator that lets students calculate their current GPA and project what scores they need to hit target GPAs.
Features
Enter internal marks → auto-calculate projected final grade.
Scenario planner: 'What score do I need in finals to get an A?'
CGPA tracker across all semesters with trend line.
Subject-wise credit weighting using the college's grading policy.
Export grade report for scholarship or internship applications.

7.4 Campus Opportunity Board (Hackathons & Internships)
Priority:   P1  
A curated feed of hackathons, internships, competitions, and scholarships — pulled from real sources and posted by faculty — filtered for the student's department and year.
Features
Aggregate from Devfolio, HackerEarth, Internshala (web scraping or API).
Faculty and placement cell can manually post opportunities.
Filter by: department, year, stipend range, remote/onsite, deadline.
One-click 'Apply' with profile pre-fill using resume data.
'Team Up' button: post that you're looking for teammates for a hackathon.
Application tracker: track which opportunities you've applied for.

7.5 Peer Study Groups
Priority:   P1  
Lightweight collaborative groups organized around subjects, projects, or events. Think of it as Discord lite — but inside the campus portal.
Features
Create groups by subject, year, or custom topic.
File sharing: notes, PDFs, code snippets.
Shared whiteboard for visual problem-solving.
Scheduled group study sessions with reminders.
Peer rating system: upvote helpful notes and explanations.

7.6 Smart Notification Center
Priority:   P0  
A unified, priority-ranked notification system replacing the current zero-notification experience.
Notification Channels
In-app: real-time notification bell with unread count.
Push notifications: browser PWA push for class reminders, OTP windows.
Email digest: daily 8 AM summary of upcoming deadlines and pending actions.
WhatsApp integration (optional): connect WhatsApp number for critical alerts.
Smart Features
Do Not Disturb mode during exam hours.
Notification grouping: batch minor notifications, surface critical ones instantly.
Notification analytics: see which alerts you're ignoring (helps optimize DND rules).

7.7 Resume Builder
Priority:   P2  
An in-portal resume builder that auto-populates from verified campus data (projects, attendance, events, certifications) and exports clean PDF resumes.
Features
Auto-fill from campus data: enrolled subjects, event participation, rewards, GPA.
Manual add: projects, internships, skills, certifications.
Multiple resume templates (ATS-friendly, creative, minimal).
AI review: 'Your resume is missing a skills section — here's a suggestion.'
One-click PDF export with verified badge for campus-linked entries.

7.8 Student Marketplace
Priority:   P2  
A peer-to-peer marketplace for buying, selling, or borrowing academic resources within the campus community.
Allowed Categories
Textbooks and reference books.
Handwritten notes and study guides.
Lab equipment and components.
Project kits and hardware modules.
Free give-away items (seniors leaving campus).
7.9 Personal Analytics Dashboard
Priority:   P1  
A student-facing analytics dashboard that turns raw academic data into actionable insights — the kind of thing placement officers currently have to manually compile.
Metrics Shown
Attendance heatmap by subject and overall.
Grade trend across terms.
Event participation score vs. peers (anonymized).
Reward points earned vs. redeemed.
AI insight: 'You tend to miss classes on Mondays — want us to set a reminder?'
7.10 Lost & Found Board
Priority:   P3  
A simple photo-based lost & found bulletin board for the campus community.
Post lost or found items with photo, location, and date.
Claim via in-app message (identity verified via college ID).
Auto-expire listings after 30 days.

8. Complete Tech Stack
The existing stack (Django + jQuery + Bootstrap + Nginx) is replaced entirely with a modern, maintainable, high-performance stack. All components are self-hostable on the college's Ubuntu servers.

8.1 Frontend

8.2 Backend

8.3 Database & Storage

8.4 AI & ML Services

8.5 Infrastructure & DevOps

9. System Architecture
9.1 High-Level Architecture Overview
CampuSphere follows a clean three-tier architecture with a React SPA frontend, FastAPI backend, and PostgreSQL + Redis data layer — all containerized and deployed behind Nginx on the college's server.


9.2 Service Breakdown
Auth Service
JWT-based authentication with refresh token rotation.
Role-based access control (RBAC): Student, Faculty, Mentor, Admin.
OAuth2 SSO with college email (optional integration with GSuite).
Attendance Service
OTP generation with Redis TTL (OTP expires in 10 minutes).
WebSocket broadcast: when faculty generates OTP, all connected students in the room receive it.
State machine: each attendance record moves through defined states (see Section 6.2).
Notification Service
WebSocket hub: each connected user has a persistent channel.
Celery tasks dispatch emails, push notifications, and WhatsApp messages async.
Priority queue: CRITICAL > HIGH > NORMAL > LOW.
AI Service
REST endpoint: POST /api/ai/query — accepts student context + question, returns response.
RAG query: embeds question → Qdrant similarity search → Claude/Groq generation.
Streaming response via Server-Sent Events (SSE) for real-time typewriter effect.

10. Database Design
10.1 Core Tables

10.2 Database Indexing Strategy
attendance_records: composite index on (session_id, student_id) — most queried pair.
notifications: index on (user_id, read_at) — feeds unread count badge.
circulars: GIN index on role_targets array column for fast role-based filtering.
users: unique index on reg_no and email.
Full-text search index on circulars.title and opportunities.title using pg_trgm.

11. API Design
11.1 API Conventions
Base URL: https://campusphere.saveetha.edu.in/api/v1/
Authentication: Bearer token (JWT) in Authorization header.
Response format: JSON with consistent envelope { data, meta, error }.
Pagination: cursor-based using ?cursor= and ?limit= params.
Versioning: URL-based (/v1/, /v2/) — never break existing integrations.

11.2 Core Endpoints

12. UI/UX Design Principles
12.1 Design Philosophy
CampuSphere follows a 'calm tech' design philosophy — powerful features presented without cognitive overload. The UI should feel closer to Notion or Linear than a government portal.

12.2 Design System

12.3 Key UX Decisions
Mobile-first: all layouts designed for 375px wide screen first, then desktop.
Sidebar navigation on desktop collapses to bottom tab bar on mobile.
Dark mode: full dark theme support via Tailwind dark: classes.
Skeleton loading: every data-fetching view shows animated skeleton before data loads.
Empty states: every empty list/table has an illustrated empty state with a call-to-action.
Keyboard accessibility: all interactive elements reachable via Tab + Enter.
Reduced motion: respect prefers-reduced-motion for animations.

13. Security & Compliance
13.1 Authentication & Authorization
JWT access tokens: 15-minute expiry. Refresh tokens: 30-day expiry with rotation.
RBAC: four roles (Student, Faculty, Mentor, Admin) with fine-grained permission scopes.
Rate limiting: 100 req/min per IP on auth endpoints (Nginx + Redis).
Brute force protection: account lock after 5 failed login attempts within 15 minutes.

13.2 Data Security
All data encrypted in transit via TLS 1.3 (Nginx + Certbot).
Sensitive fields (passwords) hashed with bcrypt (12 rounds).
OTPs stored in Redis with strict TTL — never persisted to PostgreSQL.
File uploads scanned for malware via ClamAV before storage in MinIO.
Personal data (medical certificates, contact info) encrypted at rest in PostgreSQL using pgcrypto.

13.3 API Security
CORS: whitelist only the campus domain — no wildcard origins.
Input validation: Pydantic v2 strict mode on all endpoints.
SQL injection: SQLAlchemy ORM with parameterized queries — no raw SQL.
OWASP Top 10 review before each major release.
Dependency scanning: GitHub Dependabot + Snyk in CI pipeline.

14. Deployment Strategy
14.1 Infrastructure Overview
CampuSphere is self-hosted on Saveetha Engineering College's Ubuntu 24.04 LTS server. All services run in Docker containers orchestrated with Docker Compose. SSL is handled by Nginx + Certbot.

14.2 Docker Services

14.3 CI/CD Pipeline (GitHub Actions)
Developer pushes to feature branch.
GitHub Actions triggers: lint (ESLint + Ruff) + test (Vitest + Pytest).
On merge to main: Docker images built and pushed to GitHub Container Registry (ghcr.io).
Deploy job: SSH into college server → pull new images → docker compose up -d → health check.
On failure: Sentry alert + Slack notification to dev team.

14.4 Backup Strategy
PostgreSQL: daily pg_dump to MinIO bucket + weekly off-site backup.
MinIO data: synced to external drive daily via rclone.
Redis: AOF persistence enabled — recover in-progress tasks after crash.
Database point-in-time recovery: WAL archiving enabled.

15. Development Roadmap
Phase 1 — Foundation (Weeks 1–4)

Phase 2 — Core Modules (Weeks 5–8)

Phase 3 — New Features (Weeks 9–13)

Phase 4 — Polish & Launch (Weeks 14–16)

16. Risk Analysis

17. Appendix
17.1 Glossary
OTP — One-Time Password used for attendance verification.
RBAC — Role-Based Access Control.
RAG — Retrieval-Augmented Generation (AI technique).
PWA — Progressive Web App (installable, offline-capable web app).
SPA — Single Page Application.
SLA — Service Level Agreement (response time commitment).
DXA — Document XML Attribute, unit system used in OOXML (Word) documents.
P0/P1/P2/P3 — Priority levels: P0 = must-have launch blocker, P3 = nice to have.

17.2 Existing Stack vs. New Stack Summary


— END OF DOCUMENT —
CampuSphere PRD v1.0  |  Bala Saravanan K  |  Saveetha Engineering College  |  April 2026