import api from "./axios";

// ── Student: register / unregister ──
export const registerForEvent = (eventId) =>
  api.post(`events/${eventId}/register/`);

export const unregisterFromEvent = (eventId) =>
  api.delete(`events/${eventId}/unregister/`);

// ── Student: my registrations ──
export const getMyRegistrations = () => api.get("my/registrations/");

// ── Student: my attendance ──
export const getMyAttendance = () => api.get("my/attendance/");

// ── Admin/Faculty: event participants ──
export const getEventParticipants = (eventId) =>
  api.get(`events/${eventId}/participants/`);

// ── Admin/Faculty: attendance management ──
export const getEventAttendance = (eventId) =>
  api.get(`events/${eventId}/attendance/`);

export const markAttendance = (eventId, attendanceData) =>
  api.post(`events/${eventId}/attendance/mark/`, {
    attendance: attendanceData,
  });

// ── QR Attendance ──
export const getEventQRAttendance = (eventId) =>
  api.get(`events/${eventId}/attendance/qr/`);

export const activateEventQR = (eventId, hoursValid = 6) =>
  api.post(`events/${eventId}/attendance/qr/`, { hours_valid: hoursValid });

export const deactivateEventQR = (eventId) =>
  api.delete(`events/${eventId}/attendance/qr/`);

export const verifyQRAttendance = (eventId, token) =>
  api.post("attendance/verify-qr/", { event_id: eventId, token });

// ── Certificates ──
export const getMyCertificates = () => api.get("my/certificates/");

export const getEventCertificates = (eventId) =>
  api.get(`events/${eventId}/certificates/`);

export const generateEventCertificates = (eventId) =>
  api.post(`events/${eventId}/certificates/`);

export const downloadMyEventCertificate = async (eventId) => {
  const response = await api.get(`events/${eventId}/certificate/download/`, {
    responseType: "blob",
  });
  return response;
};

export const downloadCertificate = async (certificateOrUrl) => {
  let url;
  if (typeof certificateOrUrl === "string") {
    // The API serializes download_url as a root-relative path
    // ("/api/certificates/download/<code>/"). Axios resolves that against
    // baseURL — which already ends in /api/ — producing /api/api/… and a
    // guaranteed 404, so strip any origin plus the duplicated /api/ prefix
    // and let baseURL supply them.
    url = certificateOrUrl
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\/?api\//, "")
      .replace(/^\//, "");
  } else {
    url = `certificates/${certificateOrUrl}/download/`;
  }
  const response = await api.get(url, {
    responseType: "blob",
  });
  return response;
};
