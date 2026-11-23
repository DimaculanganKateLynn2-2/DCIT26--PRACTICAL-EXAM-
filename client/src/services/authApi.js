import { apiRequest, setCsrfToken } from './api';

export async function getCurrentUser(signal) {
  const data = await apiRequest('/api/auth/me', { signal });
  setCsrfToken(data.csrfToken);
  return data.user;
}
export async function registerAccount(details) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST', body: JSON.stringify(details),
  });
  setCsrfToken(data.csrfToken);
  return data.user;
}
export async function loginAccount(credentials) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST', body: JSON.stringify(credentials),
  });
  setCsrfToken(data.csrfToken);
  return data.user;
}
export async function logoutAccount() {
  await apiRequest('/api/auth/logout', { method: 'POST' });
  setCsrfToken(null);
}
