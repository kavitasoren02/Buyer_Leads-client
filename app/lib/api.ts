import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const excludedPaths = ["/auth/me", "/auth/login", "/auth/register", "/auth/demo-login"]
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      if(!excludedPaths.includes(error.config.url)){
        // window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),

  demoLogin: (role = "user") => api.post("/auth/demo-login", { role }),

  register: (email: string, password: string, role = "user") => api.post("/auth/register", { email, password, role }),

  getProfile: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return api.get("/auth/me", { headers })
  },
}

// Buyers API
export const buyersApi = {
  // Get buyers with filters and pagination
  getBuyers: (params: any = {}) => api.get("/buyers", { params }),

  // Get single buyer
  getBuyer: (id: string) => api.get(`/buyers/${id}`),

  // Create buyer
  createBuyer: (data: any) => api.post("/buyers", data),

  // Update buyer
  updateBuyer: (id: string, data: any) => api.put(`/buyers/${id}`, data),

  // Delete buyer
  deleteBuyer: (id: string) => api.delete(`/buyers/${id}`),

  // Import CSV
  importCSV: (file: File) => {
    const formData = new FormData()
    formData.append("csvFile", file)
    return api.post("/buyers/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  // Export CSV
  exportCSV: (params: any = {}) =>
    api.get("/buyers/export", {
      params,
      responseType: "blob",
    }),
}

export default api
