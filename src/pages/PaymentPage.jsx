import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const response = await axios.post(
        \\/payment/initialize\,
        {
          booking_id: bookingId,
          email: 'client@example.com',
          amount: 5000,
        }
      );
      setBooking(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize payment');
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Processing...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Payment</h1>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
        <p className="text-gray-600 mb-4">Deposit Amount: ₦5,000</p>
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
          Pay with Paystack
        </button>
      </div>
    </div>
  );
}
