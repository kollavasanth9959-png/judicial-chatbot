import React from 'react';

export default function MessageBubble({ m }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div
        className={`max-w-[85%] md:max-w-2xl rounded-lg p-4 shadow-sm relative border ${isUser
          ? 'bg-blue-900 border-blue-900 text-white rounded-tr-none'
          : 'bg-white border-slate-200 text-slate-900 rounded-tl-none'
          }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>

        {!isUser && m.sources && m.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Sources
            </div>
            <ul className="space-y-1">
              {m.sources.map((s, i) => (
                <li key={s.id ?? i} className="text-xs bg-slate-50 text-slate-600 p-2 rounded hover:bg-slate-100 transition-colors cursor-default border border-slate-100 flex justify-between items-center">
                  <span className="truncate flex-1 max-w-[200px]">{s.title ?? s.id}</span>
                  {s.relevance && <span className="ml-2 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-500 font-medium">{Math.round(s.relevance * 100)}% match</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`text-[10px] mt-2 flex justify-end opacity-70 ${isUser ? 'text-indigo-100' : 'text-slate-400'}`}>
          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </div>
      </div>
    </div>
  );
}
