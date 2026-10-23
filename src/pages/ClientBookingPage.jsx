import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, naira, toISODate, prettyDate } from '../lib/api';

const TIMES = [];
for (let h = 9; h < 18; h++) {
  const hh = String(h).padStart(2, '0');
  TIMES.push(hh + ':00', hh + ':30');
}

function nextDays(count) {
  const days = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function minutesOf(service) {
  return service.duration || service.duration_minutes || 0;
}

export default function ClientBookingPage() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const days = useMemo(() => nextDays(14), []);

  const [salon, setSalon] = useState(null);
  const [badLink, setBadLink] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState(toISODate(days[0]));
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Loads the salon's name and price list. Runs again whenever the link changes (#/book/1 -> #/book/2).
  const loadServices = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api('/services?salon_id=' + encodeURIComponent(salonId))
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setLoadError('We could not load the service list. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => {
    setSalon(null);
    setBadLink('');
    setServices([]);
    setServiceId(null);
    setTime('');
    api('/salons/' + encodeURIComponent(salonId))
      .then(setSalon)
      .catch((err) => { if (err.status === 404) setBadLink(err.message); });
    loadServices();
  }, [salonId, loadServices]);

  const service = services.find((s) => s.id === serviceId);
  const isToday = date === toISODate(new Date());
  const now = new Date();
  const nowHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const canBook = service && date && time && name.trim() && phone.trim();

  async function handleBook(e) {
    e.preventDefault();
    if (!canBook) return;
    setSubmitError('');
    setBusy(true);
    try {
      const data = await api('/bookings/create', {
        method: 'POST',
        body: {
          salon_id: salonId,
          service_id: service.id,
          booking_date: date,
          booking_time: time,
          client_name: name.trim(),
          client_phone: phone.trim(),
        },
      });
      const id = data.booking_id || data.id;
      navigate('/payment/' + id, { state: { service, date, time, name: name.trim() } });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sp-bookpage">
      <header className="sp-bookpage__head">
        <p className="sp-bookpage__brand">SalonPal</p>
        <h1 className="sp-bookpage__title">{salon ? 'Book at ' + salon.salon_name : 'Book your appointment'}</h1>
      </header>

      {badLink ? (
        <div className="sp-bookpage__bad" role="alert">
          <h2>This booking link does not work</h2>
          <p>{badLink}</p>
        </div>
      ) : (

      <form className="sp-bookpage__grid" onSubmit={handleBook}>
        <div className="sp-bookpage__steps">
          <section className="sp-step">
            <h2 className="sp-step__title"><span className="sp-step__num">1</span>Choose a service</h2>

            {loading && <p className="sp-muted">Loading the price list...</p>}
            {loadError && (
              <div className="sp-error" role="alert">
                {loadError}{' '}
                <button type="button" className="sp-linkbtn" onClick={loadServices}>Try again</button>
              </div>
            )}
            {!loading && !loadError && services.length === 0 && (
              <p className="sp-muted">This salon has not listed any services yet.</p>
            )}

            <ul className="sp-menu">
              {services.map((s) => (
                <li key={s.id}>
                  <button type="button"
                    className={'sp-menu__row' + (s.id === serviceId ? ' is-picked' : '')}
                    aria-pressed={s.id === serviceId}
                    onClick={() => setServiceId(s.id)}>
                    <span className="sp-menu__name">{s.name}</span>
                    <span className="sp-menu__dots" aria-hidden="true" />
                    <span className="sp-menu__price">{naira(s.price)}</span>
                    <span className="sp-menu__dur">{minutesOf(s)} mins</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="sp-step">
            <h2 className="sp-step__title"><span className="sp-step__num">2</span>Pick a day</h2>
            <div className="sp-days" role="list">
              {days.map((d) => {
                const iso = toISODate(d);
                return (
                  <button type="button" role="listitem" key={iso}
                    className={'sp-day' + (iso === date ? ' is-picked' : '')}
                    aria-pressed={iso === date}
                    onClick={() => { setDate(iso); setTime(''); }}>
                    <span className="sp-day__wk">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                    <span className="sp-day__num">{d.getDate()}</span>
                    <span className="sp-day__mo">{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sp-step">
            <h2 className="sp-step__title"><span className="sp-step__num">3</span>Pick a time</h2>
            <div className="sp-times">
              {TIMES.map((t) => {
                const past = isToday && t <= nowHHMM;
                return (
                  <button type="button" key={t} disabled={past}
                    className={'sp-time' + (t === time ? ' is-picked' : '')}
                    aria-pressed={t === time}
                    onClick={() => setTime(t)}>
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sp-step">
            <h2 className="sp-step__title"><span className="sp-step__num">4</span>Your details</h2>
            <div className="sp-details">
              <label className="sp-field">
                <span>Your name</span>
                <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="sp-field">
                <span>Phone number</span>
                <input required type="tel" autoComplete="tel" placeholder="0803 000 0000"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>
          </section>
        </div>

        <aside className="sp-summary" aria-live="polite">
          <h2 className="sp-summary__title">Your booking</h2>
          {service ? (
            <dl className="sp-summary__list">
              <div><dt>Service</dt><dd>{service.name}</dd></div>
              <div><dt>Day</dt><dd>{prettyDate(date)}</dd></div>
              <div><dt>Time</dt><dd>{time || 'Pick a time'}</dd></div>
              <div className="sp-summary__total"><dt>Total</dt><dd>{naira(service.price)}</dd></div>
            </dl>
          ) : (
            <p className="sp-summary__empty">Choose a service to see your total.</p>
          )}
          {submitError && <p className="sp-error" role="alert">{submitError}</p>}
          <button className="sp-btn sp-btn--honey" disabled={!canBook || busy}>
            {busy ? 'Booking...' : 'Book appointment'}
          </button>
        </aside>
      </form>
      )}
    </main>
  );
}