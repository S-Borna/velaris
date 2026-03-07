// Copyright (c) Said Borna. All rights reserved.
// Velaris — Mock LinkedIn Adapter for Development & Testing

import type {
  LinkedInAdapter,
  LinkedInAccount,
  LinkedInLead,
  ActionResult,
  ConnectionResult,
  MessageResult,
  ProfileData,
  ExtractedLead,
  LinkedInMessage,
} from "./types";

/* ─── Constants ─────────────────────────────────────── */

const SIMULATED_DELAY_MIN_MS = 500;
const SIMULATED_DELAY_MAX_MS = 1500;

/* ─── Helpers ───────────────────────────────────────── */

function simulatedDelay(): Promise<void> {
  const delay =
    SIMULATED_DELAY_MIN_MS +
    Math.random() * (SIMULATED_DELAY_MAX_MS - SIMULATED_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/* ─── Mock Adapter ──────────────────────────────────── */

/**
 * Mock LinkedIn adapter that simulates all LinkedIn actions with
 * realistic delays and randomized outcomes. Use in development
 * and testing environments.
 */
export class MockLinkedInAdapter implements LinkedInAdapter {
  private connected = false;
  private accountName: string | null = null;

  async connect(account: LinkedInAccount): Promise<ActionResult> {
    await simulatedDelay();
    this.connected = true;
    this.accountName = account.accountName;
    return {
      success: true,
      message: `[MOCK] Connected as ${account.accountName}`,
      timestamp: new Date(),
    };
  }

  async disconnect(): Promise<void> {
    await simulatedDelay();
    this.connected = false;
    this.accountName = null;
  }

  async sendConnectionRequest(
    lead: LinkedInLead,
    note?: string
  ): Promise<ConnectionResult> {
    await simulatedDelay();
    const success = Math.random() > 0.1; // 90% success rate
    return {
      success,
      message: success
        ? `[MOCK] Connection request sent to ${lead.firstName ?? "lead"}${note ? " with note" : ""}`
        : "[MOCK] Failed to send connection request (simulated failure)",
      timestamp: new Date(),
      connectionStatus: success ? "sent" : "failed",
    };
  }

  async sendMessage(
    lead: LinkedInLead,
    message: string
  ): Promise<MessageResult> {
    await simulatedDelay();
    const success = Math.random() > 0.05; // 95% success rate
    return {
      success,
      message: success
        ? `[MOCK] Message sent to ${lead.firstName ?? "lead"} (${message.length} chars)`
        : "[MOCK] Failed to send message (simulated failure)",
      timestamp: new Date(),
    };
  }

  async viewProfile(lead: LinkedInLead): Promise<ProfileData> {
    await simulatedDelay();
    return {
      fullName: `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Mock User",
      headline: lead.headline ?? "CEO at Mock Company",
      location: "Stockholm, Sweden",
      about: "Experienced professional in the tech industry.",
      currentTitle: lead.headline ?? "CEO",
      currentCompany: lead.company ?? "Mock Company",
      connectionCount: Math.floor(Math.random() * 5000).toString(),
      profilePicUrl: null,
    };
  }

  async likeRecentPost(lead: LinkedInLead): Promise<ActionResult> {
    await simulatedDelay();
    return {
      success: true,
      message: `[MOCK] Liked most recent post by ${lead.firstName ?? "lead"}`,
      timestamp: new Date(),
    };
  }

  async extractLeads(
    _searchUrl: string,
    maxLeads: number
  ): Promise<ExtractedLead[]> {
    await simulatedDelay();
    const count = Math.min(maxLeads, 10);
    const leads: ExtractedLead[] = [];

    const mockNames = [
      "Emma Larsson", "Oscar Berg", "Sofia Andersson", "Liam Nilsson",
      "Olivia Eriksson", "William Johansson", "Alice Carlsson", "Hugo Lindberg",
      "Ella Persson", "Lucas Olsson",
    ];

    const mockTitles = [
      "CEO & Co-Founder", "VP of Sales", "Head of Marketing",
      "CTO", "Growth Lead", "Product Manager", "Director of Ops",
      "Founder", "CMO", "Head of BD",
    ];

    for (let i = 0; i < count; i++) {
      leads.push({
        fullName: mockNames[i] ?? `Lead ${i + 1}`,
        headline: mockTitles[i] ?? "Professional",
        location: "Stockholm, Sweden",
        linkedinUrl: `https://www.linkedin.com/in/mock-user-${i + 1}`,
        connectionDegree: i < 3 ? "2nd" : "3rd+",
      });
    }

    return leads;
  }

  async getInboxMessages(limit: number): Promise<LinkedInMessage[]> {
    await simulatedDelay();
    const count = Math.min(limit, 5);
    const messages: LinkedInMessage[] = [];

    for (let i = 0; i < count; i++) {
      messages.push({
        senderName: `Mock Contact ${i + 1}`,
        senderUrl: `https://www.linkedin.com/in/mock-contact-${i + 1}`,
        content: `This is a mock message #${i + 1} from a simulated conversation.`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        isOwn: i % 3 === 0,
      });
    }

    return messages;
  }

  async getConnectionStatus(
    _lead: LinkedInLead
  ): Promise<"connected" | "pending" | "none"> {
    await simulatedDelay();
    const rand = Math.random();
    if (rand > 0.6) return "connected";
    if (rand > 0.3) return "pending";
    return "none";
  }

  async isSessionValid(): Promise<boolean> {
    return this.connected;
  }
}
