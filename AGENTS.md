# Agent Instructions: PsychiatryX Dashboard

Welcome, Agent. You are assisting in the development of a mission-critical clinical platform. Accuracy, safety, and architectural integrity are paramount.

## 🤖 Core Agent Personas
- **Surgical Code Editor:** When modifying `PsychiatryX_Dashboard.html`, use surgical edits to maintain the standalone nature of the file. Avoid introducing complex build steps for this file.
- **Fullstack Architect:** When working in the `app/` directory, adhere to Next.js 16 conventions and ensure all API routes are secure and efficient.
- **Clinical Validation Engine:** Rigorously check any changes to assessment scales or risk flagging logic against the standards in `plan/PSYCHIATRYX_ANALYSIS.md`.

## 🛠️ Specialized Workflows

### 1. Model & Schema Updates
When adding a field to a clinical model (e.g., `Patient` or `Assessment`):
1. Update the Mongoose schema in `lib/models/`.
2. Update the TypeScript interface in `types/index.ts`.
3. Update the RxDB schema in the Next.js frontend (locate where RxDB is initialized).
4. **CRITICAL:** Update the RxDB schema embedded within `PsychiatryX_Dashboard.html`.

### 2. Synchronization Debugging
If sync issues are reported:
- Check database connectivity by running `node scripts/test-db.js`.
- Check `app/api/sync/[collection]/route.ts` for pull/push logic errors.
- **CRITICAL:** Ensure `MONGODB_URI` in `.env` is correctly URL-encoded (e.g., use `%40` instead of `@` in passwords).
- **Auto-Detection & Fallback:** The local HTML client detects its sync server automatically:
  - On standard origins, it targets `window.location.origin`.
  - On the local `file://` protocol, it attempts to probe `http://localhost:3000` with a 600ms timeout (`window.syncConfig.serverUrlDetected` flag). If that fails, it defaults to the Vercel production URL.
  - Manual sync server settings input is removed from configuration.
- **Sync Authentication & Guard:** If no token exists in `localStorage` (`psychiatryx_token`), the application intercepts navigation and redirects to a fullscreen **Clinician Sign In** or **Create Account** auth screen, blocking access to the dashboard. Registration POSTs to `/api/auth/register` (which returns a signed NextAuth JWT token for immediate auto-login) and login POSTs to `/api/auth/login` to obtain and store `psychiatryx_token`, `psychiatryx_clinic_id`, `psychiatryx_username`, and doctor settings.
- **E2E Test Bypass:** E2E test runs automatically bypass the auth screen block (`navigator.webdriver` check) to run in Zero-Auth mode without blocking Playwright. Custom tests can navigate with `?test=false` to test the auth overlay.
- **Developer/Testing APIs:**
  - The HTML client exposes `window.factoryReset()` to programmatically clear all local client data.
  - `window.setupReplication(forceRestart)` triggers replication immediately.
  - **Seed Database (GET):** Developers can use `/api/dev/seed` to quickly provision a test user (`admin` / `password123`) and mock clinical data for local debugging.
- **Multi-Tenant Testing:** E2E tests should inject credentials directly into `localStorage` (`psychiatryx_token` and `psychiatryx_clinic_id`) and trigger a reload/force-sync to verify clinic boundaries.
- Validate that the `AuditLog` is capturing the synchronization attempts.
- Ensure CORS headers allow the local HTML client if it's running on a different origin or `file://`.
- **Tombstone Mapping:** In replication handlers, check if `_deleted` is in the document object (e.g., `'_deleted' in doc`) before renaming/deleting it. The standard RxDB replication `push.modifier` may have already processed and deleted it, and blindly mapping it can overwrite the deletion state back to `false` (active).

### 3. Clinical Safety
- Any modification to "Item 16" (Suicide) in depression scales or "Item 1" in SRA-20 must be highlighted in the PR/Summary.
- Always ensure "High Risk" labels are visually prominent (Red/Urgent).

### 4. UI/UX & Responsiveness
- **Crimson & Noir Dark Theme:** Adhere strictly to the Google Stitch design tokens, using the primary crimson red (`#E63946`) and dark black/charcoal (`#000000` / `#0D0D0D` / `#161616`) theme palette for all components.
- **Vanilla CSS Mandate:** Write styling strictly in Vanilla CSS. Do NOT use Tailwind CSS.
- **E2E Selector Parity:** Any delete buttons targeted by Playwright E2E tests (such as prescription builders or patients) must render the literal trash emoji `"🗑"` in their label or content to satisfy the test locator `button:has-text("🗑")`.
- **Defensive DOM Manipulation:** Always verify the presence of DOM elements (e.g. check if not `null`) before modifying their attributes or properties (such as `.src`, `.textContent`) to prevent startup JS crashes.
- **Asynchronous Modal Form Submission:** When a form is submitted inside a modal with sequential dismissal (e.g. calling `saveEditPatient(id)` followed by `closeModal()`), always read all required input values synchronously at the very beginning of the submission handler. Otherwise, async steps (like database gets) will yield execution, letting `closeModal()` run first and clear the DOM, causing null-element reference crashes when the handler resumes.
- **Responsive Layout Classes:** Never use hardcoded inline styles for grid layouts (e.g. `display: grid; grid-template-columns: ...`). Use the predefined stylesheet grid classes (`.grid-2-equal`, `.grid-2-1`, `.grid-1-2`, `.grid-14-1`) which are configured to automatically stack into a single column on mobile.
- **Scrollable Tables:** Wrap all HTML tables in a `.table-responsive` block to ensure horizontal scroll containment on small viewports.
-   **Interactive Motion & Staggering:** Use Framer Motion (`motion.div`) for all major component entrances. Prefer spring-based transitions for sidebars and staggered delays for list/card items to ensure the UI feels "alive".
-   **Modal & Overlay Stability:** Always wrap modal overlays and authentication cards in `AnimatePresence` and use `motion.div` for the overlay itself. This ensures clean exit transitions and prevents lingering DOM elements from intercepting pointer events during E2E tests.
-   **Consistent Hover Feedback:** Use the `.nav-item-hover` class for sidebar elements, ensuring a consistent 6px horizontal shift and primary-color glow on focus/hover.
-   **E2E Motion & Centering Stability:** Under Playwright test runs (`navigator.webdriver` is true), the application adds `.no-animations` to the document body to immediately disable all CSS keyframes and transitions. Additionally, the React frontend reads `isTestEnv` state and conditionally overrides Framer Motion transitions (setting `transition={isTestEnv ? { duration: 0 } : ...}`) on all major animating containers. This prevents element movement instability and layout offsets from failing click locators or bounding box assertions during automated checks.

### 5. Modular Component Architecture
- **Structure:** Frontend layout has been fully modularized. Do not write complex UI structures directly inside `app/page.tsx`. Keep `app/page.tsx` as a high-level router/state manager and extract components into the `app/components/` directory.
- **TypeScript & Modules:** All extracted components (e.g., `PatientDatabase`, `PatientProfile`, `PrescriptionBuilder`) must use explicit prop types, relative CSS modules (`.module.css`), and export clean React functional components.

### 6. Interactive Selector & Label Constancy
To prevent breaking Playwright E2E automation tests, the following UI text labels, element IDs, and selections must remain constant:
- **Medication Empty State:** The empty row text in the Prescription Builder must be `"No prescriptions yet."`.
- **Edit Details Action:** The patient details editor trigger button label must be `"Edit Details"` (previously `"Edit Patient"`).
- **Assessment Notes Input:** The notes field in clinical assessments must have `id="assess-notes"` and a matching label.
- **Assessment Result Actions:** The primary completion actions must be labeled `"Save & Print PDF"` and `"Return to Patient Profile"`.
- **Alert Headers:** The danger assessment flag header must contain the string `"CRITICAL ALERT"`.
- **Gender Selection Value:** The gender select option value for non-binary patients must be `"Non-Binary"` (with matching capitalization).
- **Default Patient Prefix:** The automatic prefix helper in page views must match `"MKS-"`.

## 📜 Next.js Specific Rules (Internal)
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 📚 Reference Documentation
- `plan/HYBRID_ARCHITECTURE_PLAN.md`: For core sync logic.
- `plan/PSYCHIATRYX_ANALYSIS.md`: For clinical domain logic.
- `GEMINI.md`: For project-wide mandates.

*Instructions maintained by Gemini CLI - June 2026*
