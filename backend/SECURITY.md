# Security review — Sheegra backend

## Implemented

- **Secrets never reach any frontend.** Razorpay key *secret* and webhook secret exist only server-side; only the public key ID is sent to clients. Verified by reading every route that touches `RAZORPAY_KEY_SECRET`.
- **Payment integrity.** Orders are only marked CONFIRMED/PAID after a Razorpay signature check. The webhook (server-to-server, HMAC-signed) is the authoritative confirmation, not the client-side callback, so a compromised or dropped client request can't fake a paid order.
- **OTP codes are hashed** (bcrypt) at rest — never stored or logged in plaintext outside the explicit dev-only console fallback.
- **Rate limiting** on OTP request (5/10min) and OTP verify (10/10min) per IP, plus a general 300/15min limit across the whole API, to blunt brute-force and SMS-bombing.
- **Admin access requires a pre-existing DB row** with role ADMIN/STAFF — OTP alone can never grant admin rights to an unknown number.
- **Input validation** via zod on every write endpoint; malformed input is rejected with a 400 before touching the database.
- **SQL injection**: not applicable — all queries go through Prisma's parameterized query builder, no raw string concatenation into SQL anywhere in the app code.
- **File upload hardening**: MIME-type allowlist (JPEG/PNG/WEBP only), 5MB size cap, randomly generated filenames (no user-controlled path/filename).
- **Fail-fast startup checks**: the server refuses to start with a missing/short JWT secret, or (in production) with placeholder Razorpay keys or the dev-only console OTP provider.
- **CORS locked to an explicit origin allowlist** (`CORS_ORIGINS`), not left open.
- **Helmet** security headers on every response, with `crossOriginResourcePolicy` deliberately relaxed only for serving product images across origins.
- **No stack traces leaked** to clients in production; errors are logged server-side and a generic message returned.

## Still your responsibility before handling real customer payments

- **TLS/HTTPS** — this app assumes it sits behind HTTPS in production (most PaaS providers do this for you, but confirm it).
- **Database backups** — set up automated backups on whatever Postgres host you choose.
- **Rotate `JWT_SECRET`** away from anything used in development before going live.
- **Review Razorpay's own dashboard settings** — settlement schedule, refund policy, and webhook retry behavior are configured there, not in this code.
- **Penetration test / external review** — this pass covers common, known-severe issues but is not a substitute for a professional security audit, especially before processing real money at scale.
- **Dependency updates** — run `npm audit` periodically and keep dependencies patched.
