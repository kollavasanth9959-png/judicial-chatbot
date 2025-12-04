import React from 'react';

export default function MessageBubble({ m }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'bg-sky-600 text-white' : 'bg-white border'} max-w-xl rounded-lg p-3 my-2 shadow-sm`}>
        <div className="whitespace-pre-wrap text-sm">{m.content}</div>

        {!isUser && m.sources && m.sources.length > 0 && (
          <div className="mt-2 text-xs text-slate-500 border-t pt-2">
            <div className="font-medium">Sources</div>
            <ul className="list-disc list-inside">
              {m.sources.map((s, i) => (
                <li key={s.id ?? i}>
                  {s.title ?? s.id} {s.relevance ? `(${s.relevance}%)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
