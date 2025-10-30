/**
 * MongoDB Authentication with JWT
 * Replaces Supabase Auth
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: string;
  email: string;
  username: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

/**
 * Set authentication tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Clear authentication tokens
 */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Set current user in localStorage
 */
export function setCurrentUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Register a new user
 */
export async function register(email: string, password: string, username?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data: AuthResponse = await response.json();

  // Store tokens and user
  setTokens(data.accessToken, data.refreshToken);
  setCurrentUser(data.user);

  return data;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data: AuthResponse = await response.json();

  // Store tokens and user
  setTokens(data.accessToken, data.refreshToken);
  setCurrentUser(data.user);

  return data;
}

/**
 * Logout current user
 */
export function logout(): void {
  clearTokens();
  window.location.href = '/login';
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // Refresh token is invalid, logout user
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data: AuthTokens = await response.json();
  setTokens(data.accessToken, data.refreshToken);

  return data.accessToken;
}

/**
 * Get current user info from server
 */
export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh token
      const newToken = await refreshAccessToken();

      // Retry with new token
      const retryResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      });

      if (!retryResponse.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await retryResponse.json();
      setCurrentUser(user);
      return user;
    }

    throw new Error('Failed to fetch user');
  }

  const user = await response.json();
  setCurrentUser(user);
  return user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getCurrentUser();
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };

  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();

      // Retry request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } catch (error) {
      // Refresh failed, logout user
      logout();
      throw error;
    }
  }

  return response;
}
