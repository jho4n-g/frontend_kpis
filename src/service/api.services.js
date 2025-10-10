import axios from 'axios';
import { Notifier } from '../ui/notifier';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const EXPIRY_SKEW_MS = 30_000;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error?.response?.data;
    const msg =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : undefined) ||
      error?.message ||
      'Error de red';
    // Notifica global (si el Provider ya está montado)
    Notifier.error(msg);
    return Promise.reject(error);
  }
);
