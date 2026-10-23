import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/forgot', { method: 'POST', body: { email } });
      setSent(data.message);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <main className="sp-register">
      <div className="sp-book">
        <header className="sp-book__head">
          <p className="sp-book__brand">SalonPal</p>
          <h1 className="sp-book__title">Forgot your password?</h1>
          <p className="sp-book__lede">Enter the email you signed up with and we will send you a link to choose a new one.</p>
        </header>

        {sent ? (
          <div className="sp-book__sent" role="status">
            <p>{sent}</p>
            <p>Check your inbox and spam folder.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sp-book__form">
            <label className="sp-line">
              <span>Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="sp-error" role="alert">{error}</p>}
            <button className="sp-btn sp-btn--auburn" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}

        <p className="sp-book__alt">Remembered it? <Link to="/login">Back to sign in</Link></p>
      </div>
    </main>
  );
}
