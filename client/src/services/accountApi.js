import { apiRequest } from './api';

export async function saveAccountName(name) {
  return apiRequest('/api/account/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
}

export async function updateAccountPassword(currentPassword, newPassword) {
  return apiRequest('/api/account/password', {
    method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function permanentlyDeleteAccount(currentPassword, confirmation) {
  return apiRequest('/api/account/me', {
    method: 'DELETE', body: JSON.stringify({ currentPassword, confirmation }),
  });
}
