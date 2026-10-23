import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { saveSession } from '../lib/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      saveSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sp-login">
      <section className="sp-login__cloth" aria-hidden="true">
        <p className="sp-login__mark">SalonPal</p>
        <div className="sp-login__slip">
          <span className="sp-login__slip-time">10:30</span>
          <span>Knotless braids, medium</span>
          <span className="sp-login__slip-name">Adaeze O.</span>
        </div>
      </section>

      <section className="sp-login__panel">
        <p className="sp-login__mark sp-login__mark--small">SalonPal</p>
        <h1 className="sp-login__title">Welcome back.</h1>
        <p className="sp-login__lede">Sign in to see who is in your chair today.</p>

        <form onSubmit={handleSubmit} className="sp-login__form">
          <label className="sp-field">
            <span>Email</span>
            <input type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="sp-field">
            <span>Password</span>
            <input type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </label>

          <Link className="sp-login__forgot" to="/forgot-password">Forgot your password?</Link>

          {error && <p className="sp-error" role="alert">{error}</p>}

          <button className="sp-btn sp-btn--indigo" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="sp-login__alt">
          New to SalonPal? <Link to="/register">Set up your salon</Link>
        </p>
      </section>
    </main>
  );
}
