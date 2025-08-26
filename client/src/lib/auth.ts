export const isAuthenticated = (): boolean => {
  return localStorage.getItem("isAuthenticated") === "true";
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem("currentUser");
};

export const logout = (): void => {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("currentUser");
};