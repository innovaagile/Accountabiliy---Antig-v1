
let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
if (BASE_URL && !BASE_URL.endsWith('/api')) {
  BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
}


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers});

  return response;
};
