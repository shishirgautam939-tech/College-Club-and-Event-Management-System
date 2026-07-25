import { Platform } from "react-native";

// Deployed backend (see render.yaml at the repo root).
const PROD_API_URL = "https://ccems-api.onrender.com/api/";

// Sensible per-platform defaults for hitting `manage.py runserver` on your
// dev machine. Override with EXPO_PUBLIC_API_URL in mobile/.env when testing
// on a physical device — it can't reach 127.0.0.1 or 10.0.2.2, it needs your
// machine's LAN IP (e.g. http://192.168.1.23:8000/api/).
function devDefaultApiUrl() {
  if (Platform.OS === "android") {
    // Special alias the Android emulator maps to the host's localhost.
    return "http://10.0.2.2:8000/api/";
  }
  // iOS simulator shares the host's network namespace, so localhost works.
  return "http://127.0.0.1:8000/api/";
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? devDefaultApiUrl() : PROD_API_URL);
