import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authStore from '../store/authStore';
import { api, API_URL, naira, toISODate, prettyDate } from '../lib/api';
import { clearSession } from '../lib/session';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const POLL_MS = 15000;

const PAYMENT_LABEL = { unpaid: 'Not paid', pay_at_salon: 'Pays at salon', paid: 'Paid' };
const STATUS_LABEL = { booked: 'Booked', confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled', no_show: 'No-show' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeOf(b) { return String(b.booking_time || '').slice(0, 5); }
function dateOf(b) { return String(b.booking_date || '').slice(0, 10); }
function isActive(b) { return b.status !== 'cancelled' && b.status !== 'no_show'; }

// ---------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------
function Toasts({ items, onClose }) {
  return (
    <div className="sp-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={'sp-toast sp-toast--' + t.kind} role="status">
          <div>
            <p className="sp-toast__title">{t.title}</p>
            <p className="sp-toast__body">{t.body}</p>
          </div>
          <button className="sp-toast__close" aria-label="Dismiss" onClick={() => onClose(t.id)}>x</button>
        </div>
      ))}
    </div>
  );
}

function Pills({ b }) {
  return (
    <span className="sp-pills">
      <span className={'sp-pill sp-pill--pay-' + b.payment_status}>{PAYMENT_LABEL[b.payment_status] || b.payment_status}</span>
      {b.status !== 'booked' && <span className={'sp-pill sp-pill--st-' + b.status}>{STATUS_LABEL[b.status] || b.status}</span>}
    </span>
  );
}

function Actions({ b, busy, onPaid, onStatus }) {
  const closed = b.status === 'done' || b.status === 'cancelled' || b.status === 'no_show';
  return (
    <span className="sp-actions">
      {b.payment_status !== 'paid' && b.status !== 'cancelled' && (
        <button disabled={busy} onClick={() => onPaid(b)}>Mark paid</button>
      )}
      {!closed && <button disabled={busy} onClick={() => onStatus(b, 'done')}>Done</button>}
      {!closed && <button disabled={busy} onClick={() => onStatus(b, 'cancelled')}>Cancel</button>}
    </span>
  );
}

function ServiceRow({ service, token, onSaved, onRemoved, onError }) {
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(String(service.price));
  const [duration, setDuration] = useState(String(service.duration));
  const [busy, setBusy] = useState(false);
  const dirty = name !== service.name || price !== String(service.price) || duration !== String(service.duration);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api('/services/' + service.id, {
        method: 'PATCH', token, body: { name, price: Number(price), duration: Number(duration) },
      });
      onSaved(updated);
    } catch (err) { onError(err.message); }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm('Remove "' + service.name + '" from your price list?')) return;
    setBusy(true);
    try {
      await api('/services/' + service.id, { method: 'DELETE', token });
      onRemoved(service.id);
    } catch (err) { onError(err.message); setBusy(false); }
  }

  return (
    <form className="sp-svc" onSubmit={save}>
      <input className="sp-svc__name" aria-label="Service name" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="sp-svc__num">
        <span aria-hidden="true">{'\u20A6'}</span>
        <input aria-label={'Price for ' + service.name} inputMode="numeric" value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
      </label>
      <label className="sp-svc__num">
        <input aria-label={'Minutes for ' + service.name} inputMode="numeric" value={duration}
          onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ''))} />
        <span>mins</span>
      </label>
      <span className="sp-svc__btns">
        {dirty && <button className="sp-svc__save" disabled={busy}>{busy ? 'Saving' : 'Save'}</button>}
        <button type="button" className="sp-svc__remove" disabled={busy} onClick={remove} aria-label={'Remove ' + service.name}>Remove</button>
      </span>
    </form>
  );
}

function AddService({ token, onAdded, onError }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await api('/services', {
        method: 'POST', token, body: { name, price: Number(price), duration: Number(duration) },
      });
      onAdded(created);
      setName(''); setPrice(''); setDuration('');
    } catch (err) { onError(err.message); }
    setBusy(false);
  }

  return (
    <form className="sp-svc sp-svc--new" onSubmit={add}>
      <input className="sp-svc__name" placeholder="New service" aria-label="New service name" required
        value={name} onChange={(e) => setName(e.target.value)} />
      <label className="sp-svc__num">
        <span aria-hidden="true">{'\u20A6'}</span>
        <input placeholder="Price" aria-label="New service price" inputMode="numeric" required
          value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
      </label>
      <label className="sp-svc__num">
        <input placeholder="60" aria-label="New service minutes" inputMode="numeric" required
          value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ''))} />
        <span>mins</span>
      </label>
      <span className="sp-svc__btns">
        <button className="sp-svc__save" disabled={busy}>{busy ? 'Adding' : 'Add'}</button>
      </span>
    </form>
  );
}

// Shows what the server thinks this dashboard should see. Opened from the bottom of the page.
function DebugPanel({ token, bookingsLoaded, servicesLoaded, lastError }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  function load(e) {
    if (!e.target.open) return;
    setError('');
    api('/debug/me', { token })
      .then((d) => {
        setInfo(d);
        console.log('[SalonPal debug]', d);
      })
      .catch((err) => setError(err.message));
  }

  return (
    <details className="sp-debug" onToggle={load}>
      <summary>Debug info</summary>
      <dl>
        <div><dt>API address</dt><dd>{API_URL}</dd></div>
        <div><dt>Bookings on screen</dt><dd>{bookingsLoaded}</dd></div>
        <div><dt>Services on screen</dt><dd>{servicesLoaded}</dd></div>
        <div><dt>Last error</dt><dd>{lastError || 'none'}</dd></div>
        {info && (
          <>
            <div><dt>Signed in as salon</dt><dd>{info.signed_in_as_salon}{info.salon ? ' (' + info.salon.salon_name + ')' : ' (not found!)'}</dd></div>
            <div><dt>Your booking link</dt><dd>{info.your_booking_link}</dd></div>
            <div><dt>Your services in database</dt><dd>{info.your_services}</dd></div>
            <div><dt>Your bookings in database</dt><dd>{info.your_bookings}</dd></div>
            <div>
              <dt>Bookings for other salons</dt>
              <dd>
                {info.bookings_for_other_salons.length === 0
                  ? 'none'
                  : info.bookings_for_other_salons.map((r) => r.n + ' for salon ' + r.salon_id).join(', ')}
              </dd>
            </div>
          </>
        )}
      </dl>
      {error && <p className="sp-error sp-error--dark">{error}</p>}
      <p className="sp-debug__tip">
        If your bookings are under another salon, those clients used another salon's link. Share your own link above.
        For the full picture, open http://localhost:5000/api/debug or run node debug.js in the backend folder.
      </p>
    </details>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------
export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { token, salonId, salonName } = authStore();

  const [me, setMe] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [alertsAllowed, setAlertsAllowed] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const known = useRef(null); // previous bookings by id, to spot new ones and new payments

  const toast = useCallback((kind, title, body) => {
    const id = Date.now() + Math.random();
    setToasts((list) => list.concat({ id, kind, title, body }));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 9000);
    if (kind !== 'error' && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try { new Notification(title, { body }); } catch (e) { /* some browsers block this */ }
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    navigate('/login');
  }, [navigate]);

  const handleError = useCallback((err) => {
    if (err.status === 401) { signOut(); return true; }
    return false;
  }, [signOut]);

  const loadBookings = useCallback(async () => {
    try {
      const list = await api('/bookings', { token });
      const rows = Array.isArray(list) ? list : [];

      if (known.current) {
        rows.forEach((b) => {
          const before = known.current.get(b.id);
          const when = prettyDate(dateOf(b)) + ' at ' + timeOf(b);
          if (!before) {
            toast('new', 'New booking', b.client_name + ' booked ' + (b.service_name || 'a service') + ', ' + when + '.');
          } else if (before.payment_status !== 'paid' && b.payment_status === 'paid') {
            toast('paid', 'Payment received', b.client_name + ' paid ' + naira(b.price) + ' for ' + (b.service_name || 'their booking') + '.');
          } else if (before.payment_status === 'unpaid' && b.payment_status === 'pay_at_salon') {
            toast('new', 'Paying at the salon', b.client_name + ' will pay ' + naira(b.price) + ' when they arrive (' + when + ').');
          }
        });
      }
      known.current = new Map(rows.map((b) => [b.id, b]));
      setBookings(rows);
      setLoadError('');
    } catch (err) {
      if (!handleError(err)) setLoadError(err.message || 'Bookings could not be loaded.');
    }
  }, [token, toast, handleError]);

  // First load: who am I, my services, my bookings
  useEffect(() => {
    let cancelled = false;
    api('/auth/me', { token })
      .then((profile) => {
        if (cancelled) return;
        setMe(profile);
        authStore.setState({ salonId: profile.id, salonName: profile.salon_name });
        return api('/services?salon_id=' + profile.id).then((d) => { if (!cancelled) setServices(Array.isArray(d) ? d : []); });
      })
      .catch((err) => { if (!handleError(err)) setLoadError(err.message); });
    loadBookings();
    return () => { cancelled = true; };
  }, [token, loadBookings, handleError]);

  // Check for new bookings and payments every 15 seconds
  useEffect(() => {
    const timer = setInterval(loadBookings, POLL_MS);
    return () => clearInterval(timer);
  }, [loadBookings]);

  async function markPaid(b) {
    setBusyId(b.id);
    try {
      await api('/bookings/' + b.id + '/payment', { method: 'PATCH', token });
      // The refresh below shows the "Payment received" notification.
      await loadBookings();
    } catch (err) { if (!handleError(err)) toast('error', 'Could not update', err.message); }
    setBusyId(null);
  }

  async function setStatus(b, status) {
    if (status === 'cancelled' && !window.confirm('Cancel ' + b.client_name + "'s booking at " + timeOf(b) + '?')) return;
    setBusyId(b.id);
    try {
      await api('/bookings/' + b.id + '/status', { method: 'PATCH', token, body: { status } });
      await loadBookings();
    } catch (err) { if (!handleError(err)) toast('error', 'Could not update', err.message); }
    setBusyId(null);
  }

  function askForAlerts() {
    Notification.requestPermission().then(setAlertsAllowed);
  }

  const today = toISODate(new Date());
  const todays = bookings.filter((b) => dateOf(b) === today && b.status !== 'cancelled')
    .sort((a, b) => timeOf(a).localeCompare(timeOf(b)));
  const later = bookings.filter((b) => dateOf(b) > today && isActive(b));
  const takings = todays.filter(isActive).reduce((sum, b) => sum + Number(b.price || 0), 0);
  const paidToday = todays.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.price || 0), 0);

  const id = (me && me.id) || salonId || 1;
  const bookingLink = window.location.origin + (process.env.PUBLIC_URL || '') + '/#/book/' + id;

  function copyLink() {
    navigator.clipboard.writeText(bookingLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="sp-dash">
      <Toasts items={toasts} onClose={(tid) => setToasts((l) => l.filter((t) => t.id !== tid))} />

      <header className="sp-dash__top">
        <p className="sp-dash__brand">{(me && me.salon_name) || salonName || 'SalonPal'}</p>
        <span className="sp-dash__topbtns">
          {alertsAllowed === 'default' && (
            <button className="sp-linkbtn sp-linkbtn--light" onClick={askForAlerts}>Turn on desktop alerts</button>
          )}
          <button className="sp-linkbtn sp-linkbtn--light" onClick={signOut}>Sign out</button>
        </span>
      </header>

      <div className="sp-dash__intro">
        <h1 className="sp-dash__title">{greeting()}.</h1>
        <p className="sp-dash__date">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loadError && <p className="sp-error sp-error--dark sp-dash__err" role="alert">{loadError}</p>}

      <div className="sp-dash__grid">
        <div className="sp-dash__main">
          <section className="sp-chair" aria-labelledby="chair-title">
            <h2 id="chair-title" className="sp-chair__title">Today in the chair</h2>
            <ol className="sp-chair__rail">
              {HOURS.map((h) => {
                const hh = String(h).padStart(2, '0');
                const inHour = todays.filter((b) => timeOf(b).slice(0, 2) === hh);
                return (
                  <li key={h} className="sp-chair__hour">
                    <span className="sp-chair__clock">{hh}:00</span>
                    <div className="sp-chair__slot">
                      {inHour.length === 0 && <span className="sp-chair__free">Free</span>}
                      {inHour.map((b) => (
                        <div key={b.id} className={'sp-chair__appt' + (isActive(b) ? '' : ' is-closed') + (b.status === 'done' ? ' is-done' : '')}>
                          <span className="sp-chair__appt-time">{timeOf(b)}</span>
                          <span className="sp-chair__appt-who">{b.client_name}</span>
                          <span className="sp-chair__appt-what">{b.service_name || 'Service'}, {naira(b.price)}</span>
                          <span className="sp-chair__appt-phone">{b.client_phone}</span>
                          <Pills b={b} />
                          <Actions b={b} busy={busyId === b.id} onPaid={markPaid} onStatus={setStatus} />
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="sp-later" aria-labelledby="later-title">
            <h2 id="later-title" className="sp-chair__title">Coming up</h2>
            {later.length === 0 && <p className="sp-share__text">No bookings for the coming days yet.</p>}
            <ul className="sp-later__list">
              {later.map((b) => (
                <li key={b.id} className="sp-later__row">
                  <span className="sp-later__when">
                    <strong>{timeOf(b)}</strong>
                    <span>{prettyDate(dateOf(b))}</span>
                  </span>
                  <span className="sp-later__who">
                    <strong>{b.client_name}</strong>
                    <span>{b.service_name || 'Service'}, {naira(b.price)}, {b.client_phone}</span>
                  </span>
                  <Pills b={b} />
                  <Actions b={b} busy={busyId === b.id} onPaid={markPaid} onStatus={setStatus} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="sp-dash__side">
          <dl className="sp-tally">
            <div><dt>Clients today</dt><dd>{todays.filter(isActive).length}</dd></div>
            <div><dt>Expected today</dt><dd>{naira(takings)}</dd></div>
            <div><dt>Paid so far today</dt><dd>{naira(paidToday)}</dd></div>
            <div><dt>Coming up</dt><dd>{later.length}</dd></div>
          </dl>

          <section className="sp-share">
            <h2 className="sp-share__title">Your booking link</h2>
            <p className="sp-share__text">Put this in your Instagram bio and WhatsApp status so clients can book themselves.</p>
            <p className="sp-share__link">{bookingLink}</p>
            <button className="sp-btn sp-btn--straw" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
          </section>

          <section className="sp-pricelist" aria-labelledby="prices-title">
            <h2 id="prices-title" className="sp-share__title">Your price list</h2>
            <p className="sp-share__text">Change a price or duration, then press Save. New bookings use the new price.</p>
            {services.map((s) => (
              <ServiceRow key={s.id + '-' + s.price + '-' + s.duration + '-' + s.name} service={s} token={token}
                onSaved={(u) => { setServices((l) => l.map((x) => (x.id === u.id ? u : x))); toast('paid', 'Price list updated', u.name + ' is now ' + naira(u.price) + '.'); }}
                onRemoved={(sid) => setServices((l) => l.filter((x) => x.id !== sid))}
                onError={(m) => toast('error', 'Could not save', m)} />
            ))}
            <AddService token={token}
              onAdded={(c) => { setServices((l) => l.concat(c)); toast('paid', 'Service added', c.name + ', ' + naira(c.price) + '.'); }}
              onError={(m) => toast('error', 'Could not add', m)} />
          </section>

          <DebugPanel token={token} bookingsLoaded={bookings.length} servicesLoaded={services.length} lastError={loadError} />
        </aside>
      </div>
    </main>
  );
}