import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      try {
        // ✅ Use full URL — not relative — so it hits the backend, not the frontend
        await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
        return api(err.config)
      } catch {
        // Refresh failed — redirect to login without calling logout
        // (no need to blocklist an already-expired token)
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api