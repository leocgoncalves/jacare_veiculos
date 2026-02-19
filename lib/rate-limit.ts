type RateLimitConfig = {
  windowMs: number;
  maxHits: number;
};

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function nowMs() {
  return Date.now();
}

function normalizeKey(rawKey: string) {
  return rawKey.trim().toLowerCase();
}

function isRedisConfigured() {
  return Boolean(upstashUrl && upstashToken);
}

async function callUpstashPipeline(commands: (string | number)[][]) {
  if (!upstashUrl || !upstashToken) {
    throw new Error("UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados.");
  }

  const response = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error("Falha na comunicação com o Redis.");
  }

  return (await response.json()) as Array<{ result?: number | string | null; error?: string }>;
}

function consumeRateLimitInMemory(
  key: string,
  config: RateLimitConfig,
) {
  const now = nowMs();
  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.windowStart > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true, remaining: Math.max(config.maxHits - 1, 0) };
  }

  if (existing.count >= config.maxHits) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true, remaining: Math.max(config.maxHits - existing.count, 0) };
}

async function consumeRateLimitInRedis(
  key: string,
  config: RateLimitConfig,
) {
  const [incrResult] = await callUpstashPipeline([["INCR", key]]);
  if (incrResult?.error) {
    throw new Error(incrResult.error);
  }

  const count = Number(incrResult?.result ?? 0);
  if (count === 1) {
    const [expireResult] = await callUpstashPipeline([["PEXPIRE", key, config.windowMs]]);
    if (expireResult?.error) {
      throw new Error(expireResult.error);
    }
  }

  if (count > config.maxHits) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(config.maxHits - count, 0) };
}

export async function consumeRateLimit(
  namespace: string,
  rawKey: string,
  config: RateLimitConfig,
) {
  const key = `${namespace}:${normalizeKey(rawKey)}`;
  if (!isRedisConfigured()) {
    return consumeRateLimitInMemory(key, config);
  }

  try {
    return await consumeRateLimitInRedis(key, config);
  } catch {
    // Fail-safe: se Redis indisponível, evita derrubar fluxo crítico e aplica fallback.
    return consumeRateLimitInMemory(key, config);
  }
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}
