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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Simpler for stability
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone access.");
      } else if (event.error === 'no-speech') {
        // failed to detect speech, just stop
      } else {
        alert("Voice input error: " + event.error);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

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
    <div className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
      {/* 🟦 SECTION 1: TOP BAR (Already handled by Topbar in App layout, but we ensure content here matches specific wireframe if needed, mostly App.jsx handles the container) */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">AI</div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-none">Justice AI Assistant</h2>
            <p className="text-xs text-slate-500">Department of Justice</p>
          </div>
        </div>
      </div>

      {/* 🟦 SECTION 2: MAIN CHAT AREA */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-80 animate-fade-in max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">⚖️</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Justice AI Assistant</h3>
            <p className="text-slate-600 mb-8">"Ask your legal or judicial queries here."</p>

            {/* 🟦 SECTION 3: SUGGESTED PROMPTS */}
            <div className="w-full">
              <p className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "E-Filing Steps", "Pay Traffic Fine",
                  "Case Pendency", "e-Courts Services"
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 py-3 px-4 rounded text-sm font-medium transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((m) => (
            <MessageBubble key={m.id ?? m.timestamp ?? Math.random()} m={m} />
          ))}
          <div ref={endRef} className="h-4" />
        </div>
      </div>

      {/* 🟦 SECTION 4: INPUT BAR */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {error && (
            <div className="text-red-700 text-sm px-3 py-2 bg-red-50 border border-red-200 rounded animate-pulse">
              Error: {error}
            </div>
          )}

          <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            {/* Voice Input Icon */}
            {/* Voice Input Icon */}
            <button
              onClick={toggleListening}
              className={`p-2 transition-all duration-200 rounded-full ${isListening ? 'bg-red-50 text-red-600 animate-pulse ring-2 ring-red-100' : 'text-slate-400 hover:text-blue-700 hover:bg-slate-50'}`}
              title={isListening ? "Stop Listening" : "Use Voice Input"}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your legal question here..."
              className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 resize-none max-h-32 py-2 min-h-[40px]"
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending) send();
                }
              }}
            />

            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className={`flex items-center gap-2 px-6 py-2 rounded font-bold transition-all ${sending || !input.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-900 text-white hover:bg-blue-800 shadow-md active:scale-95'
                }`}
            >
              {sending ? '...' : (
                <>
                  Ask <span className="text-lg">→</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-1">
            <p className="text-xs text-slate-400">Answers are generated only from verified judicial data sources.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
