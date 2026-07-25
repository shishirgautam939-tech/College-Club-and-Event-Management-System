import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in when app starts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        } else {
          setUser({
            user_id: decoded.user_id,
            role: decoded.user_type,
            name: decoded.full_name,
          });
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const trimmedIdentifier = typeof identifier === "string" ? identifier.trim() : "";

    try {
      const res = await api.post("login/", { email: trimmedIdentifier, password });
      const accessToken = res?.data?.access;
      if (!accessToken) {
        throw new Error("Login response did not include an access token.");
      }

      localStorage.setItem("token", accessToken);
      if (res.data.refresh) {
        localStorage.setItem("refreshToken", res.data.refresh);
      } else {
        localStorage.removeItem("refreshToken");
      }

      const role = res.data.user_type || "Student";
      const name = res.data.full_name || "";
      const userId = res.data.id ?? null;

      setUser({
        user_id: userId,
        role,
        name,
      });
      return role;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
