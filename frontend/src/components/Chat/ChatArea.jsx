import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';
import MessageBubble from './MessageBubble';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChatArea handles:
 * - loading messages for a session
 * - sending queries to backend
 * - voice input (speech-to-text)
 */
export default function ChatArea({ sessionId, setSessionId, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const endRef = useRef(null);

  /* ─────────────────────────────────────────────
     🎙️ SPEECH RECOGNITION (INIT ONCE)
  ───────────────────────────────────────────── */
  const cleanupRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const toggleListening = async () => {
    if (isListening) {
      // STOP RECORDING
      cleanupRecorder();
      setIsListening(false);
      return;
    }

    // START RECORDING
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Send to backend
        setProcessing(true);
        try {
          const res = await api.transcribe(blob, token);
          if (res.text) {
            setInput(prev => (prev ? `${prev} ${res.text}` : res.text));
          }
        } catch (err) {
          console.error("Transcription error", err);
          setError("Failed to transcribe audio. Ensure backend is running.");
        } finally {
          setProcessing(false);
        }
      };

      recorder.start();
      setIsListening(true);
      mediaRecorderRef.current = recorder;

    } catch (err) {
      console.error("Microphone error", err);
      setError("Microphone access denied or not available.");
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => cleanupRecorder();
  }, []);

  /* ─────────────────────────────────────────────
     📥 LOAD SESSION MESSAGES
  ───────────────────────────────────────────── */
  useEffect(() => {
    let ac = new AbortController();

    async function load() {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      setError(null);
      try {
        const res = await api.sessionMessages(sessionId, token, {
          signal: ac.signal,
        });
        setMessages(res.messages ?? []);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Failed to load messages');
      }
    }

    load();
    return () => ac.abort();
  }, [sessionId, token]);

  /* ─────────────────────────────────────────────
     🔽 AUTO SCROLL
  ───────────────────────────────────────────── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ─────────────────────────────────────────────
     📤 SEND MESSAGE
  ───────────────────────────────────────────── */
  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setError(null);

    const userMsg = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.chatQuery(text, sessionId, token);

      const aiMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: res.message ?? res.answer ?? 'No answer available.',
        sources: res.sources ?? [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (!sessionId && res.sessionId) {
        setSessionId(res.sessionId);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: `Error: ${e.message || 'Request failed'}`,
        },
      ]);
      setError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  /* ─────────────────────────────────────────────
     🧩 UI
  ───────────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            AI
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-none">
              Justice AI Assistant
            </h2>
            <p className="text-xs text-slate-500">Department of Justice</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto space-y-2">
          {error && (
            <div className="text-red-700 text-sm px-3 py-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 border border-slate-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full transition ${isListening
                ? 'bg-red-50 text-red-600 animate-pulse'
                : 'text-slate-400 hover:text-blue-700'
                }`}
              title={isListening ? 'Stop Listening' : 'Use Voice Input'}
            >
              🎤
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your legal question here..."
              className="flex-1 resize-none border-none outline-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className={`px-6 py-2 rounded font-bold ${sending || !input.trim()
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-900 text-white hover:bg-blue-800'
                }`}
            >
              {sending ? '...' : 'Ask →'}
            </button>
          </div>

          <p className="text-xs text-center text-slate-400">
            Answers are generated only from verified judicial data sources.
          </p>
        </div>
      </div>
    </div>
  );
}
