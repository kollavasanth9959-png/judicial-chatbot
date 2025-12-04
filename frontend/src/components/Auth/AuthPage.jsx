import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Logo from '../Common/Logo';

export default function AuthPage() {
  const { login, register } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
        // after registration, switch to login
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-3xl w-full grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-b from-white to-slate-50 rounded-lg shadow">
          <Logo />
          <h2 className="mt-6 text-2xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Login to access your chat history and personalized features.' : 'Register to save your chats and access additional features.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6 bg-white rounded-lg shadow flex flex-col gap-3">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {mode === 'register' && <input required className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}

          <input required className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input required className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />

          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}</button>

          <div className="text-sm text-slate-500">
            {mode === 'login' ? (
              <>Don't have an account? <button type="button" className="text-sky-600 underline" onClick={() => setMode('register')}>Register</button></>
            ) : (
              <>Already registered? <button type="button" className="text-sky-600 underline" onClick={() => setMode('login')}>Login</button></>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
