# Claude Developer Guide: PsychiatryX Dashboard

This document details the build, test, and code conventions for the PsychiatryX Dashboard project.

## 🛠️ Build & Run Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `http://127.0.0.1:3000`. |
| `npm run build` | Compiles the Next.js application for production. |
| `npm run start` | Serves the built Next.js application. |
| `npm run lint` | Runs the ESLint checker. |

### Standalone HTML Client
- To run the standalone local client, open [PsychiatryX_Dashboard.html](file:///K:/Codes/Web%20Devlopment/My%20Projects/kharajch---PsychiatryXDashboard/PsychiatryX_Dashboard.html) directly in any modern browser.

---

## 🧪 Testing Commands

The project uses Playwright for E2E and unit testing.

| Command | Action |
| :--- | :--- |
| `npx playwright test` | Executes all Playwright tests. |
| `npx playwright test test/ui-ux.spec.ts` | Runs the UI/UX enhancement verification test suite. |
| `npx playwright test test/mobile-responsive.spec.ts` | Runs mobile responsiveness and drawer tests. |
| `npx playwright test --ui` | Opens the Playwright test runner UI. |

---

## 📜 Development & Code Style Conventions

- **Architecture:** The frontend is fully modularized with subcomponents located in `app/components/` (e.g., `PatientDatabase.tsx`, `PatientProfile.tsx`, `PrescriptionBuilder.tsx`, `Sidebar.tsx`). Avoid inline styles and page monolithic bloat.
- **Styling Mandate:** Style all pages and components using **Vanilla CSS** with CSS Modules (`*.module.css`). The use of Tailwind CSS is strictly prohibited.
- **Next.js & React Version:** The project runs on Next.js 16 (App Router) and React 19.
- **E2E Motion Snapping:**
  - When Playwright tests run, `navigator.webdriver` is set to `true`.
  - The application automatically appends the `.no-animations` class to the body, which sets `animation: none !important;` and `transition: none !important;` in CSS.
  - React components read `isTestEnv` state and wrap their rendering trees in `<MotionConfig transition={isTestEnv ? { duration: 0 } : undefined}>` or set spring transitions to `duration: 0` to prevent Playwright timing out.
- **Critical E2E Selectors:** To ensure testing passes, do not modify key identifiers or text matches:
  - Empty prescription state row text: `"No prescriptions yet."`
  - Edit Details button: `"Edit Details"`
  - Assessment notes textarea: `id="assess-notes"`
  - Completion buttons: `"Save & Print PDF"` and `"Return to Patient Profile"`
  - High risk header: contains `"CRITICAL ALERT"`
  - Gender value: `"Non-Binary"`
  - Patient prefix: `"MKS-"`
- **Clinical Data Integrity:**
  - Modifications to assessment scales or high-risk flagging (especially suicide markers in CDA-17 Item 16 or SRA-20 Item 1) must be logged and highlighted.
  - Audits of patient edits must be recorded via the `AuditLog` collection.
- **Development & Verification Utilities:**
  - Verify database connectivity: `node scripts/test-db.js`
  - Seed local development database: `curl http://localhost:3000/api/dev/seed` (admin credentials: `admin` / `password123`)
