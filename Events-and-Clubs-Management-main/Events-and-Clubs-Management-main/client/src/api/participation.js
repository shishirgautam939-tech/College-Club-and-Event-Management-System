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
