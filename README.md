# CampuSphere

**All-in-One College Student Workspace Platform**

CampuSphere is a modern, full-stack college student workspace platform designed to replace fragmented college portals with a single, beautifully designed, AI-powered hub. Built specifically for students at Saveetha Engineering College (and scalable to any institution), it consolidates attendance tracking, mentorship, event booking, circulars, academics, and brand-new features into one cohesive product.

## 🚀 Overview

The digital tools students use daily should be as good as the apps they choose voluntarily. CampuSphere delivers a product-grade experience built by students, for students, bridging the gap between outdated ERP systems and modern software expectations.

### Key Features

**Core Upgrades:**
* **Smart Schedule & Timetable:** Fully interactive weekly/monthly calendar view with drag-scroll and clash detection.
* **Smart Attendance System:** Enhanced OTP-based attendance with error recovery, health analytics, and heatmap.
* **AI-Triage Circulars:** AI-summarized circulars feed with priority ranking and action tracking.
* **Automated Workflow Requests:** Real-time pipelines for leave, attendance corrections, and event requests.
* **Integrated Mentorship & Booking:** Seamless 1:1 slot booking, QR check-ins for events, and waitlist auto-promotion.

**CampuSphere Exclusives:**
* **🤖 AI Study Assistant:** Powered by Groq & Claude API — get syllabus-aware explanations, study plans, and PDF summaries.
* **📊 GPA Calculator & Grade Predictor:** Interactive simulator for calculating target GPAs.
* **💼 Campus Opportunity Board:** Curated hackathon and internship feed (Devfolio, HackerEarth integration).
* **📚 Peer Study Groups & Marketplace:** Lightweight student-to-student collaboration and resource sharing.
* **📝 In-Portal Resume Builder:** Auto-populates verified campus data into clean PDF exports.

## 💻 Tech Stack

CampuSphere utilizes a modern, maintainable, high-performance stack:

*   **Frontend:** React (SPA), Vite, Tailwind CSS (Mobile-first, Dark mode support)
*   **Backend:** FastAPI (Python)
*   **Database:** PostgreSQL (Core data), Redis (OTPs, Queues), MinIO (Storage), Qdrant (Vector Store for RAG)
*   **AI & ML:** Groq Llama-3 (Fast inference), Anthropic Claude API (Complex reasoning)
*   **Infrastructure:** Nginx, Docker, GitHub Actions (CI/CD)

## 🛠️ Local Development Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🔒 Security & Compliance
* JWT-based authentication with RBAC (Student, Faculty, Mentor, Admin).
* Input validation via Pydantic v2.
* All data encrypted in transit via TLS 1.3 and hashed passwords via bcrypt.

---
*Built for Saveetha Engineering College | Version 1.0 (Target: April 2026)*