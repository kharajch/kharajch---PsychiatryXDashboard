# Developer Guide: PsychiatryX Dashboard

This guide provides technical instructions for the development environment, build processes, and testing workflows.

## 🛠️ Commands

- **Development:** `npm run dev` (Starts Next.js at localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint 9)
- **Validate DB Connection:** `node scripts/test-db.js` (Tests MongoDB Atlas connection details)
- **Test:** `npx playwright test` (Runs all E2E and unit tests)
- **Specific Test:** `npx playwright test test/api-sync.spec.ts`
- **Auth E2E Test:** `npx playwright test test/auth-flows.spec.ts` (Validates registration, login, and auth guard overlays)

## 💻 Environment Setup

### Prerequisites
- **Node.js:** v18 or higher (v20 recommended)
- **MongoDB:** v6.0 or higher (MongoDB Atlas recommended). Requires a connection string with read/write permissions.
- **Browser:** Modern Chrome/Firefox for RxDB (IndexedDB) support.

### Environment Variables (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/PsychiatryX?retryWrites=true&w=majority
DEFAULT_CLINIC_ID=demo-clinic-123
```
*Note: NextAuth variables (NEXTAUTH_SECRET, NEXTAUTH_URL) are now optional for local and open-source deployments as the system defaults to a 'Direct Access' clinician session.*

## 📐 Architecture Patterns

- **Models:** Mongoose models are located in `lib/models/`.
- **API Routes:** Next.js App Router API routes are in `app/api/`.
- **Synchronization:** The core sync logic is located in `app/api/sync/[collection]/route.ts`.
- **Local Dashboard:** The standalone file `PsychiatryX_Dashboard.html` uses zero-config automated sync logic. On HTTP/HTTPS origins it connects back to its host origin. On the `file://` protocol, it probes `http://localhost:3000` (600ms timeout) for a running local dev server, falling back to Vercel production if offline. When no valid sync token is found in localStorage, the dashboard displays a Cloud Sync login modal to prompt for credentials. Manual server URL controls are removed.

## 🧪 Testing Strategy

The project uses Playwright for comprehensive testing:
1. **API Sync Tests:** `test/api-sync.spec.ts` validates the RxDB replication protocol.
2. **Clinical Logic Tests:** `test/clinical-logic.spec.ts` verifies assessment scoring.
3. **Tenant Isolation:** `test/tenant-isolation-e2e.spec.ts` ensures data security.
4. **Dashboard E2E & Sync:** `test/dashboard.spec.ts` and `test/dashboard-flows.spec.ts` verify client-side registration, editing details, complete deletion, and automated sync.

*Note for E2E tests: Always wait for RxDB database readiness before performing client interactions via:*
```typescript
await page.waitForFunction(() => (window as any).rxdb && (window as any).rxdb.patients, { timeout: 15000 });
```

## 🎨 Styling

- **Next.js:** Use Vanilla CSS Modules (`*.module.css`).
- **Global Styles:** `app/globals.css`.
- **Design System:** Follow the Stitch Design System guidelines (clean, minimalist, clinical).
- **Responsive Layouts:** Use CSS grid utility classes (`.grid-2-equal`, `.grid-2-1`, `.grid-1-2`, `.grid-14-1`) rather than hardcoded inline styles. Always wrap tables in a `.table-responsive` container, and defensively verify element existence before modifying properties to prevent startup JS crashes.

*Guide maintained by Gemini CLI - June 2026*
