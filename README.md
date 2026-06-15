# PsychiatryX Dashboard

A professional, clinical-grade psychiatric management platform featuring a **Hybrid Dual-Client Architecture**. Designed for both high-efficiency office data entry and secure, cross-device clinician access.

## 🌟 Core Features

-   **Crimson & Noir Dark Theme:** Sleek, premium dark-mode interface built with a crimson red and black clinical palette using Google Stitch.
-   **Immersive Micro-Animations:** Dynamic background particle systems, spring-based sidebar entrance, staggered card entrance, and crimson hover glows powered by Framer Motion, GSAP, and Three.js.
-   **Clinician-Centric UI:** Centered, glassmorphic authentication experience and interactive sidebar with real-time sync pulsing and verified provider profiles.
-   **Comprehensive Assessment Suite:** 10+ standardized psychiatric scales (CAA-14, CDA-17, SRA-20, etc.) with automated scoring.
-   **Clinical Decision Support:** Intelligent flagging of high-risk responses and suicide risk markers.
-   **Longitudinal Symptom Profiling:** Multi-domain visualization using Radar Charts for quick clinical insights.
-   **Dynamic Prescription Builder:** Module for generating professional OPD prescriptions with pre-categorized psychiatric medications.
-   **Offline-First & Secure:** Local-first persistence using RxDB (IndexedDB) with zero-config automated cloud synchronization.
-   **Sync Status Visibility:** Real-time visual feedback in the header (🟢/🟡/🔴) indicating MongoDB connectivity status.
-   **Branded PDF Reporting:** Automated generation of professional clinical reports with clinic-specific branding and QR verification.
-   **Mobile Responsive UI:** Collapsible off-screen drawer navigation on screens <= 768px, horizontal scroll containment for clinical lists/tables, and auto-wrapping patient database layout.
-   **Clinician Space Authentication:** Glassmorphic Sign In and Sign Up page overlays that protect the clinical database and dashboard, creating isolated clinic environments for registered doctors.

## 🏗️ Hybrid Architecture

This project employs a unique **Hybrid Architecture** to ensure reliability and accessibility:

1.  **The "Local" Client (`PsychiatryX_Dashboard.html`):** A standalone HTML file for office PCs. Operates completely offline and automatically syncs with the backend using origin-aware detection.
2.  **The "Cloud" Client (Next.js):** A modern web application hosted on Vercel, providing global access for clinicians.
3.  **The "Unified" Backend (Next.js API):** A shared Serverless API layer backed by **MongoDB Atlas**, serving both local and cloud clients.

## 🛠️ Technical Stack

-   **Frontend:** Next.js 16 (App Router), React 19, Vanilla CSS (Strictly No Tailwind CSS).
-   **Local Store:** RxDB (IndexedDB) with automated REST Replication.
-   **Backend:** Next.js API Routes, Mongoose, MongoDB Atlas.
-   **Interactive Visuals & Styling:** Google Stitch Design System, Three.js, React Three Fiber, Framer Motion, GSAP, React Tilt, React Parallax, React Spring, React Flip Toolkit, React Icons.
-   **Testing:** Playwright E2E testing for sync and clinical logic.

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   MongoDB Atlas cluster (or local instance)
-   Environment variables configured in `.env`

### Development Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure environment:**
    Create a `.env` file with:
    ```env
    MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/PsychiatryX?retryWrites=true&w=majority
    ```
    *Note: If your password contains special characters like '@', ensure they are URL-encoded (e.g., %40). The application features a built-in 'Direct Access' mode for easy open-source deployment, so NextAuth secrets are optional.*

3.  **Validate Database Connection (Optional):**
    Test your MongoDB connection string configuration before running the app:
    ```bash
    node scripts/test-db.js
    ```

4.  **Seed Development Data (Optional):**
    For quick testing, you can automatically seed the database with a default admin account and sample patients:
    ```bash
    curl http://localhost:3000/api/dev/seed
    ```
    *Credentials: admin / password123*

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  **Local HTML Client:**
    Open `PsychiatryX_Dashboard.html` directly in any modern browser for office-mode operations. The client features zero-config server detection:
    - If served via HTTP, it connects back to its host origin.
    - If loaded locally (`file://` protocol), it probes `http://localhost:3000` (600ms timeout) to connect to a local server, falling back to production Vercel (https://kharajch-psychiatryx-dashboard.vercel.app) if offline.
    - If credentials are required, it automatically prompts you with a Cloud Sync connection modal.

### Testing

Run the full Playwright E2E and unit test suite (testing sync, multi-tenancy, and clinical logic):
```bash
npx playwright test
```
*Note: The E2E tests automatically verify sync and tenant boundaries by injecting credentials programmatically into the client's `localStorage` and utilizing Developer APIs (`window.factoryReset()` and `window.setupReplication(true)`).*

## ⚠️ Security & Privacy Warning

**IMPORTANT: This open-source version currently defaults to "Direct Access" mode.**

-   **Demo Use Only:** By default, the application bypasses JWT authentication if no `NEXTAUTH_SECRET` is provided. This is intended for **demonstration and development purposes only**.
-   **No Real Patient Data:** Do NOT use this application with real Patient Identifiable Information (PII) in its default state.
-   **Lack of Isolation:** In "Direct Access" mode, all unauthenticated users share the same default clinic environment.

### Securing for Production

To enable full authentication and secure your deployment:
1.  Generate a secure secret: `openssl rand -base64 32`
2.  Add `NEXTAUTH_SECRET=your_secret_here` to your environment variables.
3.  Set `NEXTAUTH_URL` to your deployment URL.
Once these variables are set, the system will automatically disable the "Direct Access" bypass and require valid credentials for all sync operations.

## 📄 License

Open Source - MIT License
