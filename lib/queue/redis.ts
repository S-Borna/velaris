// Copyright (c) Said Borna. All rights reserved.
// Velaris — Redis connection config for BullMQ job queue

import type { ConnectionOptions } from "bullmq";

/* ─── Constants ─────────────────────────────────────── */

const MAX_RETRIES_PER_REQUEST = 3;

/* ─── Connection Config ─────────────────────────────── */

/**
 * Parse REDIS_URL and return connection options compatible with BullMQ.
 * BullMQ uses its own bundled ioredis, so we provide parsed connection config
 * rather than a pre-created ioredis instance.
 *
 * @throws Error if REDIS_URL is not set.
 */
export function getRedisConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    password: parsed.password || undefined,
    username: parsed.username !== "default" ? parsed.username : undefined,
    maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
    enableReadyCheck: true,
  };
}
