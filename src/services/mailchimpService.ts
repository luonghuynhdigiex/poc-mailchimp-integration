import axios from "axios";
import {
  MailChimpTokenResponse,
  MailChimpMetadata,
  MailChimpListsApiResponse,
  MailChimpCampaignApiResponse,
  UserSession,
} from "../types/mailchimp";
import {
  getMailChimpConfig,
  MAILCHIMP_OAUTH_URL,
  MAILCHIMP_METADATA_URL,
} from "../config/mailchimp";

// In-memory session storage (replace with Redis/Database in production)
const userSessions = new Map<string, UserSession>();

export class MailChimpService {
  private config = getMailChimpConfig();

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<MailChimpTokenResponse> {
    try {
      const response = await axios.post(
        MAILCHIMP_OAUTH_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code: code,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Token exchange error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to exchange code for token");
    }
  }

  // Get user metadata using access token
  async getUserMetadata(accessToken: string): Promise<MailChimpMetadata> {
    try {
      const response = await axios.get(MAILCHIMP_METADATA_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Metadata fetch error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch user metadata");
    }
  }

  // Store user session
  storeUserSession(
    sessionId: string,
    accessToken: string,
    metadata: MailChimpMetadata
  ): void {
    userSessions.set(sessionId, {
      accessToken,
      metadata,
      connectedAt: new Date(),
    });
  }

  // Get user session
  getUserSession(sessionId: string): UserSession | null {
    return userSessions.get(sessionId) || null;
  }

  // Remove user session
  removeUserSession(sessionId: string): void {
    userSessions.delete(sessionId);
  }

  // Get user's email lists
  async getLists(
    accessToken: string,
    datacenter: string
  ): Promise<MailChimpListsApiResponse> {
    try {
      const response = await axios.get(
        `https://${datacenter}.api.mailchimp.com/3.0/lists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Lists fetch error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch email lists");
    }
  }

  // Create campaign
  async createCampaign(
    accessToken: string,
    datacenter: string,
    listId: string,
    subject: string,
    fromName: string,
    replyTo: string
  ): Promise<MailChimpCampaignApiResponse> {
    try {
      const response = await axios.post(
        `https://${datacenter}.api.mailchimp.com/3.0/campaigns`,
        {
          type: "regular",
          recipients: {
            list_id: listId,
          },
          settings: {
            subject_line: subject,
            from_name: fromName,
            reply_to: replyTo,
            title: `Campaign - ${subject}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Campaign creation error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to create campaign");
    }
  }

  // Set campaign content
  async setCampaignContent(
    accessToken: string,
    datacenter: string,
    campaignId: string,
    htmlContent: string
  ): Promise<void> {
    try {
      await axios.put(
        `https://${datacenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
        {
          html: htmlContent,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error(
        "Campaign content error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to set campaign content");
    }
  }

  // Send campaign
  async sendCampaign(
    accessToken: string,
    datacenter: string,
    campaignId: string
  ): Promise<void> {
    try {
      await axios.post(
        `https://${datacenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error: any) {
      console.error(
        "Campaign send error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to send campaign");
    }
  }
}
