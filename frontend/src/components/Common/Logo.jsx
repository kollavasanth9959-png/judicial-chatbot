import React from 'react';

export default function Logo({ small = false }) {
  return (
    <div className="flex items-center gap-3">
      <svg className={`${small ? 'w-6 h-6' : 'w-8 h-8'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#0ea5e9" />
        <path d="M7 8h10M7 12h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <div className="text-lg font-semibold">AI Judicial Chatbot</div>
        {!small && <div className="text-xs text-slate-400">Official knowledge assistant</div>}
      </div>
    </div>
  );
}
