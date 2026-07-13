import { useState, type FormEvent } from 'react';

/** Sign-in screen. Uses portal credentials; the main process validates them. */
export default function LoginScreen(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await window.tracker.login(email, password);
      if (!result.ok) {
        setError(result.error ?? 'Sign in failed. Please check your details and try again.');
        setLoading(false);
      }
      // On success the main process pushes a new state and this screen unmounts.
    } catch (cause: unknown) {
      console.error('Login request failed', cause);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="app screen">
      <header className="brand">
        <span className="brand__dot" />
        <h1 className="brand__title">Exyconn Tracker</h1>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <h2 className="card__heading">Sign in</h2>

        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="field__input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="field__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
          />
        </label>

        {error !== null && <p className="alert alert--error">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="hint">Use your Exyconn portal email and password.</p>
      </form>
    </div>
  );
}
