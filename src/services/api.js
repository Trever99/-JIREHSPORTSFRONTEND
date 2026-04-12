// src/services/api.js
// API service for backend communication

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  getToken() {
    return localStorage.getItem("authToken");
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================
  
  async login(username, password) {
    const data = await this.request("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    this.clearToken();
  }

  // ============================================================
  // PLAYERS ENDPOINTS
  // ============================================================

  async getPlayers() {
    return this.request("/players", { method: "GET" });
  }

  async getPlayer(id) {
    return this.request(`/players/${id}`, { method: "GET" });
  }

  async createPlayer(playerData) {
    return this.request("/players", {
      method: "POST",
      body: JSON.stringify(playerData),
    });
  }

  async updatePlayer(id, playerData) {
    return this.request(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(playerData),
    });
  }

  async deletePlayer(id) {
    return this.request(`/players/${id}`, { method: "DELETE" });
  }

  // ============================================================
  // ASSESSMENTS ENDPOINTS (if available)
  // ============================================================

  async getAssessments() {
    return this.request("/assessments", { method: "GET" });
  }

  async createAssessment(assessmentData) {
    return this.request("/assessments", {
      method: "POST",
      body: JSON.stringify(assessmentData),
    });
  }
}

export default new ApiService();
