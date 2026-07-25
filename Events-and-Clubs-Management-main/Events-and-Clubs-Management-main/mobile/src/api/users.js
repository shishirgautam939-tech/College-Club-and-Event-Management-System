import api from "./axios";

export const getAllUsers = () => api.get("users/");

export const createUser = (data) => api.post("users/", data);

export const updateUser = (id, data) => api.patch(`users/${id}/`, data);

export const deleteUser = (id) => api.delete(`users/${id}/`);

export const getDashboardStats = () => api.get("dashboard/stats/");

export const getDepartments = () => api.get("departments/");
