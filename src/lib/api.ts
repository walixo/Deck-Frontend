import axios, { AxiosError } from 'axios';
import type { FieldError } from '@/types';

export const TOKEN_STORAGE_KEY = 'deck-token';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* Private browsing — the session simply will not persist. */
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface ApiErrorBody {
  success: false;
  error: { message: string; details?: FieldError[] };
}

/** A request failure with the server's message and per-field details preserved. */
export class RequestError extends Error {
  readonly status: number;
  readonly fields: FieldError[];

  constructor(message: string, status: number, fields: FieldError[] = []) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.fields = fields;
  }

  fieldError(field: string): string | undefined {
    return this.fields.find((entry) => entry.field === field)?.message;
  }
}

function toRequestError(error: unknown): RequestError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error) {
      return new RequestError(body.error.message, error.response?.status ?? 0, body.error.details);
    }
    if (error.code === 'ERR_NETWORK') {
      return new RequestError('Cannot reach the Deck API. Is the server running?', 0);
    }
    return new RequestError(error.message, error.response?.status ?? 0);
  }
  return new RequestError('Something unexpected went wrong', 0);
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

/** Unwraps the API's { success, data } envelope and normalises errors. */
export async function request<T>(
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  payload?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  try {
    const response = await api.request<Envelope<T>>({ method, url, data: payload, params });
    return response.data.data;
  } catch (error) {
    throw toRequestError(error);
  }
}

/** Same as `request`, but keeps the `meta` block (pagination, leaderboard dates). */
export async function requestWithMeta<T, M>(
  url: string,
  params?: Record<string, unknown>,
): Promise<{ data: T; meta: M }> {
  try {
    const response = await api.get<Envelope<T> & { meta: M }>(url, { params });
    return { data: response.data.data, meta: response.data.meta };
  } catch (error) {
    throw toRequestError(error);
  }
}
