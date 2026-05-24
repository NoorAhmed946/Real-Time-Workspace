export type DocumentRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface GoogleAuthURL {
  authorization_url: string;
  state: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface UserProfile extends CurrentUser {
  is_active: boolean;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_archived: boolean;
  is_public: boolean;
  crdt_version: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string | null;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface DocumentWithPermissions extends Document {
  permissions: unknown[];
  user_role: DocumentRole | null;
}

export interface Invitation {
  id: string;
  document_id: string;
  invited_by_id: string;
  invitee_email: string;
  invitee_id: string | null;
  role: DocumentRole;
  status: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface InvitationWithDetails extends Invitation {
  document_title: string;
  invited_by_name: string;
  invited_by_email: string;
}

export interface InvitationActionResult {
  success: boolean;
  message: string;
  role?: string;
  document_id?: string;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total: number;
}

export interface ApiError {
  detail?: string | { msg?: string }[];
}
