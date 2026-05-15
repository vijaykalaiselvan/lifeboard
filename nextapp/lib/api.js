"use client";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const profileId = localStorage.getItem("profileId");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (profileId) config.headers["x-profile-id"] = profileId;
  return config;
});

export default api;
