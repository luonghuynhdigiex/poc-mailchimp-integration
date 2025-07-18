# MailChimp OAuth2 Backend Requirements

This document outlines the backend endpoints required to support the MailChimp OAuth2 integration.

## Environment Variables

Make sure to set these environment variables in your backend:

```bash
MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
MAILCHIMP_CLIENT_SECRET=your_mailchimp_client_secret
MAILCHIMP_REDIRECT_URI=http://localhost:3000/oauth-verify/mailchimp
```

And in your frontend `.env` file:

```bash
REACT_APP_MAILCHIMP_CLIENT_ID=your_mailchimp_client_id
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

## Required Backend Endpoints

### 1. GET `/api/mailchimp/connect`

**Purpose**: Initiate OAuth2 connection (optional endpoint for logging/validation)

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "OAuth connection initiated"
  }
}
```

### 2. POST `/api/mailchimp/oauth/token`

**Purpose**: Exchange OAuth2 authorization code for access token

**Request Body**:

```json
{
  "code": "authorization_code_from_mailchimp",
  "state": "oauth_state_parameter"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "accountName": "User's MailChimp Account",
    "userEmail": "user@example.com",
    "isConnected": true
  }
}
```

**Backend Implementation Steps**:

1. Validate the state parameter
2. Exchange code for access token with MailChimp API
3. Get user account information
4. Store the access token securely (associated with the user session)
5. Return account information

### 3. GET `/api/mailchimp/status`

**Purpose**: Check if user is currently connected to MailChimp

**Response**:

```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "accountName": "User's MailChimp Account",
    "userEmail": "user@example.com"
  }
}
```

### 4. GET `/api/mailchimp/lists`

**Purpose**: Get all email lists from user's MailChimp account

**Response**:

```json
{
  "success": true,
  "data": {
    "lists": [
      {
        "id": "list_id_1",
        "name": "Newsletter Subscribers",
        "stats": {
          "member_count": 1250
        }
      },
      {
        "id": "list_id_2",
        "name": "Product Updates",
        "stats": {
          "member_count": 890
        }
      }
    ]
  }
}
```

### 5. POST `/api/mailchimp/campaign/send`

**Purpose**: Create and send email campaign

**Request Body**:

```json
{
  "listId": "mailchimp_list_id",
  "subject": "Campaign Subject Line",
  "content": "<html>Email content...</html>",
  "fromName": "Your Organization",
  "replyTo": "noreply@yourorganization.com"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "campaignId": "mailchimp_campaign_id",
    "status": "sent",
    "message": "Campaign sent successfully"
  }
}
```

### 6. POST `/api/mailchimp/disconnect`

**Purpose**: Disconnect user from MailChimp (revoke tokens)

**Response**:

```json
{
  "success": true,
  "data": {
    "message": "Successfully disconnected from MailChimp"
  }
}
```

## MailChimp API Integration

Your backend will need to interact with MailChimp's API endpoints:

### OAuth2 Token Exchange

```bash
POST https://login.mailchimp.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=YOUR_REDIRECT_URI&
code=AUTHORIZATION_CODE
```

### Get Account Info

```bash
GET https://login.mailchimp.com/oauth2/metadata
Authorization: Bearer ACCESS_TOKEN
```

### Get Lists

```bash
GET https://{dc}.api.mailchimp.com/3.0/lists
Authorization: Bearer ACCESS_TOKEN
```

### Create Campaign

```bash
POST https://{dc}.api.mailchimp.com/3.0/campaigns
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "type": "regular",
  "recipients": {
    "list_id": "LIST_ID"
  },
  "settings": {
    "subject_line": "Subject",
    "from_name": "From Name",
    "reply_to": "reply@example.com",
    "title": "Campaign Title"
  }
}
```

### Set Campaign Content

```bash
PUT https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/content
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "html": "<html>Email content...</html>"
}
```

### Send Campaign

```bash
POST https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/send
Authorization: Bearer ACCESS_TOKEN
```

## Security Considerations

1. **Store access tokens securely** - Use encryption and associate with user sessions
2. **Validate state parameters** - Prevent CSRF attacks
3. **Handle token expiration** - Implement refresh token logic if needed
4. **Rate limiting** - Respect MailChimp's API rate limits
5. **Error handling** - Provide meaningful error messages to frontend

## Error Handling

All endpoints should return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Frontend Route Setup

Make sure your frontend router handles the OAuth callback route:

```javascript
// In your main router
<Route path="/oauth-verify/mailchimp" component={MailchimpAuth} />
```

This route will handle the OAuth2 callback and complete the integration process.

## User Flow

The updated user flow now works as follows:

1. **User clicks "Send with MailChimp"** - Modal opens immediately
2. **If not connected** - User sees connection UI with message about content waiting
3. **User connects via OAuth2** - Redirected to MailChimp for authorization
4. **After successful connection** - Content (subject, HTML, fromName) is automatically loaded
5. **User configures campaign** - Select email list, review settings
6. **User sends campaign** - Email sent via MailChimp API

This approach allows users to connect first, then have their content automatically loaded, providing a smoother experience.
