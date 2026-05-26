import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './auth';
import type {
  ApiError,
  CurrentUser,
  Document,
  DocumentListResponse,
  DocumentWithPermissions,
  GoogleAuthURL,
  InvitationActionResult,
  Invitation,
  InvitationListResponse,
  InvitationWithDetails,
  TokenResponse,
  UserProfile,
} from './types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export class ApiRequestError extends Error {
  status: number;
  body: ApiError | null;

  constructor(status: number, message: string, body: ApiError | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseError(response: Response): Promise<ApiRequestError> {
  let body: ApiError | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const detail = body?.detail;
  const message =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ')
        : `Request failed (${response.status})`;
  return new ApiRequestError(response.status, message, body);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const data: TokenResponse = await response.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      if (options.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${getAccessToken()}`);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// --- Auth ---

export async function getGoogleLoginUrl(): Promise<GoogleAuthURL> {
  return apiRequest<GoogleAuthURL>('/auth/google/login', {}, false);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me');
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // ignore
    }
  }
  clearTokens();
}

// --- Users ---

export async function getUserProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}

// --- Documents ---

export async function listDocuments(params?: {
  include_shared?: boolean;
  include_archived?: boolean;
  page?: number;
  page_size?: number;
}): Promise<DocumentListResponse> {
  const search = new URLSearchParams();
  if (params?.include_shared !== undefined) {
    search.set('include_shared', String(params.include_shared));
  }
  if (params?.include_archived !== undefined) {
    search.set('include_archived', String(params.include_archived));
  }
  if (params?.page) search.set('page', String(params.page));
  if (params?.page_size) search.set('page_size', String(params.page_size));
  const qs = search.toString();
  return apiRequest<DocumentListResponse>(`/documents${qs ? `?${qs}` : ''}`);
}

export async function getDocument(documentId: string): Promise<DocumentWithPermissions> {
  return apiRequest<DocumentWithPermissions>(`/documents/${documentId}`);
}

export async function createDocument(data: {
  title?: string;
  description?: string;
  is_public?: boolean;
}): Promise<Document> {
  return apiRequest<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title ?? 'Untitled Document',
      description: data.description ?? null,
      is_public: data.is_public ?? false,
    }),
  });
}

export async function updateDocument(
  documentId: string,
  data: { title?: string; description?: string; is_archived?: boolean; is_public?: boolean },
): Promise<Document> {
  return apiRequest<Document>(`/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(
  documentId: string,
  permanent = false,
): Promise<{ status: string; message: string }> {
  const qs = permanent ? '?permanent=true' : '';
  return apiRequest<{ status: string; message: string }>(`/documents/${documentId}${qs}`, {
    method: 'DELETE',
  });
}

// --- Invitations ---

export async function listReceivedInvitations(): Promise<InvitationWithDetails[]> {
  return apiRequest<InvitationWithDetails[]>('/invitations/received');
}

export async function listSentInvitations(params?: {
  page?: number;
  page_size?: number;
}): Promise<InvitationListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.page_size) search.set('page_size', String(params.page_size));
  const qs = search.toString();
  return apiRequest<InvitationListResponse>(`/invitations/sent${qs ? `?${qs}` : ''}`);
}

export async function respondToInvitation(
  invitationId: string,
  accept: boolean,
): Promise<InvitationActionResult> {
  return apiRequest<InvitationActionResult>(`/invitations/${invitationId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function createInvitation(data: {
  document_id: string;
  invitee_email: string;
  role?: 'VIEWER' | 'EDITOR';
  message?: string;
}): Promise<Invitation> {
  return apiRequest('/invitations', {
    method: 'POST',
    body: JSON.stringify({
      document_id: data.document_id,
      invitee_email: data.invitee_email,
      role: data.role ?? 'VIEWER',
      message: data.message ?? null,
    }),
  });
}

export async function cancelInvitation(invitationId: string): Promise<InvitationActionResult> {
  return apiRequest<InvitationActionResult>(`/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

export function getWebSocketUrl(documentId: string): string {
  const token = getAccessToken();
  const base = API_BASE_URL.replace(/^http/, 'ws');
  const url = new URL(`${base}/ws/documents/${documentId}`);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}
