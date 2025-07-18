import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MailChimp Integration API",
      version: "1.0.0",
      description:
        "A comprehensive API for MailChimp OAuth2 integration, list management, and campaign sending",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "http://127.0.0.1:3001",
        description: "Local development server",
      },
    ],
    components: {
      schemas: {
        // Core Response Types
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
            },
            message: {
              type: "string",
              description: "Optional message providing additional information",
            },
            data: {
              description: "Response data, can be any type",
            },
          },
          required: ["success", "data"],
        },

        // OAuth Types
        OAuthTokenRequest: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Authorization code received from MailChimp OAuth",
              example: "abc123def456",
            },
            state: {
              type: "string",
              description: "State parameter for CSRF protection",
              example: "random-state-string",
            },
          },
          required: ["code"],
        },

        ConnectionStatus: {
          type: "object",
          properties: {
            isConnected: {
              type: "boolean",
              description: "Whether user is connected to MailChimp",
            },
            accountName: {
              type: "string",
              description: "MailChimp account name",
              example: "My Company",
            },
            userEmail: {
              type: "string",
              description: "User email address",
              example: "user@example.com",
            },
          },
          required: ["isConnected"],
        },

        // MailChimp List Types
        MailChimpList: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique list identifier",
              example: "1a2b3c4d5e",
            },
            name: {
              type: "string",
              description: "List name",
              example: "Newsletter Subscribers",
            },
            stats: {
              type: "object",
              properties: {
                member_count: {
                  type: "number",
                  description: "Number of members in the list",
                  example: 1250,
                },
              },
              required: ["member_count"],
            },
          },
          required: ["id", "name", "stats"],
        },

        ListsResponse: {
          type: "object",
          properties: {
            lists: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MailChimpList",
              },
              description: "Array of MailChimp lists",
            },
          },
          required: ["lists"],
        },

        // Campaign Types
        CampaignRequest: {
          type: "object",
          properties: {
            listId: {
              type: "string",
              description: "ID of the MailChimp list to send to",
              example: "1a2b3c4d5e",
            },
            subject: {
              type: "string",
              description: "Email subject line",
              example: "Welcome to our Newsletter!",
            },
            content: {
              type: "string",
              description: "HTML content of the email",
              example: "<h1>Welcome!</h1><p>Thank you for subscribing.</p>",
            },
            fromName: {
              type: "string",
              description: "Sender name",
              example: "My Company",
            },
            replyTo: {
              type: "string",
              description: "Reply-to email address",
              example: "noreply@example.com",
            },
          },
          required: ["listId", "subject", "content", "fromName", "replyTo"],
        },

        CampaignResponse: {
          type: "object",
          properties: {
            campaignId: {
              type: "string",
              description: "Unique campaign identifier",
              example: "campaign_123456",
            },
            status: {
              type: "string",
              description: "Campaign status",
              example: "sent",
            },
            message: {
              type: "string",
              description: "Status message",
              example: "Campaign sent successfully",
            },
          },
          required: ["campaignId", "status", "message"],
        },

        // Generic Message Response
        MessageResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Response message",
              example: "Operation completed successfully",
            },
          },
          required: ["message"],
        },

        // Error Response
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
              example: "Invalid request parameters",
            },
            data: {
              type: "null",
              example: null,
            },
          },
          required: ["success", "message", "data"],
        },
      },
      parameters: {
        SessionId: {
          in: "header",
          name: "X-Session-Id",
          schema: {
            type: "string",
          },
          required: true,
          description: "Session ID obtained from OAuth flow",
          example: "192.168.1.1-1635789012345-abc123",
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Invalid input parameters",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Missing required fields",
                data: null,
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized - Not connected to MailChimp",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Not connected to MailChimp",
                data: null,
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Internal server error",
                data: null,
              },
            },
          },
        },
        NotFound: {
          description: "Not Found - Endpoint does not exist",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Endpoint not found",
                data: null,
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "OAuth",
        description: "MailChimp OAuth2 authentication endpoints",
      },
      {
        name: "Connection",
        description: "Connection status and management",
      },
      {
        name: "Lists",
        description: "MailChimp list management",
      },
      {
        name: "Campaigns",
        description: "Email campaign creation and sending",
      },
      {
        name: "Health",
        description: "API health and information endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"], // paths to files containing OpenAPI definitions
};

export const specs = swaggerJsdoc(options);
