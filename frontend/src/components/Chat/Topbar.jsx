import React, { useContext, useState } from 'react';
import Logo from '../Common/Logo';
import { AuthContext } from '../../contexts/AuthContext';
import ProfileModal from '../Auth/ProfileModal';

export default function Topbar({ onLogout }) {
  const { user } = useContext(AuthContext);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <Logo small />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowProfile(true)} className="text-sm px-3 py-1 rounded bg-slate-50 hover:bg-slate-100">
            {user?.name ?? 'Profile'}
          </button>
          <button onClick={onLogout} className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Logout</button>
        </div>
      </div>

      {showProfile && <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />}
    </>
  );
}
