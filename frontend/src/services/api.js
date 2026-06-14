import axios from "axios";


/* ═══════════════════════════════════════════════════════
   SEGMENTIQ CRM — Axios API Client
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

export const getMonthlyRevenue = () => API.get("/dashboard/monthly-revenue");

/* ═══════════════════════════════════════════════════════
   CUSTOMERS
   ═══════════════════════════════════════════════════════ */

export const getCustomers = (params) => API.get("/customers/", { params });

export const getCustomer = (id) => API.get(`/customers/${id}`);

export const createCustomer = (payload) => API.post("/customers/", payload);

export const importCustomersBulk = (payload) => API.post("/customers/bulk", payload);

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

export const seedDatabase = () => API.post("/seed");

export const resetDatabase = () => API.delete("/seed/reset");

/* ═══════════════════════════════════════════════════════
   PHASE 3: GROQ AI ENDPOINTS
   ═══════════════════════════════════════════════════════ */

/**
 * Main AI chat — sends message history, receives Groq response.
 * @param {Array} messages - [{role: "user"|"assistant", content: string}]
 */
export const aiChat = (messages, model = "llama-3.3-70b-versatile") =>
  API.post("/ai/chat", { messages, model });

/**
 * Convert natural language to CRM segment query.
 * @param {string} description - "High spenders in Mumbai"
 */
export const aiGenerateSegment = (description) =>
  API.post("/ai/generate-segment", { description });

/**
 * Generate 3 campaign message variants for a segment.
 */
export const aiGenerateMessage = (payload) =>
  API.post("/ai/generate-message", payload);

/* ═══════════════════════════════════════════════════════
   PHASE 4: CHANNEL SERVICE ENDPOINTS
   ═══════════════════════════════════════════════════════ */

/** Get delivery status breakdown across all campaigns */
export const getChannelStats = () => API.get("/channel/stats");

export default API;