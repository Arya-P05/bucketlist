// Function to check if the user is logged in
export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("token");
  return !!token;
};

// Function to get the token
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
};

// Function to set the token
export const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

// Function to remove the token and user data (logout)
export const removeToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
};

// Function to decode the JWT token (simplified, not secure)
export const decodeToken = (): any => {
  const token = getToken();
  if (!token) return null;

  try {
    // Split the token and get the payload part
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode the base64 string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
};

// Get user ID from token
export const getUserId = (): number | null => {
  const decodedToken = decodeToken();
  return decodedToken?.userId || null;
};
