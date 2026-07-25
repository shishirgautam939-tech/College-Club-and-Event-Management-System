import api from "./axios";

export const loginUser = (identifier, password) =>
  api.post("login/", { email: identifier, password });

export const registerUser = (data) =>
  api.post("register/", data);

export const getUserProfile = () =>
  api.get("profile/");

export const refreshToken = (refresh) =>
  api.post("token/refresh/", { refresh });
