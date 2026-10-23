import React from 'react';
// HashRouter instead of BrowserRouter: GitHub Pages serves the app from
// /salonpal-frontend and 404s on refresh with BrowserRouter. Hash URLs fix both.
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authStore from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OwnerDashboard from './pages/OwnerDashboard';
import ClientBookingPage from './pages/ClientBookingPage';
import PaymentPage from './pages/PaymentPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './styles/salonpal.css';

function App() {
  const { token } = authStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/book/:salonId" element={<ClientBookingPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/dashboard" element={token ? <OwnerDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
