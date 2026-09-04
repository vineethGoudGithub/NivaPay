const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6060/api';

function getUserId() {
  return localStorage.getItem('userId');
}

function setUserId(id) {
  localStorage.setItem('userId', id);
}

function removeUserId() {
  localStorage.removeItem('userId');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Cannot reach backend on ${API_BASE}`);
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(res.ok ? 'Invalid response from backend' : `Backend error (${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export const api = {
  signup: (name, email, password) =>
    request('POST', '/auth/signup', { name, email, password }),

  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),

  getWallet: (userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('GET', `/wallet?userId=${id}`);
  },

  sendMoney: (recipientEmail, amount, userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('POST', `/wallet/send?userId=${id}`, { recipientEmail, amount });
  },

  getProfile: (userId) => {
    const id = userId !== undefined && userId !== null ? userId : getUserId();
    return request('GET', `/user/profile?userId=${id}`);
  },

  setUserId,
  getUserId,
  removeUserId,
};
