import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import mailchimpRouter from "./routes/mailchimp";
import { MailChimpService } from "./services/mailchimpService";
import { specs } from "./config/swagger";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize MailChimp service for OAuth callback
const mailchimpService = new MailChimpService();

// Helper function to generate session ID
const generateSessionId = (req: express.Request): string => {
  return req.ip + "-" + Date.now() + "-" + Math.random().toString(36);
};

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8090",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Session-Id",
      "Auth-Domain",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
      "User-Agent",
      "Referer",
    ],
    exposedHeaders: ["X-Session-Id"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "MailChimp API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

/**
 * @swagger
 * /oauth-verify/mailchimp:
 *   get:
 *     tags:
 *       - OAuth
 *     summary: OAuth callback endpoint for MailChimp authorization
 *     description: |
 *       This endpoint receives the OAuth callback from MailChimp after user authorization.
 *       It processes the authorization code, exchanges it for an access token, and redirects
 *       to the frontend with the result.
 *
 *       **Note**: This endpoint is called directly by MailChimp, not by your frontend.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from MailChimp OAuth
 *         example: "abc123def456ghi789"
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *         example: "random-state-string"
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code if OAuth failed
 *         example: "access_denied"
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Human-readable error description
 *         example: "The user denied the request"
 *     responses:
 *       302:
 *         description: Redirect to frontend with success or error parameters
 *         content:
 *           text/html:
 *             examples:
 *               success:
 *                 summary: Successful OAuth flow
 *                 value: "Redirects to: http://localhost:8090/oauth-verify/mailchimp?success=true&session_id=xyz&account_name=Company&user_email=user@example.com"
 *               error:
 *                 summary: OAuth flow with error
 *                 value: "Redirects to: http://localhost:8090/oauth-verify/mailchimp?error=processing_failed&error_description=Failed%20to%20process%20OAuth%20callback"
 */
// OAuth callback handler - MailChimp redirects here after user authorization
app.get("/oauth-verify/mailchimp", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Frontend URL to redirect to
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8090";
    const frontendCallbackUrl = `${frontendUrl}/oauth-verify/mailchimp`;

    // Handle OAuth error from MailChimp
    if (error) {
      console.error("OAuth error from MailChimp:", error, error_description);
      return res.redirect(
        `${frontendCallbackUrl}?error=${encodeURIComponent(
          error as string
        )}&error_description=${encodeURIComponent(
          (error_description as string) || "OAuth authorization failed"
        )}`
      );
    }

    // Validate authorization code
    if (!code || typeof code !== "string") {
      return res.redirect(
        `${frontendCallbackUrl}?error=missing_code&error_description=${encodeURIComponent(
          "Authorization code not received"
        )}`
      );
    }

    // Exchange code for access token
    const tokenResponse = await mailchimpService.exchangeCodeForToken(code);

    // Get user metadata
    const metadata = await mailchimpService.getUserMetadata(
      tokenResponse.access_token
    );

    // Generate session ID and store session
    const sessionId = generateSessionId(req);
    mailchimpService.storeUserSession(
      sessionId,
      tokenResponse.access_token,
      metadata
    );

    // Redirect to frontend with success and session info
    const successUrl = `${frontendCallbackUrl}?success=true&session_id=${encodeURIComponent(
      sessionId
    )}&account_name=${encodeURIComponent(
      metadata.accountname
    )}&user_email=${encodeURIComponent(metadata.login.email)}`;

    res.redirect(successUrl);
  } catch (error: any) {
    console.error("OAuth callback processing error:", error);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8090";
    const frontendCallbackUrl = `${frontendUrl}/oauth-verify/mailchimp`;

    res.redirect(
      `${frontendCallbackUrl}?error=processing_failed&error_description=${encodeURIComponent(
        error.message || "Failed to process OAuth callback"
      )}`
    );
  }
});

// Routes
app.use("/api/mailchimp", mailchimpRouter);

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check and information
 *     description: Returns API status, version, and available endpoints
 *     responses:
 *       200:
 *         description: API health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "MailChimp Backend API is running!"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 documentation:
 *                   type: string
 *                   example: "http://localhost:3001/api-docs"
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [
 *                     "GET /oauth-verify/mailchimp (OAuth callback)",
 *                     "GET /api/mailchimp/connect",
 *                     "POST /api/mailchimp/oauth/token",
 *                     "GET /api/mailchimp/status",
 *                     "GET /api/mailchimp/lists",
 *                     "POST /api/mailchimp/campaign/send",
 *                     "POST /api/mailchimp/disconnect"
 *                   ]
 */
// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "MailChimp Backend API is running!",
    version: "1.0.0",
    documentation: `http://localhost:${port}/api-docs`,
    endpoints: [
      "GET /oauth-verify/mailchimp (OAuth callback)",
      "GET /api/mailchimp/connect",
      "POST /api/mailchimp/oauth/token",
      "GET /api/mailchimp/status",
      "GET /api/mailchimp/lists",
      "POST /api/mailchimp/campaign/send",
      "POST /api/mailchimp/disconnect",
    ],
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    data: null,
  });
});

app.listen(port, () => {
  console.log(
    `🚀 MailChimp Backend Server is running at http://localhost:${port}`
  );
  console.log(`📧 MailChimp OAuth2 integration ready`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api-docs`
  );
  console.log(
    `🔑 Client ID: ${process.env.MAILCHIMP_CLIENT_ID || "741151044464"}`
  );
  console.log(
    `🌐 Redirect URI: ${
      process.env.MAILCHIMP_REDIRECT_URI ||
      "http://127.0.0.1:3001/oauth-verify/mailchimp"
    }`
  );
  console.log(
    `🎯 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8090"}`
  );
});
