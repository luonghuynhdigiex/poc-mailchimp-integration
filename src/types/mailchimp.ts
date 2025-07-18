// MailChimp OAuth2 Response Types
export interface MailChimpTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface MailChimpMetadata {
  dc: string;
  role: string;
  accountname: string;
  user_id: number;
  login: {
    email: string;
    login_id: string;
    login_name: string;
    login_email: string;
  };
  api_endpoint: string;
}

// API Request/Response Types
export interface OAuthTokenRequest {
  code: string;
  state: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T | null;
}

export interface ConnectionStatus {
  isConnected: boolean;
  accountName?: string;
  userEmail?: string;
}

export interface MailChimpList {
  id: string;
  name: string;
  stats: {
    member_count: number;
  };
}

export interface ListsResponse {
  lists: MailChimpList[];
}

export interface CampaignRequest {
  listId: string;
  subject: string;
  content: string;
  fromName: string;
  replyTo: string;
}

export interface CampaignResponse {
  campaignId: string;
  status: string;
  message: string;
}

// MailChimp API Response Types
export interface MailChimpListsApiResponse {
  lists: Array<{
    id: string;
    name: string;
    stats: {
      member_count: number;
    };
  }>;
  total_items: number;
}

export interface MailChimpCampaignApiResponse {
  id: string;
  status: string;
  type: string;
  create_time: string;
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
  };
}

// Session Storage Interface
export interface UserSession {
  accessToken: string;
  metadata: MailChimpMetadata;
  connectedAt: Date;
}

// Environment Configuration
export interface MailChimpConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
