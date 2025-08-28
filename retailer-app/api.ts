export const API_BASE_URL = 'http://192.168.1.183:4000/api';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invalid credentials');
  return data;
}

export async function createUser(email: string, password: string, isAdmin: boolean) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, isAdmin }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create user');
  return data;
}
