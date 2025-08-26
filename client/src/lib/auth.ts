interface User {
  id: string;
  username: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (username: string, password: string): Promise<User> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  const data: AuthResponse = await response.json();
  
  // Store auth token
  localStorage.setItem("authToken", data.token);
  localStorage.setItem("currentUser", JSON.stringify(data.user));
  
  return data.user;
};

export const logout = async (): Promise<void> => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      }
    });
  } catch (error) {
    // Continue with logout even if API call fails
  }
  
  localStorage.removeItem("authToken");
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