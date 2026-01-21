/**
 * API Client for KR8TIV Launchpad
 * Handles all HTTP requests with error handling, retries, and caching
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
}

interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string, cacheTime: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithTimeout(
  url: string,
  config: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  config: RequestInit,
  retries: number,
  retryDelay: number,
  timeout: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, config, timeout);

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && i < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

export async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    cache: useCache = false,
    cacheTime = 60000, // 1 minute default
    ...fetchConfig
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${fetchConfig.method || 'GET'}:${url}`;

  // Check cache for GET requests
  if (useCache && (!fetchConfig.method || fetchConfig.method === 'GET')) {
    const cached = getCached<T>(cacheKey, cacheTime);
    if (cached !== null) {
      return { data: cached, error: null, status: 200 };
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchConfig.headers,
  };

  try {
    const response = await fetchWithRetry(
      url,
      { ...fetchConfig, headers },
      retries,
      retryDelay,
      timeout
    );

    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    if (!response.ok) {
      const errorMessage =
        (data as { message?: string })?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    // Cache successful GET responses
    if (useCache && (!fetchConfig.method || fetchConfig.method === 'GET')) {
      setCache(cacheKey, data);
    }

    return { data, error: null, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: null as T, error: error.message, status: error.status };
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { data: null as T, error: 'Request timed out', status: 408 };
    }
    return {
      data: null as T,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

// Clear cache
export function clearApiCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

export default api;
