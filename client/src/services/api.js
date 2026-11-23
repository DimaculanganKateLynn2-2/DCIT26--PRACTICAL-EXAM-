let csrfToken = null;

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5000')
).replace(/\/$/, '');

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export async function apiRequest(path, options = {}) {
  const { asBlob = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const headers = { ...(fetchOptions.headers || {}) };
  if (!['GET', 'HEAD'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions, method, headers, credentials: 'include',
  });
  if (asBlob && response.ok) return response.blob();
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
