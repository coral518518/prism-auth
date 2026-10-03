// Format Unix-seconds timestamps for display. The backend stores all times
// as integer seconds since the epoch; these helpers convert to the browser
// locale and render an em dash for missing values so callers don't have to
// repeat the null guard (and never accidentally show "1/1/1970").

/** Localized date only (e.g. "6/13/2026"), or "—" when the timestamp is missing. */
export function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString();
}

/** Localized date + time, or "—" when the timestamp is missing. */
export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}
