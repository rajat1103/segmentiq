import axios from "axios";


/* ═══════════════════════════════════════════════════════
   SEGMENTIQ CRM — Axios API Client
   Base URL reads from Vite env var for multi-cloud deploy:
   - Local dev:   VITE_API_URL = http://127.0.0.1:8000
   - Production:  VITE_API_URL = https://your-render-app.onrender.com
   ═══════════════════════════════════════════════════════ */

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Request Interceptor: Inject JWT Bearer Token ───── */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor: Handle 401 Unauthorized ──── */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ═══════════════════════════════════════════════════════
   AUTHENTICATION
   ═══════════════════════════════════════════════════════ */

export const login = (payload) =>
  API.post("/auth/login", payload);

export const signup = (payload) =>
  API.post("/auth/signup", payload);

/* ═══════════════════════════════════════════════════════
   DASHBOARD METRICS
   ═══════════════════════════════════════════════════════ */

export const getStats = () => API.get("/dashboard/stats");

export const getCityDistribution = () => API.get("/dashboard/city-distribution");

export const getRevenueByCity = () => API.get("/dashboard/revenue-by-city");

export const getGenderDistribution = () => API.get("/dashboard/gender-distribution");

/* ═══════════════════════════════════════════════════════
   CUSTOMERS
   ═══════════════════════════════════════════════════════ */

export const getCustomers = (params) => API.get("/customers/", { params });

export const getCustomer = (id) => API.get(`/customers/${id}`);

export const createCustomer = (payload) => API.post("/customers/", payload);

export const updateCustomer = (id, payload) => API.put(`/customers/${id}`, payload);

export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

export const getCustomerStats = () => API.get("/customers/stats/overview");

/* ═══════════════════════════════════════════════════════
   CAMPAIGNS
   ═══════════════════════════════════════════════════════ */

export const getCampaigns = (params) => API.get("/campaigns/", { params });

export const getCampaign = (id) => API.get(`/campaigns/${id}`);

export const createCampaign = (payload) => API.post("/campaigns/", payload);

export const updateCampaign = (id, payload) => API.put(`/campaigns/${id}`, payload);

export const deleteCampaign = (id) => API.delete(`/campaigns/${id}`);

export const previewSegment = (payload) => API.post("/campaigns/preview", payload);

export const getCampaignHistory = () => API.get("/campaigns/history");

export const launchCampaign = (campaignId) => API.post(`/campaigns/${campaignId}/launch`);

export const getCampaignStats = (campaignId) => API.get(`/campaigns/${campaignId}/stats`);

/* ═══════════════════════════════════════════════════════
   COMMUNICATION LOGS
   ═══════════════════════════════════════════════════════ */

export const getCommunicationLogs = (params) => API.get("/communication-logs/", { params });

export const createCommunicationLog = (payload) => API.post("/communication-logs/", payload);

/* ═══════════════════════════════════════════════════════
   SEED / ONBOARDING
   ═══════════════════════════════════════════════════════ */

/**
 * Seed the backend database with demo data for new users.
 * Returns summary: { customers_created, orders_created, campaigns_created, total_revenue }
 */
export const seedDatabase = () => API.post("/seed");

/**
 * Reset all data in the backend database.
 * Use with caution — deletes all customers, orders, campaigns, logs.
 */
export const resetDatabase = () => API.delete("/seed/reset");

export default API;