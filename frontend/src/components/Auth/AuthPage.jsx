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

  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-sky-100 p-4">
    <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 animate-fade-in border border-white/50">

      <div className="flex flex-col justify-center p-6 space-y-6">
        <div className="animate-slide-up animation-delay-100">
          <Logo />
        </div>
        <div className="space-y-2 animate-slide-up animation-delay-200">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            {mode === 'login'
              ? 'Sign in to access your intelligent judicial assistant.'
              : 'Create an account to unlock personalized legal insights.'}
          </p>
        </div>
      </div>

      <div className="bg-white/50 rounded-xl p-8 shadow-inner animate-slide-in-right animation-delay-300 border border-white/60">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <input required className="input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <input required className="input" placeholder="name@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <input required className="input" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center text-sm text-slate-500 mt-4">
            {mode === 'login' ? (
              <>New here? <button type="button" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline" onClick={() => setMode('register')}>Create an account</button></>
            ) : (
              <>Already have an account? <button type="button" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline" onClick={() => setMode('login')}>Sign in</button></>
            )}
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
