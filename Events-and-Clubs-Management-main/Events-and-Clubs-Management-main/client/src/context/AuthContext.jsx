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
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post("login/", { email: identifier.trim(), password });
    localStorage.setItem("token", res.data.access);
    if (res.data.refresh) {
      localStorage.setItem("refreshToken", res.data.refresh);
    }

    const role = res.data.user_type;
    const name = res.data.full_name;
    const userId = res.data.id;

    setUser({
      user_id: userId,
      role,
      name,
    });
    return role;
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
