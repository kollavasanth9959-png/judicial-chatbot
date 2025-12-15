import React from 'react';

export default function Sidebar({ sessions = [], activeSessionId, onSelectSession, onCreateNew, onDelete }) {
  return (
    <aside className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Menu</h3>
        <button onClick={onCreateNew} className="text-sm bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800">
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Section: Chat History */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chat History</h4>
          {sessions.length === 0 && (
            <p className="text-sm text-slate-400 italic">No history available.</p>
          )}
          <ul className="space-y-1">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                onClick={() => onSelectSession(s.sessionId)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${s.sessionId === activeSessionId ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <span className="truncate flex-1 text-sm">{s.title || 'Untitled Conversation'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.sessionId); }}
                  className="text-slate-400 hover:text-red-500 ml-2"
                  title="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Section: Saved Queries (Mock for wireframe) */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saved Queries</h4>
          <div className="flex flex-col gap-2">
            <button className="text-left text-sm text-slate-700 hover:text-blue-800 flex items-center gap-2">
              <span>⭐</span> Traffic Challan Rules
            </button>
            <button className="text-left text-sm text-slate-700 hover:text-blue-800 flex items-center gap-2">
              <span>⭐</span> FIR Quashing Process
            </button>
          </div>
        </div>

        {/* Section: Privacy Notice */}
        <div className="mt-auto pt-6 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Privacy Notice</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            This system is for judicial assistance only. Conversations are monitored for quality assurance.
            <br /><br />
            <span className="font-semibold">Version 1.0 (Gov)</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
