type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type ConsumeOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function getBucket(key: string, windowMs: number) {
  const current = buckets.get(key);
  const currentTime = now();

  if (!current || current.resetAt <= currentTime) {
    const next: Bucket = {
      count: 0,
      resetAt: currentTime + windowMs,
    };
    buckets.set(key, next);
    return next;
  }

  return current;
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: ConsumeOptions): RateLimitResult {
  const bucket = getBucket(key, windowMs);
  bucket.count += 1;

  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}
