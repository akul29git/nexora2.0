import type { SensorDataResponse, HealthResponse } from '../types/sensor';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      `Request failed: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  getSensorData: () =>
    fetchJson<SensorDataResponse>(`${API_BASE}/sensors`),

  getHealth: () =>
    fetchJson<HealthResponse>(`${API_BASE}/health`),

  postSensorData: (payload: unknown, apiKey: string) =>
    fetchJson<{ message: string; status: 'ok' }>(`${API_BASE}/sensors`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
export type { ApiError as ApiErrorType };