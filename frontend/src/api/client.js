import axios from "axios";
import { authStorage } from "../utils/authStorage";

const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8099/api").trim(),
  timeout: 12000
});

client.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getError = (error) => error?.response?.data?.error || Object.values(error?.response?.data || {})[0] || error.message || "Something went wrong";
export default client;
