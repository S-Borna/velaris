// Copyright (c) Said Borna. All rights reserved.
// Velaris — Campaign execution job queue (BullMQ)

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnectionOptions } from "./redis";

/* ─── Constants ─────────────────────────────────────── */

const CAMPAIGN_QUEUE_NAME = "campaign-execution";
const CONTENT_SCHEDULE_QUEUE_NAME = "content-schedule";
const LEAD_ENRICHMENT_QUEUE_NAME = "lead-enrichment";

const DEFAULT_JOB_ATTEMPTS = 3;
const DEFAULT_BACKOFF_DELAY_MS = 5000;

/* ─── Job Types ─────────────────────────────────────── */

export interface CampaignStepJob {
  type: "campaign-step";
  campaignId: string;
  campaignLeadId: string;
  leadId: string;
  linkedinAccountId: string;
  stepOrder: number;
  actionType: string;
  messageTemplate: string | null;
}

export interface ContentScheduleJob {
  type: "content-schedule";
  contentPostId: string;
  linkedinAccountId: string;
  workspaceId: string;
}

export interface LeadEnrichmentJob {
  type: "lead-enrichment";
  leadId: string;
  workspaceId: string;
  linkedinUrl: string | null;
  email: string | null;
}

/* ─── Queue Factories ───────────────────────────────── */

let campaignQueue: Queue<CampaignStepJob> | null = null;
let contentQueue: Queue<ContentScheduleJob> | null = null;
let enrichmentQueue: Queue<LeadEnrichmentJob> | null = null;

/**
 * Get the campaign execution queue (singleton).
 */
export function getCampaignQueue(): Queue<CampaignStepJob> {
  if (!campaignQueue) {
    campaignQueue = new Queue<CampaignStepJob>(CAMPAIGN_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: DEFAULT_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: DEFAULT_BACKOFF_DELAY_MS },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return campaignQueue!;
}

/**
 * Get the content scheduling queue (singleton).
 */
export function getContentQueue(): Queue<ContentScheduleJob> {
  if (!contentQueue) {
    contentQueue = new Queue<ContentScheduleJob>(CONTENT_SCHEDULE_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: DEFAULT_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: DEFAULT_BACKOFF_DELAY_MS },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return contentQueue!;
}

/**
 * Get the lead enrichment queue (singleton).
 */
export function getEnrichmentQueue(): Queue<LeadEnrichmentJob> {
  if (!enrichmentQueue) {
    enrichmentQueue = new Queue<LeadEnrichmentJob>(LEAD_ENRICHMENT_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: DEFAULT_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: DEFAULT_BACKOFF_DELAY_MS },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return enrichmentQueue!;
}

/* ─── Job Enqueue Helpers ───────────────────────────── */

/**
 * Enqueue a campaign step for execution.
 * Optionally delay execution by milliseconds (for wait steps).
 */
export async function enqueueCampaignStep(
  data: CampaignStepJob,
  delayMs?: number
): Promise<string> {
  const queue = getCampaignQueue();
  const job = await queue.add(
    `campaign-${data.campaignId}-step-${data.stepOrder}`,
    data,
    { delay: delayMs }
  );
  return job.id ?? "unknown";
}

/**
 * Enqueue a content post for scheduled publishing.
 */
export async function enqueueContentPublish(
  data: ContentScheduleJob,
  publishAt: Date
): Promise<string> {
  const queue = getContentQueue();
  const delayMs = Math.max(0, publishAt.getTime() - Date.now());
  const job = await queue.add(
    `content-${data.contentPostId}`,
    data,
    { delay: delayMs }
  );
  return job.id ?? "unknown";
}

/**
 * Enqueue a lead for enrichment.
 */
export async function enqueueLeadEnrichment(
  data: LeadEnrichmentJob
): Promise<string> {
  const queue = getEnrichmentQueue();
  const job = await queue.add(`enrich-${data.leadId}`, data);
  return job.id ?? "unknown";
}

/* ─── Worker Factories ──────────────────────────────── */

/**
 * Create a campaign execution worker.
 * The processor callback handles the actual LinkedIn actions.
 */
export function createCampaignWorker(
  processor: (job: Job<CampaignStepJob>) => Promise<void>
): Worker<CampaignStepJob> {
  return new Worker<CampaignStepJob>(
    CAMPAIGN_QUEUE_NAME,
    processor,
    {
      connection: getRedisConnectionOptions(),
      concurrency: 2,
      limiter: { max: 10, duration: 60000 },
    }
  );
}

/**
 * Create a content scheduling worker.
 */
export function createContentWorker(
  processor: (job: Job<ContentScheduleJob>) => Promise<void>
): Worker<ContentScheduleJob> {
  return new Worker<ContentScheduleJob>(
    CONTENT_SCHEDULE_QUEUE_NAME,
    processor,
    {
      connection: getRedisConnectionOptions(),
      concurrency: 1,
    }
  );
}

/**
 * Create a lead enrichment worker.
 */
export function createEnrichmentWorker(
  processor: (job: Job<LeadEnrichmentJob>) => Promise<void>
): Worker<LeadEnrichmentJob> {
  return new Worker<LeadEnrichmentJob>(
    LEAD_ENRICHMENT_QUEUE_NAME,
    processor,
    {
      connection: getRedisConnectionOptions(),
      concurrency: 3,
      limiter: { max: 60, duration: 60000 },
    }
  );
}

/* ─── Queue Status ──────────────────────────────────── */

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Get status of all queues.
 */
export async function getAllQueueStatuses(): Promise<QueueStatus[]> {
  const queues = [
    { name: CAMPAIGN_QUEUE_NAME, queue: getCampaignQueue() },
    { name: CONTENT_SCHEDULE_QUEUE_NAME, queue: getContentQueue() },
    { name: LEAD_ENRICHMENT_QUEUE_NAME, queue: getEnrichmentQueue() },
  ];

  const statuses: QueueStatus[] = [];

  for (const { name, queue } of queues) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    statuses.push({ name, waiting, active, completed, failed, delayed });
  }

  return statuses;
}
