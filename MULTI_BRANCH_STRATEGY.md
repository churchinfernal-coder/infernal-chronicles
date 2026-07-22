# MULTI-BRANCH PRODUCTION FIX STRATEGY
## Infernal Chronicles - Zero Guesswork, Hard Gates, 100% Coverage

**Status**: STRATEGY DOCUMENT (Ready for execution)  
**Current Production State**: 🔴 FAILING (subscriptions 0%, ebooks 0%, social 37%)  
**Target State**: 🟢 ALL GATES PASS (subscriptions 99%+, ebooks 99%+, social 99%+)  
**Timeline**: 4-6 hours (parallel branches)  
**Git Strategy**: Feature branches with hard pass/fail gates on each commit

---

## Branch Architecture

### Core Branches (Execute in Parallel)

```
main (production)
├── feature/fix-subscriptions
│   ├── supabase/functions/create-checkout-session/
│   ├── src/components/SubscriptionCheckout.tsx (mobile-first)
│   ├── tests/subscriptions.gate.ts
│   └── VALIDATION: P95 < 200ms, Success > 99%, Error < 1%
│
├── feature/fix-ebooks
│   ├── supabase/functions/get-book-file/
│   ├── supabase/functions/check-subscription/
│   ├── src/components/EbookReader.tsx (mobile-first, responsive)
│   ├── tests/ebooks.gate.ts
│   └── VALIDATION: P95 < 500ms, Success > 99%, Error < 1%
│
├── feature/database-optimization
│   ├── supabase/migrations/add-indexes.sql
│   ├── supabase/migrations/configure-pool.sql
│   ├── tests/database.gate.ts
│   └── VALIDATION: Connection pool 200+, Query <100ms
│
├── feature/security-hardening
│   ├── middleware/auth-validation.ts
│   ├── middleware/rate-limiting.ts
│   ├── middleware/csrf-protection.ts
│   ├── tests/security.gate.ts
│   └── VALIDATION: All auth checks pass, 0 CSRF vulnerabilities
│
└── feature/mobile-responsive
    ├── src/components/ui/responsive.tsx (Tailwind responsive)
    ├── src/styles/mobile-first.css
    ├── tests/responsive.gate.ts
    └── VALIDATION: All pages pass lighthouse, 100% mobile coverage
```

---

## Execution Plan: 5 Parallel Workstreams

### Workstream A: Subscriptions (Branch: feature/fix-subscriptions)

**Goal**: Fix 0% success rate on checkout  
**Root Cause**: Edge function not deployed + Stripe secret key missing  
**Fix Scope**: Edge function + React component + hard gate  
**Timeline**: 45 minutes  

#### A.1: Create Edge Function
- File: `supabase/functions/create-checkout-session/index.ts`
- Validation: Returns 200 with session URL
- Hard Gate: `tests/gate-subscriptions.ts` → Must pass 500 concurrent requests with P95 < 200ms

#### A.2: Create React Component (Mobile-First)
- File: `src/components/SubscriptionCheckout.tsx`
- Design: Mobile-first, responsive to desktop
- Validation: Works on all viewport sizes
- Hard Gate: Lighthouse score > 90, CLS < 0.1

#### A.3: Hard Production Gate
```typescript
// tests/gate-subscriptions.ts
import { performance } from "node:perf_hooks";

async function gateSubscriptions() {
  // 500 concurrent checkout requests
  // Metrics: P95 < 200ms, Success > 99%, Error < 1%
  // PASS/FAIL with exit code
}

await gateSubscriptions();
```

---

### Workstream B: E-Books (Branch: feature/fix-ebooks)

**Goal**: Fix 0% success rate on book access  
**Root Cause**: Edge function not deployed + missing indexes + storage bucket  
**Fix Scope**: Edge functions + entitlement check + reader UI + database indexes  
**Timeline**: 60 minutes  

#### B.1: Create Edge Functions
- `supabase/functions/get-book-file/index.ts` - Generate signed URLs
- `supabase/functions/check-subscription/index.ts` - Entitlement verify
- Validation: Returns 200 with signed URL OR 403 with clear reason

#### B.2: Create E-Book Reader Component (Mobile-First)
- File: `src/components/EbookReader.tsx`
- Features:
  - EPUB.js integration (web reader)
  - Bookmarks, highlights, notes
  - Responsive layout (mobile → desktop)
  - Offline caching
  - Progress sync across devices
- Validation: Works on all screen sizes (320px - 2560px)

#### B.3: Hard Production Gate
```typescript
// tests/gate-ebooks.ts
// 500 concurrent book access requests
// Metrics: P95 < 500ms, Success > 99%, Error < 1%
// Verify signed URLs are valid + not shared across users
```

---

### Workstream C: Database Optimization (Branch: feature/database-optimization)

**Goal**: Fix 4000ms+ latency + connection pool exhaustion  
**Root Cause**: Missing indexes + small connection pool  
**Fix Scope**: SQL migrations for indexes + pool configuration  
**Timeline**: 20 minutes  

#### C.1: Create Indexes
```sql
-- supabase/migrations/001_add-indexes.sql
CREATE INDEX idx_subscriptions_user_status 
  ON subscriptions(user_id, status, expires_at DESC);
CREATE INDEX idx_book_purchases_user_book 
  ON book_purchases(user_id, book_id);
CREATE INDEX idx_coven_posts_user_created 
  ON coven_posts(user_id, created_at DESC);
```

#### C.2: Configure Connection Pool
- Settings: Min 10, Max 200, Default 15
- Mode: Transaction
- Validation: Can sustain 100 concurrent connections

#### C.3: Hard Production Gate
```typescript
// tests/gate-database.ts
// Run 100 concurrent subscription lookups
// Metric: P99 < 100ms (not 4000ms)
```

---

### Workstream D: Security Hardening (Branch: feature/security-hardening)

**Goal**: Prevent auth bypass, CSRF, rate limit abuse, data leaks  
**Root Cause**: No explicit security middleware  
**Fix Scope**: Auth validation, rate limiting, CSRF, input sanitization  
**Timeline**: 45 minutes  

#### D.1: Auth Validation Middleware
```typescript
// middleware/auth-validation.ts
// Verify JWT token on every request
// Check subscription expiry in real-time
// Log access for audit trail
```

#### D.2: Rate Limiting
```typescript
// middleware/rate-limiting.ts
// Stripe checkout: 5/hour per user
// Book access: 100/hour per user
// Social posts: 50/hour per user
```

#### D.3: CSRF Protection
```typescript
// middleware/csrf-protection.ts
// Verify CSRF tokens on state-changing requests
```

#### D.4: Hard Security Gate
```typescript
// tests/gate-security.ts
// Verify:
// - No unauthenticated access to premium content
// - Subscription tokens expire correctly
// - Rate limits enforce
// - CSRF tokens required
// - No SQL injection vulnerabilities
```

---

### Workstream E: Mobile-Responsive Design (Branch: feature/mobile-responsive)

**Goal**: 100% mobile-first coverage, responsive across all devices  
**Root Cause**: UI components not tested on mobile  
**Fix Scope**: Tailwind responsive classes + mobile-specific components + testing  
**Timeline**: 60 minutes  

#### E.1: Mobile-First CSS Framework
```typescript
// src/styles/mobile-first.css
// Tailwind: sm: (640px), md: (768px), lg: (1024px), xl: (1280px), 2xl: (1536px)
// Design every component for 320px first, scale up
```

#### E.2: Responsive Components
- SubscriptionCheckout: Mobile stack → Desktop side-by-side
- EbookReader: Full-screen mobile → Sidebar desktop
- Pagination: Large touch targets on mobile (44px min)
- Forms: Single column mobile → Multi-column desktop

#### E.3: Hard Responsive Gate
```typescript
// tests/gate-responsive.ts
// Lighthouse Desktop: > 90
// Lighthouse Mobile: > 85
// All pages work at 320px, 768px, 1024px, 1440px
// Touch targets >= 44px on mobile
```

---

## Execution Sequence (Parallel Workstreams)

### Phase 1: Setup (5 minutes)
1. Create all 5 feature branches from `main`
2. Create test gate files for each branch
3. Document hard success criteria

### Phase 2: Implementation (90 minutes - All Parallel)
- **Team A**: Implement Workstream A (Subscriptions)
- **Team B**: Implement Workstream B (E-Books)
- **Team C**: Implement Workstream C (Database)
- **Team D**: Implement Workstream D (Security)
- **Team E**: Implement Workstream E (Mobile)

### Phase 3: Validation (30 minutes - Sequential)
1. Merge `feature/database-optimization` → `main` (foundation)
2. Merge `feature/security-hardening` → `main` (gating layer)
3. Merge `feature/fix-subscriptions` → `main` (run gate)
4. Merge `feature/fix-ebooks` → `main` (run gate)
5. Merge `feature/mobile-responsive` → `main` (run gate)

### Phase 4: Hard Production Gate (15 minutes)
Run final `npm run prod:readiness:gate` against merged code.

**Exit criteria**:
- 🟢 All gates PASS
- Exit code: 0
- Evidence artifacts written
- Ready for production deployment

---

## Hard Production Gates (Exit Criteria)

### Gate 1: Subscriptions (Branch: feature/fix-subscriptions)
```
PASS if:
  ✓ P95 Latency < 200ms (actual vs threshold)
  ✓ Success Rate > 99%
  ✓ Error Rate < 1%
  ✓ Stripe webhook integration working
  ✓ JWT auth enforced
  ✓ Mobile UI responsive (320px - 2560px)
  ✓ Lighthouse Mobile > 85
  
FAIL if any threshold violated
Exit Code: 0 (PASS) or 1 (FAIL)
Evidence: evidence/gate-subscriptions-{timestamp}.json
```

### Gate 2: E-Books (Branch: feature/fix-ebooks)
```
PASS if:
  ✓ P95 Latency < 500ms
  ✓ Success Rate > 99%
  ✓ Error Rate < 1%
  ✓ Entitlement check enforced (subscription OR purchase)
  ✓ Signed URLs valid (5 min TTL)
  ✓ Reader component responsive
  ✓ Lighthouse Mobile > 85
  
FAIL if any threshold violated
Exit Code: 0 (PASS) or 1 (FAIL)
Evidence: evidence/gate-ebooks-{timestamp}.json
```

### Gate 3: Database (Branch: feature/database-optimization)
```
PASS if:
  ✓ All indexes exist and are used
  ✓ Subscription lookup P99 < 100ms (was 4000ms)
  ✓ Connection pool size = 200
  ✓ 100 concurrent connections sustained
  
FAIL if any metric not met
Exit Code: 0 (PASS) or 1 (FAIL)
Evidence: evidence/gate-database-{timestamp}.json
```

### Gate 4: Security (Branch: feature/security-hardening)
```
PASS if:
  ✓ All endpoints require auth
  ✓ JWT token validation enforced
  ✓ Rate limits working (Stripe: 5/hr, Books: 100/hr)
  ✓ CSRF tokens required on POST/PUT/DELETE
  ✓ No SQL injection vulnerabilities (OWASP Top 10)
  ✓ Sensitive data not logged
  ✓ HTTPS enforced
  
FAIL if any vulnerability found
Exit Code: 0 (PASS) or 1 (FAIL)
Evidence: evidence/gate-security-{timestamp}.json
```

### Gate 5: Mobile Responsive (Branch: feature/mobile-responsive)
```
PASS if:
  ✓ Lighthouse Desktop > 90
  ✓ Lighthouse Mobile > 85
  ✓ Works at 320px (iPhone SE), 768px (iPad), 1024px (desktop)
  ✓ Touch targets >= 44px on mobile
  ✓ Font sizes readable on mobile (16px+)
  ✓ Images optimized for mobile (responsive srcset)
  ✓ CLS < 0.1 (no layout shifts)
  
FAIL if any metric missed
Exit Code: 0 (PASS) or 1 (FAIL)
Evidence: evidence/gate-responsive-{timestamp}.json
```

### Final Gate: Production Readiness (Merged Code)
```
PASS if ALL 5 branches pass their individual gates:
  ✓ Subscriptions gate PASS
  ✓ E-Books gate PASS
  ✓ Database gate PASS
  ✓ Security gate PASS
  ✓ Mobile gate PASS
  
Expected output:
  🟢 PRODUCTION READY - ALL GATES PASSED
  Subscriptions: PASS (P95: 180ms)
  E-Books: PASS (P95: 420ms)
  Database: PASS (P99: 85ms)
  Security: PASS (0 vulnerabilities)
  Mobile: PASS (Lighthouse 88 avg)
  
Exit Code: 0
```

---

## Branch Merge Sequence (Dependency Order)

```
main
  ↓ Merge 1
  feature/database-optimization
  (Creates indexes, optimizes pool)
  ↓ Merge 2
  feature/security-hardening
  (Adds auth gates, rate limiting)
  ↓ Merge 3
  feature/fix-subscriptions
  (Checkout flow working)
  ↓ Merge 4
  feature/fix-ebooks
  (Book access working)
  ↓ Merge 5
  feature/mobile-responsive
  (All UI responsive)
  ↓
  main (PRODUCTION READY)
```

Each merge runs its own gate test. If any gate fails, that branch is rejected.

---

## Credit Conservation Strategy

### Memory-Efficient Approach
1. **Reuse components**: Don't duplicate code across branches
2. **Shared test infrastructure**: Single gate runner, called from each branch
3. **Batch API calls**: Load 100 books in 1 query, not 100 queries
4. **Connection pooling**: Reuse DB connections (configured in workstream C)
5. **Caching**: Redis for subscription checks (not implemented yet, but planned)

### Load Test Efficiency
- **Subscriptions**: 50 concurrent, 500 requests (not 1000)
- **E-Books**: 100 concurrent, 500 requests
- **Social**: 50 concurrent, 500 requests
- **Total**: 1500 requests per full gate run (vs 3000 in original plan)

---

## Success Metrics (Hard Numbers)

| Component | Target | Current | Status |
|-----------|--------|---------|--------|
| **Subscriptions P95** | < 200ms | 1044ms | 🔴 FAIL |
| **Subscriptions Success** | > 99% | 0% | 🔴 FAIL |
| **E-Books P95** | < 500ms | 4367ms | 🔴 FAIL |
| **E-Books Success** | > 99% | 0% | 🔴 FAIL |
| **Database P99** | < 100ms | 4000ms+ | 🔴 FAIL |
| **Security Issues** | 0 | Unknown | ⚠️ UNKNOWN |
| **Mobile Lighthouse** | > 85 | Unknown | ⚠️ UNKNOWN |

**After All Branches Merged**:
- All 7 metrics → 🟢 PASS
- All exit codes → 0
- All gates satisfied → Production deployment approved

---

## Git Workflow

### Create Feature Branches
```bash
git checkout main
git pull origin main

# Create 5 feature branches (parallel)
git checkout -b feature/fix-subscriptions
git checkout -b feature/fix-ebooks
git checkout -b feature/database-optimization
git checkout -b feature/security-hardening
git checkout -b feature/mobile-responsive
```

### For Each Branch (Example: subscriptions)
```bash
git checkout feature/fix-subscriptions

# Make changes
# Add supabase/functions/create-checkout-session/index.ts
# Add src/components/SubscriptionCheckout.tsx
# Add tests/gate-subscriptions.ts

# Commit with meaningful message
git add .
git commit -m "fix(subscriptions): implement checkout flow with hard gate validation

- Add create-checkout-session edge function
- Add mobile-first SubscriptionCheckout component
- Add hard production gate (P95 < 200ms, Success > 99%)
- Verify Stripe integration working
- Add responsive design (320px - 2560px)

GATE STATUS: Ready for validation"

# Push and create PR
git push origin feature/fix-subscriptions
```

### Merge Sequence
```bash
# Merge database optimization first (foundation)
git checkout main
git merge feature/database-optimization
npm run test:gate:database  # Verify gate passes

# Merge security (gating layer)
git merge feature/security-hardening
npm run test:gate:security  # Verify gate passes

# Merge subscriptions
git merge feature/fix-subscriptions
npm run test:gate:subscriptions  # Verify gate passes

# Merge ebooks
git merge feature/fix-ebooks
npm run test:gate:ebooks  # Verify gate passes

# Merge mobile
git merge feature/mobile-responsive
npm run test:gate:responsive  # Verify gate passes

# Final production gate
npm run prod:readiness:gate
# Expected: 🟢 PRODUCTION READY - ALL GATES PASSED
```

---

## NPM Scripts to Add

```json
{
  "scripts": {
    "test:gate:database": "node scripts/gate-tests/database.mjs",
    "test:gate:security": "node scripts/gate-tests/security.mjs",
    "test:gate:subscriptions": "node scripts/gate-tests/subscriptions.mjs",
    "test:gate:ebooks": "node scripts/gate-tests/ebooks.mjs",
    "test:gate:responsive": "node scripts/gate-tests/responsive.mjs",
    "test:all:gates": "npm run test:gate:database && npm run test:gate:security && npm run test:gate:subscriptions && npm run test:gate:ebooks && npm run test:gate:responsive",
    "prod:readiness:gate": "node scripts/production-readiness-gate.mjs"
  }
}
```

---

## Timeline Summary

| Phase | Duration | Parallel Work | Output |
|-------|----------|---------------|--------|
| Setup | 5 min | - | 5 branches created |
| Implementation | 90 min | Workstreams A-E | 5 feature branches ready |
| Validation | 30 min | Sequential merge | main branch updated |
| Final Gate | 15 min | Single run | 🟢 PRODUCTION READY or 🔴 BLOCKED |

**Total**: 140 minutes (2.3 hours) for complete production-ready system

---

## Risk Mitigation

### If Any Branch Fails Its Gate
1. **Revert the branch merge** (don't proceed)
2. **Identify the failure** (review gate output)
3. **Fix the issue** in the feature branch
4. **Re-run the gate** for that branch
5. **Merge when gate passes**

### If Final Gate Fails
1. **Identify which component** (subscriptions, ebooks, database, security, mobile)
2. **Revert to last passing state** (git reset --hard main~1)
3. **Fix the component** in its feature branch
4. **Re-test individual gate** for that component
5. **Merge and re-run final gate**

### Zero Guesswork Principle
- Every change is gated
- Every gate has measurable pass/fail criteria
- Every merge requires gate passing
- Evidence is timestamped and archived
- No deployment without all gates passing

---

## Next Action

**Execute Phase 1: Create all 5 feature branches and gate test files**

Then start Workstreams A-E in parallel:
1. Workstream A → Subscriptions gate
2. Workstream B → E-Books gate
3. Workstream C → Database gate
4. Workstream D → Security gate
5. Workstream E → Mobile gate

---

Generated: 2026-07-21  
Status: READY FOR EXECUTION  
Credit Conservation: ✓ Efficient (1500 requests total, not 3000)  
Mobile First: ✓ Required on all 5 branches  
Security: ✓ Hardened (workstream D)  
Hard Gates: ✓ All measurable, all exit-code gated
