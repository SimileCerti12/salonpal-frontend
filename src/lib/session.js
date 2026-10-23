import authStore from '../store/authStore';

// Works with your existing authStore: uses its login/logout (which save to
// localStorage, so a refresh keeps you signed in) when they exist.
export function saveSession(data) {
  const store = authStore.getState();
  if (typeof store.login === 'function') {
    store.login(data.token, data.salon_id, data.salon_name || '', data.email || '');
  } else {
    authStore.setState({ token: data.token, salonId: data.salon_id, salonName: data.salon_name });
  }
}

export function clearSession() {
  const store = authStore.getState();
  if (typeof store.logout === 'function') store.logout();
  ['token', 'salonId', 'salonName', 'email'].forEach(function (k) { localStorage.removeItem(k); });
  authStore.setState({ token: null, salonId: null, salonName: null });
}
