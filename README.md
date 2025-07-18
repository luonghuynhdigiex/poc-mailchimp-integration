# MailChimp Backend API Demo

A comprehensive Node.js/Express.js backend API for MailChimp OAuth2 integration, featuring email list management and campaign sending capabilities.

## 🚀 Features

- **OAuth2 Integration**: Secure MailChimp authentication flow
- **Email List Management**: Retrieve and manage MailChimp email lists
- **Campaign Management**: Create and send email campaigns
- **Session Management**: Secure session handling for authenticated users
- **Comprehensive API Documentation**: Interactive Swagger UI documentation
- **TypeScript Support**: Full type safety and IntelliSense support

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:

**Swagger UI**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

The Swagger documentation includes:

- Complete API reference for all endpoints
- Request/response schemas and examples
- Interactive testing interface
- Authentication flow documentation
- Comprehensive error handling documentation

## 🛠 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Mailchimp-BE-Demo
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your MailChimp OAuth credentials:

```env
MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
MAILCHIMP_CLIENT_SECRET=your_mailchimp_client_secret
MAILCHIMP_REDIRECT_URI=http://127.0.0.1:3001/oauth-verify/mailchimp
FRONTEND_URL=http://localhost:8090
PORT=3001
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

### Production Build

```bash
npm run build
npm start
# or
yarn build
yarn start
```

The server will start on `http://localhost:3001`

## 📖 API Endpoints

### Authentication & Connection

- `GET /oauth-verify/mailchimp` - OAuth callback endpoint (called by MailChimp)
- `GET /api/mailchimp/connect` - Initiate OAuth connection
- `POST /api/mailchimp/oauth/token` - Exchange OAuth code for token
- `GET /api/mailchimp/status` - Check connection status
- `POST /api/mailchimp/disconnect` - Disconnect from MailChimp

### List Management

- `GET /api/mailchimp/lists` - Get all email lists

### Campaign Management

- `POST /api/mailchimp/campaign/send` - Create and send email campaign

### Documentation & Health

- `GET /` - API health check and information
- `GET /api-docs` - Interactive Swagger documentation

## 🔐 OAuth Flow

1. **Frontend initiates OAuth**: Direct user to MailChimp authorization URL
2. **MailChimp redirects to backend**: `http://127.0.0.1:3001/oauth-verify/mailchimp?code=...`
3. **Backend processes OAuth**: Exchange code for token, create session
4. **Backend redirects to frontend**: `http://localhost:8090/oauth-verify/mailchimp?success=true&session_id=...`

## 📝 Request/Response Examples

### Successful OAuth Token Exchange

```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "accountName": "My Company",
    "userEmail": "user@example.com"
  }
}
```

### Get Email Lists

```json
{
  "success": true,
  "data": {
    "lists": [
      {
        "id": "1a2b3c4d5e",
        "name": "Newsletter Subscribers",
        "stats": {
          "member_count": 1250
        }
      }
    ]
  }
}
```

### Send Campaign

```json
// Request
{
  "listId": "1a2b3c4d5e",
  "subject": "Welcome to our Newsletter!",
  "content": "<h1>Welcome!</h1><p>Thank you for subscribing.</p>",
  "fromName": "My Company",
  "replyTo": "noreply@example.com"
}

// Response
{
  "success": true,
  "data": {
    "campaignId": "campaign_123456",
    "status": "sent",
    "message": "Campaign sent successfully"
  }
}
```

## 🔒 Authentication

All API endpoints (except OAuth callback and health check) require the `X-Session-Id` header:

```http
X-Session-Id: 192.168.1.1-1635789012345-abc123
```

The session ID is obtained from the OAuth flow completion.

## 🏗 Project Structure

```
src/
├── config/
│   ├── mailchimp.ts     # MailChimp configuration
│   └── swagger.ts       # Swagger/OpenAPI configuration
├── routes/
│   └── mailchimp.ts     # MailChimp API routes
├── services/
│   └── mailchimpService.ts  # MailChimp service layer
├── types/
│   └── mailchimp.ts     # TypeScript type definitions
└── index.ts             # Main application entry point
```

## 🧪 Testing the API

1. **Using Swagger UI** (Recommended):

   - Navigate to `http://localhost:3001/api-docs`
   - Use the interactive interface to test endpoints

2. **Using cURL**:

```bash
# Health check
curl http://localhost:3001/

# Check connection status
curl -H "X-Session-Id: your_session_id" http://localhost:3001/api/mailchimp/status
```

3. **Using Postman**:
   - Import the OpenAPI spec from `http://localhost:3001/api-docs`
   - Test endpoints with proper authentication headers

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not connected to MailChimp)
- `500` - Internal Server Error

## 🚀 Deployment

For production deployment:

1. Set production environment variables
2. Build the TypeScript code: `npm run build`
3. Start the server: `npm start`
4. Configure reverse proxy (nginx/Apache) for HTTPS
5. Set up proper session storage (Redis/Database)

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
# poc-mailchimp-integration
# poc-mailchimp-integration
