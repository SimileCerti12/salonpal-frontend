import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ClientBookingPage() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        \\/services/\\
      );
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load services');
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateTimeSubmit = () => {
    if (bookingDate && bookingTime) {
      setStep(3);
    } else {
      setError('Please select date and time');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        \\/bookings/create\,
        {
          salon_id: salonId,
          service_id: selectedService.id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          booking_date: bookingDate,
          booking_time: bookingTime,
        }
      );
      navigate(\/payment/\\);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Book Your Appointment</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Service</h2>
            <div className="grid gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer text-left"
                >
                  <h3 className="text-xl font-bold">{service.name}</h3>
                  <p className="text-gray-600">₦{service.price}</p>
                  <p className="text-gray-500">{service.duration} minutes</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Date & Time</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                min={new Date().toISOString().split('T')[0]}
              />
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <button
                onClick={handleDateTimeSubmit}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Details</h2>
            <form onSubmit={handleBookingSubmit} className="bg-white p-6 rounded-lg shadow">
              <input
                type="text"
                placeholder="Full Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
