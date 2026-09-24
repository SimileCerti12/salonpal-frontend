import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authStore from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OwnerDashboard from './pages/OwnerDashboard';
import ClientBookingPage from './pages/ClientBookingPage';
import PaymentPage from './pages/PaymentPage';

function App() {
  const { token } = authStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/book/:salonId" element={<ClientBookingPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        
        <Route
          path="/dashboard"
          element={token ? <OwnerDashboard /> : <Navigate to="/login" />}
        />
        
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
