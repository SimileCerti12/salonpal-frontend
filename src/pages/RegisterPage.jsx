import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authStore from '../store/authStore';
import { api } from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [salonName, setSalonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { email, password, salon_name: salonName },
      });
      if (data.token) {
        authStore.setState({
          token: data.token,
          salonId: data.salon_id || (data.salon && data.salon.id) || null,
        });
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sp-register">
      <div className="sp-book">
        <header className="sp-book__head">
          <p className="sp-book__brand">SalonPal</p>
          <h1 className="sp-book__title">Open your appointment book</h1>
          <p className="sp-book__lede">
            Takes about a minute. You can add your services and staff afterwards.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="sp-book__form">
          <label className="sp-line">
            <span>Salon name</span>
            <input required value={salonName} placeholder="e.g. The Beauty Box Lekki"
              onChange={(e) => setSalonName(e.target.value)} />
          </label>
          <label className="sp-line">
            <span>Email</span>
            <input type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="sp-line">
            <span>Password</span>
            <input type="password" required minLength={8} autoComplete="new-password"
              value={password} placeholder="At least 8 characters"
              onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && <p className="sp-error" role="alert">{error}</p>}

          <button className="sp-btn sp-btn--auburn" disabled={busy}>
            {busy ? 'Creating your salon...' : 'Create my salon'}
          </button>
        </form>

        <p className="sp-book__alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
