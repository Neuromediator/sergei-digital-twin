// Minimal in-memory, per-IP sliding-window rate limiter. Zero dependencies.
//
// NOTE: this state lives in a single serverless instance's memory and resets on
// cold start, so it's basic abuse protection — not a hard, cross-instance
// guarantee. For durable limits (shared across instances/regions), swap this for
// Upstash Redis: `@upstash/ratelimit` + `@upstash/redis`.

type Hits = number[]; // request timestamps (ms)

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 15; // per IP per window

const buckets = new Map<string, Hits>();

// Occasionally prune stale buckets so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [ip, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) buckets.delete(ip);
    else buckets.set(ip, fresh);
  }
}

export type RateResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function checkRateLimit(ip: string, now = Date.now()): RateResult {
  sweep(now);
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (hits.length >= MAX_REQUESTS) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    buckets.set(ip, hits);
    return { allowed: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(ip, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}
