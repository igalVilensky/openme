import type { Request, RequestHandler } from "express";

type RateLimitOptions = {
  bucket: string;
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Map<string, RateLimitEntry>>();
let nextCleanupAt = 0;

function getClientIp(req: Request): string {
  // MVP proxy awareness: common free hosts set x-forwarded-for. A trusted
  // edge firewall or external limiter should replace this for serious scale.
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  const forwardedIp = forwardedValue?.split(",")[0]?.trim();

  return forwardedIp || req.ip || req.socket.remoteAddress || "unknown";
}

function getBucket(name: string): Map<string, RateLimitEntry> {
  const existingBucket = buckets.get(name);

  if (existingBucket) {
    return existingBucket;
  }

  const bucket = new Map<string, RateLimitEntry>();
  buckets.set(name, bucket);

  return bucket;
}

function cleanupExpiredEntries(now: number): void {
  if (now < nextCleanupAt) {
    return;
  }

  buckets.forEach((bucket) => {
    bucket.forEach((entry, ip) => {
      if (entry.resetAt <= now) {
        bucket.delete(ip);
      }
    });
  });

  nextCleanupAt = now + 60_000;
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  // In-memory protection is intentionally simple for the MVP. It does not
  // coordinate across multiple API instances or survive process restarts.
  return (req, res, next) => {
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    const now = Date.now();
    cleanupExpiredEntries(now);

    const bucket = getBucket(options.bucket);
    const ip = getClientIp(req);
    const currentEntry = bucket.get(ip);
    const entry =
      currentEntry && currentEntry.resetAt > now
        ? currentEntry
        : {
            count: 0,
            resetAt: now + options.windowMs,
          };

    entry.count += 1;
    bucket.set(ip, entry);

    if (entry.count > options.maxRequests) {
      res.setHeader(
        "Retry-After",
        Math.ceil((entry.resetAt - now) / 1000).toString(),
      );
      res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
      return;
    }

    next();
  };
}
