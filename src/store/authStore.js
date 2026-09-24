import { create } from 'zustand';

const authStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  salonId: localStorage.getItem('salonId') || null,
  salonName: localStorage.getItem('salonName') || null,
  email: localStorage.getItem('email') || null,

  login: (token, salonId, salonName, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('salonId', salonId);
    localStorage.setItem('salonName', salonName);
    localStorage.setItem('email', email);
    set({ token, salonId, salonName, email });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('salonId');
    localStorage.removeItem('salonName');
    localStorage.removeItem('email');
    set({ token: null, salonId: null, salonName: null, email: null });
  },
}));

export default authStore;
