import { Router, Request, Response } from "express";
import { MailChimpService } from "../services/mailchimpService";
import {
  ApiResponse,
  OAuthTokenRequest,
  ConnectionStatus,
  ListsResponse,
  CampaignRequest,
  CampaignResponse,
} from "../types/mailchimp";

const router = Router();
const mailchimpService = new MailChimpService();

// Helper function to generate session ID (in production, use proper session management)
const generateSessionId = (req: Request): string => {
  return req.ip + "-" + Date.now() + "-" + Math.random().toString(36);
};

// Helper function to get session ID from request (simplified)
const getSessionId = (req: Request): string => {
  // In production, get this from session cookies or JWT
  return (req.headers["x-session-id"] as string) || generateSessionId(req);
};

/**
 * @swagger
 * /api/mailchimp/connect:
 *   get:
 *     tags:
 *       - Connection
 *     summary: Initiate MailChimp OAuth connection
 *     description: |
 *       This endpoint indicates that OAuth connection can be initiated.
 *       To start the actual OAuth flow, redirect the user to MailChimp's authorization URL:
 *
 *       `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&state={STATE}`
 *     responses:
 *       200:
 *         description: OAuth connection can be initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "OAuth connection initiated"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 1. GET /api/mailchimp/connect
router.get(
  "/connect",
  (req: Request, res: Response<ApiResponse<{ message: string }>>) => {
    try {
      res.json({
        success: true,
        data: {
          message: "OAuth connection initiated",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        data: null,
      });
    }
  }
);

/**
 * @swagger
 * /api/mailchimp/oauth/token:
 *   post:
 *     tags:
 *       - OAuth
 *     summary: Exchange OAuth authorization code for access token
 *     description: |
 *       Exchange the authorization code received from MailChimp OAuth callback
 *       for an access token and establish a user session.
 *
 *       **Note**: This endpoint is typically called by your frontend after receiving
 *       the authorization code from the OAuth callback flow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OAuthTokenRequest'
 *           example:
 *             code: "abc123def456ghi789"
 *             state: "random-state-string"
 *     responses:
 *       200:
 *         description: OAuth token exchange successful
 *         headers:
 *           X-Session-Id:
 *             description: Session ID for subsequent API calls
 *             schema:
 *               type: string
 *             example: "192.168.1.1-1635789012345-abc123"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ConnectionStatus'
 *             example:
 *               success: true
 *               data:
 *                 isConnected: true
 *                 accountName: "My Company"
 *                 userEmail: "user@example.com"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 2. POST /api/mailchimp/oauth/token
router.post(
  "/oauth/token",
  async (
    req: Request<{}, ApiResponse<ConnectionStatus>, OAuthTokenRequest>,
    res: Response<ApiResponse<ConnectionStatus>>
  ) => {
    try {
      const { code, state } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Authorization code is required",
          data: null,
        });
      }

      // Exchange code for access token
      const tokenResponse = await mailchimpService.exchangeCodeForToken(code);

      // Get user metadata
      const metadata = await mailchimpService.getUserMetadata(
        tokenResponse.access_token
      );

      // Store session
      const sessionId = getSessionId(req);
      mailchimpService.storeUserSession(
        sessionId,
        tokenResponse.access_token,
        metadata
      );

      // Send session ID back to frontend
      res.setHeader("X-Session-Id", sessionId);

      res.json({
        success: true,
        data: {
          accountName: metadata.accountname,
          userEmail: metadata.login.email,
          isConnected: true,
        },
      });
    } catch (error: any) {
      console.error("OAuth token exchange error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to exchange OAuth token",
        data: null,
      });
    }
  }
);

/**
 * @swagger
 * /api/mailchimp/status:
 *   get:
 *     tags:
 *       - Connection
 *     summary: Check MailChimp connection status
 *     description: Check if the user is currently connected to MailChimp and get account information
 *     parameters:
 *       - $ref: '#/components/parameters/SessionId'
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ConnectionStatus'
 *             examples:
 *               connected:
 *                 summary: User is connected
 *                 value:
 *                   success: true
 *                   data:
 *                     isConnected: true
 *                     accountName: "My Company"
 *                     userEmail: "user@example.com"
 *               not_connected:
 *                 summary: User is not connected
 *                 value:
 *                   success: true
 *                   data:
 *                     isConnected: false
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 3. GET /api/mailchimp/status
router.get(
  "/status",
  (req: Request, res: Response<ApiResponse<ConnectionStatus>>) => {
    try {
      const sessionId = getSessionId(req);
      const session = mailchimpService.getUserSession(sessionId);

      if (!session) {
        return res.json({
          success: true,
          data: {
            isConnected: false,
          },
        });
      }

      res.json({
        success: true,
        data: {
          isConnected: true,
          accountName: session.metadata.accountname,
          userEmail: session.metadata.login.email,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        data: null,
      });
    }
  }
);

/**
 * @swagger
 * /api/mailchimp/lists:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Get MailChimp email lists
 *     description: Retrieve all email lists from the connected MailChimp account
 *     parameters:
 *       - $ref: '#/components/parameters/SessionId'
 *     responses:
 *       200:
 *         description: Email lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ListsResponse'
 *             example:
 *               success: true
 *               data:
 *                 lists:
 *                   - id: "1a2b3c4d5e"
 *                     name: "Newsletter Subscribers"
 *                     stats:
 *                       member_count: 1250
 *                   - id: "5e4d3c2b1a"
 *                     name: "Product Updates"
 *                     stats:
 *                       member_count: 892
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 4. GET /api/mailchimp/lists
router.get(
  "/lists",
  async (req: Request, res: Response<ApiResponse<ListsResponse>>) => {
    try {
      const sessionId = getSessionId(req);
      const session = mailchimpService.getUserSession(sessionId);

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Not connected to MailChimp",
          data: null,
        });
      }

      const listsResponse = await mailchimpService.getLists(
        session.accessToken,
        session.metadata.dc
      );

      res.json({
        success: true,
        data: {
          lists: listsResponse.lists.map((list) => ({
            id: list.id,
            name: list.name,
            stats: {
              member_count: list.stats.member_count,
            },
          })),
        },
      });
    } catch (error: any) {
      console.error("Lists fetch error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch email lists",
        data: null,
      });
    }
  }
);

/**
 * @swagger
 * /api/mailchimp/campaign/send:
 *   post:
 *     tags:
 *       - Campaigns
 *     summary: Create and send email campaign
 *     description: |
 *       Create a new email campaign and send it to the specified MailChimp list.
 *       This operation will:
 *       1. Create a new campaign with the provided settings
 *       2. Set the HTML content for the campaign
 *       3. Send the campaign immediately
 *     parameters:
 *       - $ref: '#/components/parameters/SessionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampaignRequest'
 *           example:
 *             listId: "1a2b3c4d5e"
 *             subject: "Welcome to our Newsletter!"
 *             content: "<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter.</p>"
 *             fromName: "My Company"
 *             replyTo: "noreply@example.com"
 *     responses:
 *       200:
 *         description: Campaign created and sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignResponse'
 *             example:
 *               success: true
 *               data:
 *                 campaignId: "campaign_123456"
 *                 status: "sent"
 *                 message: "Campaign sent successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 5. POST /api/mailchimp/campaign/send
router.post(
  "/campaign/send",
  async (
    req: Request<{}, ApiResponse<CampaignResponse>, CampaignRequest>,
    res: Response<ApiResponse<CampaignResponse>>
  ) => {
    try {
      const { listId, subject, content, fromName, replyTo } = req.body;

      // Validate required fields
      if (!listId || !subject || !content || !fromName || !replyTo) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: listId, subject, content, fromName, replyTo",
          data: null,
        });
      }

      const sessionId = getSessionId(req);
      const session = mailchimpService.getUserSession(sessionId);

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Not connected to MailChimp",
          data: null,
        });
      }

      // Create campaign
      const campaign = await mailchimpService.createCampaign(
        session.accessToken,
        session.metadata.dc,
        listId,
        subject,
        fromName,
        replyTo
      );

      // Set campaign content
      await mailchimpService.setCampaignContent(
        session.accessToken,
        session.metadata.dc,
        campaign.id,
        content
      );

      // Send campaign
      await mailchimpService.sendCampaign(
        session.accessToken,
        session.metadata.dc,
        campaign.id
      );

      res.json({
        success: true,
        data: {
          campaignId: campaign.id,
          status: "sent",
          message: "Campaign sent successfully",
        },
      });
    } catch (error: any) {
      console.error("Campaign send error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send campaign",
        data: null,
      });
    }
  }
);

/**
 * @swagger
 * /api/mailchimp/disconnect:
 *   post:
 *     tags:
 *       - Connection
 *     summary: Disconnect from MailChimp
 *     description: Remove the MailChimp connection and clear the user session
 *     parameters:
 *       - $ref: '#/components/parameters/SessionId'
 *     responses:
 *       200:
 *         description: Successfully disconnected from MailChimp
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               data:
 *                 message: "Successfully disconnected from MailChimp"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// 6. POST /api/mailchimp/disconnect
router.post(
  "/disconnect",
  (req: Request, res: Response<ApiResponse<{ message: string }>>) => {
    try {
      const sessionId = getSessionId(req);
      mailchimpService.removeUserSession(sessionId);

      res.json({
        success: true,
        data: {
          message: "Successfully disconnected from MailChimp",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        data: null,
      });
    }
  }
);

export default router;
