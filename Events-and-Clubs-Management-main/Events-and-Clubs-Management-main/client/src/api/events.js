import api from "./axios";

// ── Event proposal flow ──
export const proposeEvent = (data) => api.post("events/propose/", data);

export const getFacultyProposedEvents = () => api.get("events/review/");

export const reviewEvent = (id, data) =>
  api.post(`events/${id}/review/`, data);

export const getMyClubs = () => api.get("clubs/my/");

// ── Event discovery ──
export const getApprovedEvents = () => api.get("events/approved/");

// ── Admin: all events ──
export const getAllEvents = (statusFilter) => {
  const params = statusFilter ? { status: statusFilter } : {};
  return api.get("events/all/", { params });
};

// ── Complete an event ──
export const completeEvent = (id) => api.post(`events/${id}/complete/`);

