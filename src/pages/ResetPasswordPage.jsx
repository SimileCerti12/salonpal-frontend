import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { saveSession } from '../lib/session';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/reset', { method: 'POST', body: { token, password } });
      saveSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="sp-register">
      <div className="sp-book">
        <header className="sp-book__head">
          <p className="sp-book__brand">SalonPal</p>
          <h1 className="sp-book__title">Choose a new password</h1>
          <p className="sp-book__lede">You will be signed in straight after.</p>
        </header>

        {!token ? (
          <p className="sp-error" role="alert">
            This reset link is incomplete. <Link to="/forgot-password">Ask for a new one</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="sp-book__form">
            <label className="sp-line">
              <span>New password</span>
              <input type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="sp-line">
              <span>Type it again</span>
              <input type="password" required minLength={8} autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <p className="sp-error" role="alert">{error}</p>}
            <button className="sp-btn sp-btn--auburn" disabled={busy}>{busy ? 'Saving...' : 'Save new password'}</button>
          </form>
        )}

        <p className="sp-book__alt"><Link to="/login">Back to sign in</Link></p>
      </div>
    </main>
  );
}
