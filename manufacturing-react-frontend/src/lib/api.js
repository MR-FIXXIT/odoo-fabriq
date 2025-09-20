import axios from 'axios'

// In development, prefer a relative base URL so Vite proxy can avoid CORS.
// You can override with VITE_API_BASE for production/staging, e.g. "https://api.example.com".
const baseURL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : '/'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let pendingQueue = []

function flushQueue(error, token = null) {
  pendingQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config || {}
    const status = error?.response?.status

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // Queue up until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true
      try {
        // Refresh endpoint should read refresh token from HttpOnly cookie
        await api.post('/account/token/refresh/', {})
        flushQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        flushQueue(refreshErr)
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api