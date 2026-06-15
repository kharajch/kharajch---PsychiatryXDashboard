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

- **Styling Mandate:** Style all pages and components using **Vanilla CSS**. The use of Tailwind CSS is strictly prohibited.
- **Next.js & React Version:** The project runs on Next.js 16 (App Router) and React 19.
- **E2E Motion Snapping:**
  - When Playwright tests run, `navigator.webdriver` is set to `true`.
  - The application automatically appends the `.no-animations` class to the body, which sets transition and animation durations to `0s` in CSS.
  - React components read `isTestEnv` state and wrap their rendering trees in `<MotionConfig transition={{ duration: 0 }}>` and set element-specific spring transitions to `duration: 0` to prevent Playwright timing out on unstable elements.
- **Clinical Data Integrity:**
  - Modifications to assessment scales or high-risk flagging (especially suicide markers in CDA-17 Item 16 or SRA-20 Item 1) must be logged and highlighted.
  - Audits of patient edits must be recorded via the `AuditLog` collection.
