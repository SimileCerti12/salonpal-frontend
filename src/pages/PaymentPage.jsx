import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api, naira, prettyDate } from '../lib/api';

function ScreenshotNote() {
  return (
    <p className="sp-receipt__shot">
      <strong>Please take a screenshot of this receipt</strong> and show it at the salon.
    </p>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const fromBooking = location.state || {};

  // Start with what the booking page passed, then load the real record from the server.
  const [booking, setBooking] = useState(
    fromBooking.service
      ? {
          client_name: fromBooking.name, service_name: fromBooking.service.name, price: fromBooking.service.price,
          duration: fromBooking.service.duration || fromBooking.service.duration_minutes,
          booking_date: fromBooking.date, booking_time: fromBooking.time, payment_status: 'unpaid',
        }
      : null
  );
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const reference = new URLSearchParams(location.search).get('reference');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (reference) {
          setChecking(true);
          const result = await api('/payment/verify/' + encodeURIComponent(reference));
          if (!result.paid && !cancelled) setError('Payment was not completed. Try again, or pay at the salon.');
        }
        const fresh = await api('/bookings/' + bookingId + '/receipt');
        if (!cancelled) setBooking(fresh);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [bookingId, reference]);

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/payment/initialize', { method: 'POST', body: { booking_id: bookingId, email } });
      const url = data.authorization_url || (data.data && data.data.authorization_url);
      if (!url) throw new Error('Payment could not start. Try again, or choose to pay at the salon.');
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function payAtSalon() {
    setError('');
    setBusy(true);
    try {
      const result = await api('/bookings/' + bookingId + '/pay-at-salon', { method: 'POST' });
      setBooking((b) => Object.assign({}, b, { payment_status: result.payment_status }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  const status = booking ? booking.payment_status : 'unpaid';

  return (
    <main className="sp-pay">
      <div className="sp-receipt">
        <header className="sp-receipt__head">
          <p className="sp-receipt__brand">SalonPal</p>
          <p>Booking no. {bookingId}</p>
        </header>

        {booking && (
          <dl className="sp-receipt__rows">
            {booking.client_name && <div><dt>Client</dt><dd>{booking.client_name}</dd></div>}
            {booking.service_name && <div><dt>Service</dt><dd>{booking.service_name}</dd></div>}
            {booking.booking_date && <div><dt>Day</dt><dd>{prettyDate(booking.booking_date)}</dd></div>}
            {booking.booking_time && <div><dt>Time</dt><dd>{booking.booking_time}</dd></div>}
            {booking.duration && <div><dt>Duration</dt><dd>{booking.duration} mins</dd></div>}
          </dl>
        )}

        {booking && booking.price != null && (
          <div className="sp-receipt__total">
            <span>{status === 'paid' ? 'Paid' : 'Total'}</span>
            <span>{naira(booking.price)}</span>
          </div>
        )}

        {checking ? (
          <p className="sp-receipt__done" role="status">Confirming your payment...</p>
        ) : status === 'paid' ? (
          <div className="sp-receipt__done" role="status">
            <p className="sp-receipt__stamp sp-receipt__stamp--paid">Paid</p>
            <p>Payment received. See you at the salon.</p>
            <ScreenshotNote />
          </div>
        ) : status === 'pay_at_salon' ? (
          <div className="sp-receipt__done" role="status">
            <p className="sp-receipt__stamp">Booked</p>
            <p>Your slot is held. Pay at the salon when you arrive.</p>
            <ScreenshotNote />
          </div>
        ) : (
          <form onSubmit={handlePay} className="sp-receipt__form">
            <label className="sp-field sp-field--receipt">
              <span>Email for your receipt</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="sp-error" role="alert">{error}</p>}
            <button className="sp-btn sp-btn--ink" disabled={busy}>{busy ? 'Please wait...' : 'Pay now with Paystack'}</button>
            <button type="button" className="sp-linkbtn sp-receipt__later" disabled={busy} onClick={payAtSalon}>
              I will pay at the salon
            </button>
          </form>
        )}
        {error && status !== 'unpaid' && <p className="sp-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}