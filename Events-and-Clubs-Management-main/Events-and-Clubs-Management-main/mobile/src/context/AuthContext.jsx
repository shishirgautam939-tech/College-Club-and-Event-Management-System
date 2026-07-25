import { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api, { setOnAuthExpired } from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove(["token", "refreshToken"]);
    setUser(null);
  }, []);

  // Check if user is logged in when app starts
  useEffect(() => {
    const restoreSession = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            await AsyncStorage.multiRemove(["token", "refreshToken"]);
          } else {
            setUser({
              user_id: decoded.user_id,
              role: decoded.user_type,
              name: decoded.full_name,
            });
          }
        } catch {
          await AsyncStorage.multiRemove(["token", "refreshToken"]);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // Lets api/axios.js drop the session when a refresh token dies — mirrors
  // the web app's `window.location.href = "/login"`, but here it just
  // clears `user`; RootNavigator swaps to the Auth stack automatically.
  useEffect(() => {
    setOnAuthExpired(() => {
      clearSession();
    });
    return () => setOnAuthExpired(null);
  }, [clearSession]);

  const login = async (identifier, password) => {
    const trimmedIdentifier = typeof identifier === "string" ? identifier.trim() : "";

    try {
      const res = await api.post("login/", { email: trimmedIdentifier, password });
      const accessToken = res?.data?.access;
      if (!accessToken) {
        throw new Error("Login response did not include an access token.");
      }

      await AsyncStorage.setItem("token", accessToken);
      if (res.data.refresh) {
        await AsyncStorage.setItem("refreshToken", res.data.refresh);
      } else {
        await AsyncStorage.removeItem("refreshToken");
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
      await AsyncStorage.multiRemove(["token", "refreshToken"]);
      throw error;
    }
  };

  const logout = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
