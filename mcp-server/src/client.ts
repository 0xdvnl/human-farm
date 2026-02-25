// HTTP client for the Human.Farm API

const BASE_URL = process.env.HUMANFARM_API_URL || 'https://www.humanfarm.ai/api';
const API_KEY = process.env.HUMANFARM_API_KEY || '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  apiKey?: string;
  humanToken?: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, apiKey, humanToken } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agent auth: X-API-Key header
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  } else if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  // Human auth: Bearer token
  if (humanToken) {
    headers['Authorization'] = `Bearer ${humanToken}`;
    delete headers['X-API-Key'];
  }

  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json() as { success: boolean; data?: T; error?: string };

  if (!json.success) {
    throw new Error(json.error || `API error: ${response.status}`);
  }

  return json.data as T;
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
