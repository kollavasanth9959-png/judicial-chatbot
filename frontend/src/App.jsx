import React, { useContext, useEffect, useState } from 'react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import Topbar from './components/Chat/Topbar';
import Sidebar from './components/Chat/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import { api } from './api/api';

/**
 * App root:
 * - If not authenticated, show AuthPage
 * - If authenticated, load sessions and show chat UI
 */
function AppInner() {
  const { token, logout } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  useEffect(() => {
    if (!token) {
      setSessions([]); setActiveSessionId(null); return;
    }
    let ac = new AbortController();
    async function load() {
      setLoadingSessions(true); setSessionsError(null);
      try {
        const res = await api.history(token, { signal: ac.signal });
        // normalize: backend may return { chats: [...] } or an array
        const arr = res.chats ?? res ?? [];
        setSessions(arr);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setSessionsError(e.message || 'Failed to load conversations');
      } finally { setLoadingSessions(false); }
    }
    load();
    return () => ac.abort();
  }, [token]);

  async function handleDelete(sessionId) {
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.deleteSession(sessionId, token);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (e) {
      alert('Delete failed: ' + (e.message || ''));
    }
  }

  function handleCreateNew() {
    setActiveSessionId(null);
  }

  if (!token) return <AuthPage />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <Topbar onLogout={logout} />
        <div className="flex flex-col md:flex-row">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onCreateNew={handleCreateNew}
            onDelete={handleDelete}
          />
          <div className="flex-1">
            <ChatArea sessionId={activeSessionId} setSessionId={setActiveSessionId} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
