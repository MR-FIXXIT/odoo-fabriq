import axios from 'axios'

// In development, prefer a relative base URL so Vite proxy can avoid CORS.
const baseURL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : '/'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Ensure Authorization header is set from localStorage before each request
api.interceptors.request.use((config) => {
  try {
    const access = localStorage.getItem('access')
    if (access) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${access}`
    } else {
      if (config.headers) delete config.headers['Authorization']
    }
  } catch (e) {
    // ignore
  }
  return config
}, (err) => Promise.reject(err))

export default api