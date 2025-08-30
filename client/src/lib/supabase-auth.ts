import { createClient, SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const signUp = async (email: string, password: string, username: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Failed to create account");
  }

  // If email confirmation is required, there will be no session until confirmed
  if (data.session) {
    // User is immediately confirmed (email confirmation disabled)
    localStorage.setItem("authToken", data.session.access_token);
    localStorage.setItem("refreshToken", data.session.refresh_token);
    
    const user = {
      id: data.user.id,
      username: username,
      email: email
    };
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  } else {
    // Email confirmation is required
    // Return user info without storing tokens
    return {
      id: data.user.id,
      username: username,
      email: email
    };
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error("Login failed");
  }

  // Store auth tokens
  localStorage.setItem("authToken", data.session.access_token);
  localStorage.setItem("refreshToken", data.session.refresh_token);

  const user = {
    id: data.user.id,
    username: data.user.user_metadata?.username || data.user.email || 'user',
    email: data.user.email
  };

  localStorage.setItem("currentUser", JSON.stringify(user));
  
  return user;
};

export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with logout even if API call fails
  }
  
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("currentUser");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("currentUser");
  return !!(token && user);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

// Function to refresh auth token
export const refreshAuthToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      return null;
    }

    if (data.session) {
      localStorage.setItem("authToken", data.session.access_token);
      localStorage.setItem("refreshToken", data.session.refresh_token);
      return data.session.access_token;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Set up auth state change listener
export const setupAuthListener = (onAuthStateChange: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const user = {
        id: session.user.id,
        username: session.user.user_metadata?.username || session.user.email || 'user',
        email: session.user.email
      };
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authToken", session.access_token);
      localStorage.setItem("refreshToken", session.refresh_token);
      onAuthStateChange(user);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      onAuthStateChange(null);
    } else if (event === 'TOKEN_REFRESHED' && session) {
      localStorage.setItem("authToken", session.access_token);
      localStorage.setItem("refreshToken", session.refresh_token);
    }
  });
};

// Initialize auth session on app start
export const initializeAuth = async (): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const user = {
        id: session.user.id,
        username: session.user.user_metadata?.username || session.user.email || 'user',
        email: session.user.email
      };
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authToken", session.access_token);
      localStorage.setItem("refreshToken", session.refresh_token);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing auth:', error);
    return null;
  }
};