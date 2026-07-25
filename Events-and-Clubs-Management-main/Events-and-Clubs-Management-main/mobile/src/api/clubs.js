import api from "./axios";

export const getClubs = () => api.get("clubs/");

export const createClub = (data) => api.post("clubs/", data);

export const updateClub = (id, data) => api.patch(`clubs/${id}/`, data);

export const deleteClub = (id) => api.delete(`clubs/${id}/`);

export const getClubMembers = (id) => api.get(`clubs/${id}/members/`);

export const addClubMember = (clubId, data) =>
  api.post(`clubs/${clubId}/members/add/`, data);

export const removeClubMember = (clubId, memberId) =>
  api.delete(`clubs/${clubId}/members/${memberId}/remove/`);
