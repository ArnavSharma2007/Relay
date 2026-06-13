import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { installMockAdapter } from './mockApi';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Install mock adapter — intercepts known routes and returns demo data
// when the real server is unreachable (no DB / not deployed yet).
if (import.meta.env.DEV && (import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_URL)) {
  console.log('RELAY: Using Mock API Adapter');
  installMockAdapter(api);
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getAssetUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
    : '';
  return `${baseUrl}${url}`;
}

export default api;
