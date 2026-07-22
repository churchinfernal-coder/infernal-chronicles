---
name: occult-library
description: 'Plan, build, and debug the Occult Library feature of Infernal Chronicles — AI-generated books, online PDF/e-book reading, subscription tiers, and Stripe payments that unlock content for verified paid users. Use when working on books, chapters, occult_library_books, book_chapters, book_purchases, occult_subscriptions, premium_services, the AI chapter generator, PDF viewing/serving, entitlement/access checks, or Stripe checkout + webhook flows for library access.'
argument-hint: 'Describe the library/books/subscription/payment task (e.g. "add online PDF viewer for paid users")'
---

# Occult Library (AI Books, E-books, Subscriptions & Paid Access)

## When to Use
- Adding or changing **books / chapters** (catalog, metadata, AI generation).
- Building **online PDF / e-book reading** (in-browser viewer vs. download).
- Modeling or changing **subscriptions & tiers** (library plan, lifetime, tokens).
- Wiring **Stripe checkout + webhooks** so payment unlocks content.
- Enforcing **access control** so only verified paid users read/download.
- Debugging why a paid user cannot access a book, or an unpaid user can.

## System Map (current state)

| Concern | Where |
|---|---|
| Library page (browse, subscribe, buy) | [src/pages/OccultLibrary.tsx](src/pages/OccultLibrary.tsx) |
| Chapter reader (text-based) | [src/pages/OccultLibraryReader.tsx](src/pages/OccultLibraryReader.tsx) |
| Featured carousel | [src/components/FeaturedBooksSlider.tsx](src/components/FeaturedBooksSlider.tsx) |
| AI chapter/TOC generation | [supabase/functions/ai-generate-chapter/index.ts](supabase/functions/ai-generate-chapter/index.ts) |
| Subscription checkout | [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts), [supabase/functions/create-premium-checkout/index.ts](supabase/functions/create-premium-checkout/index.ts) |
| Payment webhook (unlock) | [supabase/functions/stripe-webhook/index.ts](supabase/functions/stripe-webhook/index.ts) |
| Auth/profile context | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) |
| Checkout setup docs | [CHECKOUT_SETUP.md](CHECKOUT_SETUP.md) |

### Data model
- **`occult_library_books`** — catalog: `id, title, author, description, cover_image_url, price_cents, category, featured, published_at, pdf_url, amazon_url, tags[], total_chapters, total_words, excerpt, book_project_id`.
- **`book_chapters`** — `id, project_id` (→ `book_project_id`), `chapter_number, title, content` (AI-generated or manual).
- **`book_purchases`** — one-off access: `user_id, book_id`.
- **`occult_subscriptions`** — library plan: `user_id, subscription_type, status` (active/expired), `expires_at`.
- **`premium_services`** — offerings/tiers: `service_type, tier_level, price_amount, currency, billing_interval, stripe_product_id, stripe_price_id, features(JSONB), is_active`.
- **`profiles`** — `stripe_customer_id, is_premium`, credit fields.
- **`user_roles`** — `role` (user/moderator/admin), checked via `has_role()`; AI generation is admin-only.
- Storage bucket **`book-pdfs`** holds the PDF files.

### The entitlement rule (single source of truth)
Access is granted when a subscription is active **OR** the book was purchased:
```typescript
const hasAccess = (bookId: string) =>
  subscription?.status === "active" || purchases.includes(bookId);
```
Keep this rule identical on the client (UX gating) and enforce it again server-side (RLS + signed URLs). **Never trust the client alone.**

## Procedure

### A. Adding / generating a book (AI e-books)
1. Create the `occult_library_books` row (or a `book_project_id` project). Set `category`, `price_cents`, `featured`, `tags`.
2. Generate content via [ai-generate-chapter](supabase/functions/ai-generate-chapter/index.ts) (GPT-4o-mini): first a table of contents, then per-chapter. Persist to `book_chapters` keyed by `project_id = book_project_id`.
3. Restrict generation to admins with `has_role(auth.uid(), 'admin')` (RLS + function guard).
4. Update `total_chapters` / `total_words` on the book row after generation.
5. If a downloadable/readable PDF is expected, render/upload it to the `book-pdfs` bucket and set `pdf_url`.

### B. Online PDF e-book reading (the requested feature)
Goal: paid users read PDFs **in-browser**, not just download.
1. **Store PDFs privately.** Make `book-pdfs` a **private** bucket (no public URLs). Public URLs bypass payment.
2. **Serve via signed URLs.** Add an edge function (e.g. `get-book-file`) that: authenticates the user → re-checks `hasAccess` against `occult_subscriptions` + `book_purchases` server-side → returns a short-lived `createSignedUrl` only if entitled.
3. **Render in-browser.** Add a viewer route/component (e.g. `OccultLibraryPdfReader`) using an embedded PDF renderer (e.g. `pdf.js` / `react-pdf`) fed by the signed URL. Reuse the layout of [OccultLibraryReader.tsx](src/pages/OccultLibraryReader.tsx).
4. **Gate the UI.** Only show the "Read online" action when `hasAccess(bookId)` is true; otherwise show subscribe/buy CTAs.
5. **Deter leakage** (optional): disable download in the viewer, watermark with the user id, and keep signed-URL TTL short (minutes).

### C. Subscriptions & tiers
1. Define/confirm the plan in `premium_services` (e.g. Library $9.99/mo, Lifetime one-time). Ensure `stripe_price_id` matches Stripe.
2. On subscribe, call [create-checkout-session](supabase/functions/create-checkout-session/index.ts) (or `create-premium-checkout`) with `priceId`, `productType`, `mode` (`subscription` vs `payment`).
3. Redirect to the returned Stripe URL; handle success/cancel return params (`session_id`, `type`).

### D. Payments → unlock → verify paid user
1. All unlocks happen in [stripe-webhook](supabase/functions/stripe-webhook/index.ts) — **not** on the client return page (users can spoof the redirect).
2. On `checkout.session.completed`:
   - Library subscription → upsert `occult_subscriptions` (`status='active'`, set `expires_at`), and/or set `profiles.is_premium`.
   - Single book → insert `book_purchases (user_id, book_id)`.
3. Verify webhook signatures (`STRIPE_WEBHOOK_SECRET`) and make handlers idempotent (guard on Stripe event id / session id).
4. Handle lifecycle events for renewals/cancellations (`invoice.paid`, `customer.subscription.deleted`) to keep `status`/`expires_at` correct.
5. Enforce with **RLS**: `book_chapters` and any file-serving function must confirm an active `occult_subscriptions` row or a matching `book_purchases` row for `auth.uid()`.

## Completion Checklist
- [ ] Entitlement rule identical on client and enforced again server-side (RLS + signed URL).
- [ ] PDF bucket is **private**; access only via short-lived signed URLs from an authed edge function.
- [ ] Unlocks happen in the **webhook**, signature-verified and idempotent — never on the client redirect.
- [ ] AI generation is admin-only.
- [ ] Subscription renewal/cancel events update `status` and `expires_at`.
- [ ] Unpaid user: cannot read online, cannot download, sees subscribe/buy CTA.
- [ ] Paid user (subscription OR purchase): can read online and download.

## Pitfalls
- **Public bucket** = paywall bypass. Keep `book-pdfs` private.
- **Trusting the success redirect** for unlock lets users fake `session_id`. Only the webhook grants access.
- **Client-only `hasAccess`** is cosmetic; without RLS/signed-URL checks the data is still reachable.
- **Non-idempotent webhook** double-grants on Stripe retries. Guard on event/session id.
- **Missing renewal handling** leaves `status='active'` forever after cancellation.
