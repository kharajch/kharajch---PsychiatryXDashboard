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
- **Sync Authentication & Guard:** If no token exists in `localStorage` (`psychiatryx_token`), the application intercepts navigation and redirects to a fullscreen **Clinician Sign In** or **Create Account** auth screen, blocking access to the dashboard. Registration POSTs to `/api/auth/register` and login POSTs to `/api/auth/login` to obtain and store `psychiatryx_token`, `psychiatryx_clinic_id`, `psychiatryx_username`, and doctor settings.
- **E2E Test Bypass:** E2E test runs automatically bypass the auth screen block (`navigator.webdriver` check) to run in Zero-Auth mode without blocking Playwright. Custom tests can navigate with `?test=false` to test the auth overlay.
- **Developer/Testing APIs:** The HTML client exposes `window.factoryReset()` to programmatically clear all local client data, and `window.setupReplication(forceRestart)` to trigger replication immediately (passing `true` resets retry backoff timers).
- **Multi-Tenant Testing:** E2E tests should inject credentials directly into `localStorage` (`psychiatryx_token` and `psychiatryx_clinic_id`) and trigger a reload/force-sync to verify clinic boundaries.
- Validate that the `AuditLog` is capturing the synchronization attempts.
- Ensure CORS headers allow the local HTML client if it's running on a different origin or `file://`.
- **Tombstone Mapping:** In replication handlers, check if `_deleted` is in the document object (e.g., `'_deleted' in doc`) before renaming/deleting it. The standard RxDB replication `push.modifier` may have already processed and deleted it, and blindly mapping it can overwrite the deletion state back to `false` (active).

### 3. Clinical Safety
- Any modification to "Item 16" (Suicide) in depression scales or "Item 1" in SRA-20 must be highlighted in the PR/Summary.
- Always ensure "High Risk" labels are visually prominent (Red/Urgent).

### 4. UI/UX & Responsiveness
- **Defensive DOM Manipulation:** Always verify the presence of DOM elements (e.g. check if not `null`) before modifying their attributes or properties (such as `.src`, `.textContent`) to prevent startup JS crashes.
- **Asynchronous Modal Form Submission:** When a form is submitted inside a modal with sequential dismissal (e.g. calling `saveEditPatient(id)` followed by `closeModal()`), always read all required input values synchronously at the very beginning of the submission handler. Otherwise, async steps (like database gets) will yield execution, letting `closeModal()` run first and clear the DOM, causing null-element reference crashes when the handler resumes.
- **Responsive Layout Classes:** Never use hardcoded inline styles for grid layouts (e.g. `display: grid; grid-template-columns: ...`). Use the predefined stylesheet grid classes (`.grid-2-equal`, `.grid-2-1`, `.grid-1-2`, `.grid-14-1`) which are configured to automatically stack into a single column on mobile.
- **Scrollable Tables:** Wrap all HTML tables in a `.table-responsive` block to ensure horizontal scroll containment on small viewports.
- **Drawer Navigation:** When navigating on mobile, ensure the slide-out navigation drawer and backdrop overlay auto-close after page transitions.

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
