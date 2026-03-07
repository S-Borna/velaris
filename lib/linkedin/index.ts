// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Adapter Factory & Exports

import type { LinkedInAdapter } from "./types";

export type { LinkedInAdapter } from "./types";
export type {
  LinkedInAccount,
  LinkedInLead,
  ActionResult,
  ConnectionResult,
  MessageResult,
  ProfileData,
  ExtractedLead,
  LinkedInMessage,
} from "./types";

export { PlaywrightLinkedInAdapter } from "./playwright-adapter";
export { MockLinkedInAdapter } from "./mock-adapter";

/**
 * Create the appropriate LinkedIn adapter based on environment.
 *
 * - Production: PlaywrightLinkedInAdapter (real browser automation)
 * - Development/Test: MockLinkedInAdapter (simulated responses)
 *
 * Override via LINKEDIN_ADAPTER env var.
 */
export function createLinkedInAdapter(): LinkedInAdapter {
  const adapterType =
    process.env.LINKEDIN_ADAPTER ??
    (process.env.NODE_ENV === "production" ? "playwright" : "mock");

  if (adapterType === "playwright") {
    const { PlaywrightLinkedInAdapter } = require("./playwright-adapter");
    return new PlaywrightLinkedInAdapter();
  }

  const { MockLinkedInAdapter } = require("./mock-adapter");
  return new MockLinkedInAdapter();
}
