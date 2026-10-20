import { createContext, useContext, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function login(email, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  }

  async function register(username, email, password) {
    return request("/api/user", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      localStorage.removeItem("user");
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, register, logout, request }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}