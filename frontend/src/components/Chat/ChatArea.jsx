import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';
import MessageBubble from './MessageBubble';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChatArea handles:
 * - loading messages for a session
 * - sending queries to backend
 * - creating optimistic user messages with stable ids
 */
export default function ChatArea({ sessionId, setSessionId, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  // load messages when sessionId changes (cancellable)
  useEffect(() => {
    let ac = new AbortController();
    async function load() {
      if (!sessionId) { setMessages([]); return; }
      setError(null);
      try {
        const res = await api.sessionMessages(sessionId, token, { signal: ac.signal });
        setMessages(res.messages ?? []);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Failed to load messages');
      }
    }
    load();
    return () => ac.abort();
  }, [sessionId, token]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setSending(true);
    setError(null);

    // optimistic message with stable id
    const userMsg = { id: uuidv4(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.chatQuery(text, sessionId, token);
      const ai = {
        id: uuidv4(),
        role: 'assistant',
        content: res.message ?? res.answer ?? 'No answer',
        sources: res.sources ?? [],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, ai]);
      if (!sessionId && res.sessionId) setSessionId(res.sessionId);
    } catch (e) {
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: `Error: ${e.message}` }]);
      setError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-[70vh]">
      <div className="p-4 border-b bg-white">
        <div className="text-sm text-slate-600">Session: <span className="font-medium">{sessionId || 'New Conversation'}</span></div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {messages.length === 0 && <div className="text-slate-400">No messages in this conversation yet.</div>}
        <div className="space-y-2">
          {messages.map((m) => <MessageBubble key={m.id ?? m.timestamp ?? Math.random()} m={m} />)}
          <div ref={endRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t">
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question and press Enter (Shift+Enter for newline)"
            className="input"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending) send();
              }
            }}
          />
          <button onClick={send} disabled={sending} className="btn-primary">{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
