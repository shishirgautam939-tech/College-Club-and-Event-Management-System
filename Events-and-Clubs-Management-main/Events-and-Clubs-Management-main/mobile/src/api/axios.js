import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./config";

// 1. Create a central instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // Phones drop on and off networks constantly; without a timeout a dead
  // connection leaves every screen stuck on its spinner forever. 20s also
  // covers Render's free-tier cold starts (~10-15s) on the deployed API.
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// The web app redirects with `window.location.href = "/login"` on a dead
// refresh token — there's no such global on native. AuthContext registers a
// handler here instead, so losing the session clears `user` and the
// navigator (which renders the Auth stack whenever `user` is null) takes
// care of the redirect.
let onAuthExpired = null;
export const setOnAuthExpired = (handler) => {
  onAuthExpired = handler;
};

// 2. Interceptor: Automatically add the Token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 3. Interceptor: Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");
    const isAuthRequest =
      requestUrl.includes("login/") || requestUrl.includes("token/refresh/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}token/refresh/`,
            { refresh: refreshToken },
          );
          await AsyncStorage.setItem("token", res.data.access);
          if (res.data.refresh) {
            await AsyncStorage.setItem("refreshToken", res.data.refresh);
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          await AsyncStorage.multiRemove(["token", "refreshToken"]);
          onAuthExpired?.();
        }
      } else {
        await AsyncStorage.removeItem("token");
        onAuthExpired?.();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
