import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { encode as encodeBase64 } from "base64-arraybuffer";
import { API_BASE_URL } from "../api/config";

// Web saves a Blob straight to the browser's downloads folder. There's no
// such destination on a phone — the closest equivalent is writing to the
// app's document directory, then handing it to the OS share sheet so the
// user can save it to Files/Drive/etc. or send it on.
//
// Uses the classic expo-file-system API (writeAsStringAsync/documentDirectory).
// As of SDK 54 / expo-file-system v19 the package root exports the new
// File/Paths class API only — the classic functions live under the
// "expo-file-system/legacy" subpath; importing them from the root leaves
// every call undefined and the download fails.

const shareFile = async (fileUri, mimeType, filename) => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: filename });
  }
  return fileUri;
};

// For data the app already holds in memory (base64 QR images).
export const saveArrayBufferAsFile = async (arrayBuffer, filename, mimeType) => {
  const base64 = encodeBase64(arrayBuffer);
  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return shareFile(fileUri, mimeType, filename);
};

// downloadAsync bypasses the axios instance and its 401-refresh interceptor
// (see src/api/axios.js), so an expired access token has to be refreshed
// here too or downloads would start failing an hour after login.
const freshAccessToken = async () => {
  const refresh = await AsyncStorage.getItem("refreshToken");
  if (!refresh) return null;
  const res = await axios.post(`${API_BASE_URL}token/refresh/`, { refresh });
  await AsyncStorage.setItem("token", res.data.access);
  if (res.data.refresh) {
    await AsyncStorage.setItem("refreshToken", res.data.refresh);
  }
  return res.data.access;
};

// Server files (certificate PDFs) skip axios entirely: RN's XHR delivers
// binary bodies over a base64 bridge that then gets re-encoded to base64
// anyway, and any hiccup in that chain corrupts the file. downloadAsync
// streams the response straight to disk natively — JS never touches the
// bytes.
export const downloadApiFileToDevice = async (apiPath, filename, mimeType) => {
  // Accept absolute URLs and root-relative "/api/…" paths alike (the
  // serializer's download_url is root-relative) and resolve against
  // API_BASE_URL, which already ends in /api/.
  const relative = String(apiPath)
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/?api\//, "")
    .replace(/^\//, "");
  const url = API_BASE_URL + relative;
  const fileUri = FileSystem.documentDirectory + filename;

  let token = await AsyncStorage.getItem("token");
  const download = (auth) =>
    FileSystem.downloadAsync(url, fileUri, {
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });

  let result = await download(token);
  if (result.status === 401) {
    token = await freshAccessToken();
    if (token) result = await download(token);
  }

  if (result.status !== 200) {
    // downloadAsync writes error bodies to disk too — don't leave a broken
    // "certificate.pdf" behind.
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    throw new Error(`server responded with HTTP ${result.status}`);
  }

  return shareFile(fileUri, mimeType, filename);
};
