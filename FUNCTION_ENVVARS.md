# 🔧 Configure Function Environment Variables

## Quick Overview
Your 3 functions need environment variables set in the Supabase dashboard for production. This is the last manual step.

---

## Step 1: Gather Your Values

From your `.env` file, you need these values:

```bash
SUPABASE_URL=https://khugyibzsujjgtddwzpa.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
PUBLIC_URL=https://yourdomain.com (or http://localhost:5173 for dev)
```

---

## Step 2: Set Variables for Each Function

**Go to**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions

### Function 1: `create-checkout-session`

Click the function name → **Settings** tab → **Environment Variables**

Add these:
| Key | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | Your live/test Stripe secret key |
| `SUPABASE_URL` | https://khugyibzsujjgtddwzpa.supabase.co |
| `SUPABASE_ANON_KEY` | Your anon key from .env |
| `PUBLIC_URL` | https://yourdomain.com (or http://localhost:5173) |

### Function 2: `get-book-file`

Click the function name → **Settings** tab → **Environment Variables**

Add these:
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | https://khugyibzsujjgtddwzpa.supabase.co |
| `SUPABASE_ANON_KEY` | Your anon key from .env |
| `SUPABASE_JWT_SECRET` | Your JWT secret from .env |

### Function 3: `check-subscription`

Click the function name → **Settings** tab → **Environment Variables**

Add these:
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | https://khugyibzsujjgtddwzpa.supabase.co |
| `SUPABASE_ANON_KEY` | Your anon key from .env |

---

## Step 3: Deploy Functions Again

After setting env vars, **redeploy each function** by clicking the function → **Deploy** button

---

## After Configuration

Return and I'll run the production gates automatically:

```bash
✅ Verify all functions work with env vars
✅ Run 5 production gates
✅ Create release tag
```

All automated after you set the 3 functions' environment variables.
