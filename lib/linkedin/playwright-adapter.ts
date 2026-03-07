// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Automation via Playwright (Browser Automation)

import { chromium, Browser, BrowserContext, Page } from "playwright";
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

const LINKEDIN_BASE_URL = "https://www.linkedin.com";
const LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login";
const LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/";
const LINKEDIN_MESSAGING_URL = "https://www.linkedin.com/messaging/";

const DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;
const DEFAULT_ACTION_TIMEOUT_MS = 10000;
const HUMAN_DELAY_MIN_MS = 1500;
const HUMAN_DELAY_MAX_MS = 4000;
const TYPING_DELAY_MIN_MS = 30;
const TYPING_DELAY_MAX_MS = 80;

/* ─── Helpers ───────────────────────────────────────── */

/**
 * Random delay to simulate human behavior.
 */
function humanDelay(): Promise<void> {
  const delay =
    HUMAN_DELAY_MIN_MS +
    Math.random() * (HUMAN_DELAY_MAX_MS - HUMAN_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Random typing delay per character.
 */
function typingDelay(): number {
  return (
    TYPING_DELAY_MIN_MS +
    Math.random() * (TYPING_DELAY_MAX_MS - TYPING_DELAY_MIN_MS)
  );
}

/**
 * Type text with human-like delays between keystrokes.
 */
async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: typingDelay() });
  }
}

/**
 * Extract the LinkedIn username/slug from a full URL.
 */
function extractLinkedInSlug(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/);
  return match ? match[1] : url;
}

/* ─── Playwright Adapter ────────────────────────────── */

/**
 * LinkedIn automation adapter using Playwright browser automation.
 *
 * Requires a valid LinkedIn session cookie (li_at) to authenticate.
 * Uses headless Chromium with human-like delays to avoid detection.
 */
export class PlaywrightLinkedInAdapter implements LinkedInAdapter {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private account: LinkedInAccount | null = null;

  /**
   * Connect to LinkedIn using session cookie.
   */
  async connect(account: LinkedInAccount): Promise<ActionResult> {
    this.account = account;

    if (!account.sessionCookie) {
      return {
        success: false,
        message: "Session cookie (li_at) is required",
        timestamp: new Date(),
      };
    }

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
        ],
      });

      const contextOptions: Record<string, unknown> = {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        viewport: { width: 1440, height: 900 },
        locale: "en-US",
        timezoneId: "America/New_York",
      };

      if (account.proxyUrl) {
        contextOptions.proxy = { server: account.proxyUrl };
      }

      this.context = await this.browser.newContext(contextOptions);

      // Set the LinkedIn session cookie
      await this.context.addCookies([
        {
          name: "li_at",
          value: account.sessionCookie,
          domain: ".linkedin.com",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "None",
        },
      ]);

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(DEFAULT_NAVIGATION_TIMEOUT_MS);

      // Navigate to feed to verify session
      await this.page.goto(LINKEDIN_FEED_URL, {
        waitUntil: "domcontentloaded",
      });

      // Check if we're on the login page (session expired)
      const currentUrl = this.page.url();
      if (currentUrl.includes("/login") || currentUrl.includes("/authwall")) {
        return {
          success: false,
          message: "Session cookie is expired or invalid",
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        message: `Connected as ${account.accountName}`,
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown connection error";
      return {
        success: false,
        message: `Connection failed: ${errorMsg}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Close browser and clean up resources.
   */
  async disconnect(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.page = null;
    this.account = null;
  }

  /**
   * Ensure we have an active page. Throws if not connected.
   */
  private getPage(): Page {
    if (!this.page) {
      throw new Error("Not connected. Call connect() first.");
    }
    return this.page;
  }

  /**
   * Send a connection request to a lead.
   */
  async sendConnectionRequest(
    lead: LinkedInLead,
    note?: string
  ): Promise<ConnectionResult> {
    const page = this.getPage();

    try {
      const profileUrl = lead.linkedinUrl.startsWith("http")
        ? lead.linkedinUrl
        : `${LINKEDIN_BASE_URL}/in/${extractLinkedInSlug(lead.linkedinUrl)}`;

      await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
      await humanDelay();

      // Look for Connect button
      const connectButton = page.locator(
        'button:has-text("Connect"), button[aria-label*="connect" i]'
      );

      if (await connectButton.count() === 0) {
        // Check if already connected
        const messageButton = page.locator(
          'button:has-text("Message"), a:has-text("Message")'
        );
        if (await messageButton.count() > 0) {
          return {
            success: true,
            message: "Already connected",
            timestamp: new Date(),
            connectionStatus: "already_connected",
          };
        }

        // Check for pending
        const pendingButton = page.locator('button:has-text("Pending")');
        if (await pendingButton.count() > 0) {
          return {
            success: true,
            message: "Connection request already pending",
            timestamp: new Date(),
            connectionStatus: "pending",
          };
        }

        // Try More → Connect flow
        const moreButton = page.locator('button:has-text("More")');
        if (await moreButton.count() > 0) {
          await moreButton.first().click();
          await humanDelay();
          const connectInMenu = page.locator(
            'div[role="menuitem"]:has-text("Connect")'
          );
          if (await connectInMenu.count() > 0) {
            await connectInMenu.first().click();
          } else {
            return {
              success: false,
              message: "Connect option not found in menu",
              timestamp: new Date(),
              connectionStatus: "failed",
            };
          }
        } else {
          return {
            success: false,
            message: "Connect button not found on profile",
            timestamp: new Date(),
            connectionStatus: "failed",
          };
        }
      } else {
        await connectButton.first().click();
      }

      await humanDelay();

      // Handle the "Add a note" dialog
      if (note) {
        const addNoteButton = page.locator('button:has-text("Add a note")');
        if (await addNoteButton.count() > 0) {
          await addNoteButton.click();
          await humanDelay();

          const noteTextarea = page.locator(
            'textarea[name="message"], textarea#custom-message'
          );
          if (await noteTextarea.count() > 0) {
            await humanType(page, "textarea", note);
          }
        }
      }

      // Click Send
      const sendButton = page.locator(
        'button:has-text("Send"), button[aria-label*="Send"]'
      );
      if (await sendButton.count() > 0) {
        await sendButton.first().click();
        await humanDelay();
      }

      return {
        success: true,
        message: `Connection request sent to ${lead.firstName ?? "lead"}`,
        timestamp: new Date(),
        connectionStatus: "sent",
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to send connection request: ${errorMsg}`,
        timestamp: new Date(),
        connectionStatus: "failed",
      };
    }
  }

  /**
   * Send a direct message to a connected lead.
   */
  async sendMessage(
    lead: LinkedInLead,
    message: string
  ): Promise<MessageResult> {
    const page = this.getPage();

    try {
      const profileUrl = lead.linkedinUrl.startsWith("http")
        ? lead.linkedinUrl
        : `${LINKEDIN_BASE_URL}/in/${extractLinkedInSlug(lead.linkedinUrl)}`;

      await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
      await humanDelay();

      // Click Message button on profile
      const messageButton = page.locator(
        'button:has-text("Message"), a:has-text("Message")'
      );

      if (await messageButton.count() === 0) {
        return {
          success: false,
          message: "Message button not found — lead may not be connected",
          timestamp: new Date(),
        };
      }

      await messageButton.first().click();
      await humanDelay();

      // Wait for message compose box
      const composeBox = page.locator(
        'div[role="textbox"][contenteditable="true"], div.msg-form__contenteditable'
      );
      await composeBox.waitFor({
        state: "visible",
        timeout: DEFAULT_ACTION_TIMEOUT_MS,
      });

      // Type the message with human-like delays
      await composeBox.click();
      for (const char of message) {
        await page.keyboard.type(char, { delay: typingDelay() });
      }

      await humanDelay();

      // Click Send
      const sendButton = page.locator(
        'button[type="submit"]:has-text("Send"), button.msg-form__send-button'
      );
      if (await sendButton.count() > 0) {
        await sendButton.first().click();
        await humanDelay();
      }

      return {
        success: true,
        message: `Message sent to ${lead.firstName ?? "lead"}`,
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to send message: ${errorMsg}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * View a lead's profile to generate a view notification.
   */
  async viewProfile(lead: LinkedInLead): Promise<ProfileData> {
    const page = this.getPage();

    const profileUrl = lead.linkedinUrl.startsWith("http")
      ? lead.linkedinUrl
      : `${LINKEDIN_BASE_URL}/in/${extractLinkedInSlug(lead.linkedinUrl)}`;

    await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
    await humanDelay();

    // Extract profile data
    const fullName = await page
      .locator("h1")
      .first()
      .textContent()
      .catch(() => null);

    const headline = await page
      .locator("div.text-body-medium")
      .first()
      .textContent()
      .catch(() => null);

    const location = await page
      .locator("span.text-body-small.inline")
      .first()
      .textContent()
      .catch(() => null);

    const about = await page
      .locator('section:has(#about) div.display-flex span[aria-hidden="true"]')
      .first()
      .textContent()
      .catch(() => null);

    const profilePicUrl = await page
      .locator("img.pv-top-card-profile-picture__image")
      .first()
      .getAttribute("src")
      .catch(() => null);

    return {
      fullName: fullName?.trim() ?? null,
      headline: headline?.trim() ?? null,
      location: location?.trim() ?? null,
      about: about?.trim() ?? null,
      currentTitle: null,
      currentCompany: null,
      connectionCount: null,
      profilePicUrl: profilePicUrl ?? null,
    };
  }

  /**
   * Like the lead's most recent post.
   */
  async likeRecentPost(lead: LinkedInLead): Promise<ActionResult> {
    const page = this.getPage();

    try {
      const slug = extractLinkedInSlug(lead.linkedinUrl);
      const activityUrl = `${LINKEDIN_BASE_URL}/in/${slug}/recent-activity/all/`;

      await page.goto(activityUrl, { waitUntil: "domcontentloaded" });
      await humanDelay();

      // Find first Like button that hasn't been clicked
      const likeButton = page
        .locator(
          'button[aria-label*="Like"]:not([aria-pressed="true"])'
        )
        .first();

      if (await likeButton.count() === 0) {
        return {
          success: false,
          message: "No unliked posts found or no posts available",
          timestamp: new Date(),
        };
      }

      await likeButton.click();
      await humanDelay();

      return {
        success: true,
        message: `Liked most recent post by ${lead.firstName ?? "lead"}`,
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to like post: ${errorMsg}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Extract leads from a LinkedIn search results URL.
   */
  async extractLeads(
    searchUrl: string,
    maxLeads: number
  ): Promise<ExtractedLead[]> {
    const page = this.getPage();
    const leads: ExtractedLead[] = [];

    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
      await humanDelay();

      const resultCards = page.locator(
        'li.reusable-search__result-container, div.search-results-container li'
      );
      const count = Math.min(await resultCards.count(), maxLeads);

      for (let i = 0; i < count; i++) {
        const card = resultCards.nth(i);

        const nameEl = card.locator(
          'span[aria-hidden="true"], a.app-aware-link span'
        );
        const fullName = (await nameEl.first().textContent().catch(() => null))?.trim() ?? "";

        const headlineEl = card.locator("div.entity-result__primary-subtitle");
        const headline = (await headlineEl.first().textContent().catch(() => null))?.trim() ?? null;

        const locationEl = card.locator("div.entity-result__secondary-subtitle");
        const location = (await locationEl.first().textContent().catch(() => null))?.trim() ?? null;

        const linkEl = card.locator("a.app-aware-link");
        const linkedinUrl = (await linkEl.first().getAttribute("href").catch(() => null)) ?? "";

        const degreeEl = card.locator("span.entity-result__badge-text");
        const connectionDegree = (await degreeEl.first().textContent().catch(() => null))?.trim() ?? null;

        if (fullName && linkedinUrl) {
          leads.push({
            fullName,
            headline,
            location,
            linkedinUrl: linkedinUrl.split("?")[0],
            connectionDegree,
          });
        }
      }

      return leads;
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[LinkedIn Extract]", errorMsg);
      return leads;
    }
  }

  /**
   * Get recent inbox messages.
   */
  async getInboxMessages(limit: number): Promise<LinkedInMessage[]> {
    const page = this.getPage();
    const messages: LinkedInMessage[] = [];

    try {
      await page.goto(LINKEDIN_MESSAGING_URL, {
        waitUntil: "domcontentloaded",
      });
      await humanDelay();

      const threadItems = page.locator("li.msg-conversation-listitem");
      const count = Math.min(await threadItems.count(), limit);

      for (let i = 0; i < count; i++) {
        const thread = threadItems.nth(i);

        const nameEl = thread.locator("h3.msg-conversation-listitem__participant-names");
        const senderName = (await nameEl.textContent().catch(() => null))?.trim() ?? "Unknown";

        const contentEl = thread.locator("p.msg-conversation-card__message-snippet");
        const content = (await contentEl.textContent().catch(() => null))?.trim() ?? "";

        const timeEl = thread.locator("time.msg-conversation-listitem__time-stamp");
        const timestamp = (await timeEl.textContent().catch(() => null))?.trim() ?? null;

        messages.push({
          senderName,
          senderUrl: null,
          content,
          timestamp,
          isOwn: false,
        });
      }

      return messages;
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[LinkedIn Inbox]", errorMsg);
      return messages;
    }
  }

  /**
   * Check connection status with a lead.
   */
  async getConnectionStatus(
    lead: LinkedInLead
  ): Promise<"connected" | "pending" | "none"> {
    const page = this.getPage();

    try {
      const profileUrl = lead.linkedinUrl.startsWith("http")
        ? lead.linkedinUrl
        : `${LINKEDIN_BASE_URL}/in/${extractLinkedInSlug(lead.linkedinUrl)}`;

      await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
      await humanDelay();

      const messageButton = page.locator('button:has-text("Message")');
      if (await messageButton.count() > 0) return "connected";

      const pendingButton = page.locator('button:has-text("Pending")');
      if (await pendingButton.count() > 0) return "pending";

      return "none";
    } catch {
      return "none";
    }
  }

  /**
   * Check if the current session cookie is still valid.
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const page = this.getPage();
      await page.goto(LINKEDIN_FEED_URL, { waitUntil: "domcontentloaded" });
      const url = page.url();
      return !url.includes("/login") && !url.includes("/authwall");
    } catch {
      return false;
    }
  }
}
