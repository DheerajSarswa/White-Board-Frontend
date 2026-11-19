import axios from "axios";

import { BACKEND_URL } from "./config";

const API_BASE_URL = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// USER API CALLS
export const registerUser = async (name, email, password) => {
  try {
    const response = await apiClient.post("/users/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post("/users/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// CANVAS API CALLS
export const getAllCanvases = async () => {
  try {
    const response = await apiClient.get("/canvases");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createCanvas = async (name = "Untitled Canvas", elements = []) => {
  try {
    const response = await apiClient.post("/canvases", {
      name,
      elements,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const loadCanvas = async (id) => {
  try {
    const response = await apiClient.get(`/canvases/load/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateCanvas = async (id, elements) => {
  try {
    const response = await apiClient.put(`/canvases/${id}`, {
      elements,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteCanvas = async (id) => {
  try {
    const response = await apiClient.delete(`/canvases/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const shareCanvas = async (id, sharedWithEmail) => {
  try {
    const response = await apiClient.put(`/canvases/share/${id}`, {
      sharedWithEmail,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
