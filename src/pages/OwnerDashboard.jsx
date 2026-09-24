import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authStore from '../store/authStore';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { token, salonId, salonName, logout } = authStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) navigate('/login');
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        axios.get(\\/services/\\),
        axios.get(\\/bookings\, {
          headers: { Authorization: \Bearer \\ },
        }),
      ]);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        \\/services\,
        newService,
        { headers: { Authorization: \Bearer \\ } }
      );
      setNewService({ name: '', price: '', duration: '' });
      fetchData();
    } catch (err) {
      setError('Failed to add service');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyBookingLink = () => {
    const link = \\/book/\\;
    navigator.clipboard.writeText(link);
    alert('Booking link copied to clipboard!');
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">SalonPal - {salonName}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        <div className="flex gap-2 mb-6 border-b">
          {['overview', 'bookings', 'services', 'staff', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={\px-4 py-2 font-bold capitalize \\}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm">Total Bookings</h3>
              <p className="text-3xl font-bold">{bookings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm">Services</h3>
              <p className="text-3xl font-bold">{services.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm">Pending Bookings</h3>
              <p className="text-3xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="col-span-full bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-2">Your Booking Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={\\/book/\\}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={copyBookingLink}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Service</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t">
                    <td className="px-6 py-3">{booking.client_name}</td>
                    <td className="px-6 py-3">{booking.service_name}</td>
                    <td className="px-6 py-3">{booking.booking_date}</td>
                    <td className="px-6 py-3">{booking.booking_time}</td>
                    <td className="px-6 py-3">
                      <span className={\px-3 py-1 rounded text-sm \\}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Add New Service</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <input
                  type="text"
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Add Service
                </button>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Your Services</h3>
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-bold">{service.name}</h4>
                    <p className="text-gray-600">₦{service.price} · {service.duration} min</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Staff Management</h3>
            <p className="text-gray-600">Staff management coming soon</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Settings</h3>
            <p className="text-gray-600">Salon: {salonName}</p>
          </div>
        )}
      </div>
    </div>
  );
}
