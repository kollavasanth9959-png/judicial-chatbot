import React from 'react';

export default function Sidebar({ sessions = [], activeSessionId, onSelectSession, onCreateNew, onDelete }) {
  return (
    <aside className="w-full md:w-80 bg-white border-r p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Conversations</div>
        <button onClick={onCreateNew} title="New conversation" className="p-1 rounded hover:bg-slate-100">+</button>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 && <div className="text-sm text-slate-400">No conversations yet. Click + to start one.</div>}
        <ul className="space-y-2 mt-2">
          {sessions.map(s => (
            <li key={s.sessionId} className={`p-2 rounded cursor-pointer flex items-center justify-between ${s.sessionId === activeSessionId ? 'bg-slate-100' : 'hover:bg-slate-50'}`} onClick={() => onSelectSession(s.sessionId)}>
              <div className="truncate">
                <div className="text-sm font-medium truncate">{s.title || 'New conversation'}</div>
                <div className="text-xs text-slate-400">{s.messageCount} messages · {new Date(s.updatedAt).toLocaleString()}</div>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onDelete(s.sessionId); }} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
