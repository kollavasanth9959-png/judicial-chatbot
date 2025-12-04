// central API helper with safe JSON parse and AbortController support
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function parseJsonSafe(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await res.json(); } catch { return {}; }
  }
  return {};
}

export async function request(path, { method = 'GET', token, body, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const message = payload.message || payload.error || res.statusText || 'API error';
    const err = new Error(message);
    err.status = res.status;
    err.info = payload;
    throw err;
  }

  // Normalize .data wrapping
  return payload.data ?? payload;
}



// ... keep the earlier code above unchanged

export const api = {
  login: (email, password, opts = {}) => request('/auth/login', { method: 'POST', body: { email, password }, ...opts }),
  register: (name, email, password, opts = {}) => request('/auth/register', { method: 'POST', body: { name, email, password }, ...opts }),
  me: (token, opts = {}) => request('/auth/me', { token, ...opts }),
  chatQuery: (message, sessionId, token, opts = {}) => request('/chat/query', { method: 'POST', token, body: { message, sessionId }, ...opts }),
  history: (token, opts = {}) => request('/chat/history', { token, ...opts }),
  sessionMessages: (sessionId, token, opts = {}) => request(`/chat/session/${sessionId}`, { token, ...opts }),
  deleteSession: (sessionId, token, opts = {}) => request(`/chat/session/${sessionId}`, { method: 'DELETE', token, ...opts }),

  // NEW: Update user role (PATCH). Backend must support this route.
  // Body: { role: 'standard'|'premium'|... }
  updateUserRole: (newRole, token, opts = {}) => request('/user/role', { method: 'PATCH', token, body: { role: newRole }, ...opts }),
};
