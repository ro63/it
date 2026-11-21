/**
 * Minimal fetch wrapper for the NIPCO Maintenance API.
 * The base URL comes from VITE_API_URL, otherwise the same origin is used
 * (in production the ASP.NET Core host already serves the built SPA).
 */
import { demoHandler } from './demo';

export const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/**
 * UI-only preview mode. Enabled by VITE_DEMO=1, which is set only in `.env.demo`
 * (loaded for `vite --mode demo` / `npm run dev:demo`). A normal production build
 * uses mode "production", does not load that file, and therefore never ships fixtures.
 */
const DEMO_MODE = import.meta.env.VITE_DEMO === '1';

const TOKEN_KEY = 'nipco_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.clone().json();
    if (body?.message) return String(body.message);
    if (body?.title) return String(body.title);
    if (body?.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length) return first[0];
    }
  } catch {
    /* non-json body */
  }
  return res.statusText || `خطای ارتباط با سرور (${res.status})`;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  if (DEMO_MODE) {
    const demoResult = demoHandler(path, method, options.body ? JSON.parse(String(options.body)) : undefined);
    if (demoResult !== undefined) return demoResult as T;
  }

  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('ارتباط با سرور برقرار نشد', 0);
  }

  if (res.status === 401) {
    setToken(null);
    throw new ApiError('نشست شما منقضی شده است، دوباره وارد شوید', 401);
  }

  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
