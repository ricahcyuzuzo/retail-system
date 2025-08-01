import React, { useState } from 'react';

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
      <form onSubmit={handleLogin} style={{ minWidth: 320, padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px #0001' }}>
        <h2 style={{ marginBottom: 24 }}>Desktop Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 16, borderRadius: 4, border: '1px solid #ccc' }}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 24, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16 }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
