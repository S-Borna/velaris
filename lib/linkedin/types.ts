// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Adapter Interface

/* ─── Types ─────────────────────────────────────────── */

export interface LinkedInAccount {
  accountName: string;
  sessionCookie: string;
  proxyUrl?: string;
}

export interface LinkedInLead {
  linkedinUrl: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  company?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

export interface ConnectionResult extends ActionResult {
  connectionStatus: "sent" | "already_connected" | "pending" | "failed";
}

export interface MessageResult extends ActionResult {
  messageId?: string;
}

export interface ProfileData {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  about: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  connectionCount: string | null;
  profilePicUrl: string | null;
}

export interface ExtractedLead {
  fullName: string;
  headline: string | null;
  location: string | null;
  linkedinUrl: string;
  connectionDegree: string | null;
}

export interface LinkedInMessage {
  senderName: string;
  senderUrl: string | null;
  content: string;
  timestamp: string | null;
  isOwn: boolean;
}

/* ─── Adapter Interface ─────────────────────────────── */

/**
 * Abstract interface for LinkedIn automation.
 * Implementations: MockLinkedInAdapter (testing), PlaywrightLinkedInAdapter (production).
 */
export interface LinkedInAdapter {
  /** Initialize the adapter and connect the account. */
  connect(account: LinkedInAccount): Promise<ActionResult>;

  /** Disconnect / clean up resources. */
  disconnect(): Promise<void>;

  /** Send a connection request to a lead. */
  sendConnectionRequest(
    lead: LinkedInLead,
    note?: string
  ): Promise<ConnectionResult>;

  /** Send a direct message to a connected lead. */
  sendMessage(
    lead: LinkedInLead,
    message: string
  ): Promise<MessageResult>;

  /** View a lead's profile (generates a profile view notification). */
  viewProfile(lead: LinkedInLead): Promise<ProfileData>;

  /** Like a lead's most recent post. */
  likeRecentPost(lead: LinkedInLead): Promise<ActionResult>;

  /** Extract leads from a LinkedIn search URL. */
  extractLeads(
    searchUrl: string,
    maxLeads: number
  ): Promise<ExtractedLead[]>;

  /** Get recent messages from the inbox. */
  getInboxMessages(limit: number): Promise<LinkedInMessage[]>;

  /** Get connection status with a specific lead. */
  getConnectionStatus(
    lead: LinkedInLead
  ): Promise<"connected" | "pending" | "none">;

  /** Check if the session is still valid. */
  isSessionValid(): Promise<boolean>;
}
