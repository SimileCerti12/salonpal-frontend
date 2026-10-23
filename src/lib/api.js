// All requests to the SalonPal backend go through here.
// Plain string concatenation (no template literals) so the file survives
// being written from PowerShell if you ever do that again.

// Local backend for now. When you host the backend, set REACT_APP_API_URL
// in a .env file (e.g. REACT_APP_API_URL=https://your-backend.com/api) and rebuild.
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// While developing (npm start), every request is printed in the browser console (F12).
const DEBUG = process.env.NODE_ENV === 'development';

export async function api(path, options) {
  const opts = options || {};
  const started = Date.now();
  const headers = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = 'Bearer ' + opts.token;

  const res = await fetch(API_URL + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(function () { return {}; });
  if (DEBUG) {
    console.log('[SalonPal API] ' + (opts.method || 'GET') + ' ' + API_URL + path + ' -> ' + res.status +
      ' (' + (Date.now() - started) + 'ms)', data);
  }
  if (!res.ok) {
    const error = new Error(data.error || data.message || 'Request failed (' + res.status + ')');
    error.status = res.status;
    throw error;
  }
  return data;
}

export function naira(amount) {
  return '\u20A6' + Number(amount || 0).toLocaleString('en-NG');
}

export function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}