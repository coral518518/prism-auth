// Resolve the originating client IP for audit logs, rate limiting, and
// captcha verification.
//
// Cloudflare always sets CF-Connecting-IP at the edge in production; the
// X-Forwarded-For fallback covers local dev and any path where the edge
// header is absent. "unknown" is the last resort so callers always get a
// non-empty string to store.
export function getIp(c: {
  req: { header: (h: string) => string | undefined };
}): string {
  return (
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For") ??
    "unknown"
  );
}
