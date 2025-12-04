import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * ProfileModal
 * Props:
 * - open (bool)
 * - onClose (fn)
 *
 * Shows:
 * - name
 * - role (select)
 * - query usage (queryCount / queryLimit)
 * - lastLogin
 *
 * Attempts to persist role change via AuthContext.updateRole()
 * If backend route is missing, it will rollback and show an error message.
 */
export default function ProfileModal({ open, onClose }) {
  const { user, updateRole } = useContext(AuthContext);
  const [localRole, setLocalRole] = useState(user?.role ?? '');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalRole(user?.role ?? '');
    setStatus(null);
  }, [user, open]);

  if (!open) return null;

  const roles = [
    'standard',
    'premium',
    'student',
    'legal_professional',
    'judicial_officer',
    'paralegal'
  ];

  const queriesLeft = (() => {
    if (!user) return 0;
    if (user.queryLimit === -1) return 'unlimited';
    const left = (user.queryLimit ?? 0) - (user.queryCount ?? 0);
    return left < 0 ? 0 : left;
  })();

  const handleSave = async () => {
    if (!user) return;
    if (localRole === user.role) { setStatus({ type: 'info', text: 'No changes' }); return; }
    setSaving(true);
    setStatus(null);
    const res = await updateRole(localRole);
    setSaving(false);
    if (res.success) {
      setStatus({ type: 'success', text: 'Role updated' });
    } else {
      // Helpful guidance when backend route is missing
      const err = res.error || res;
      setStatus({
        type: 'error',
        text: `Failed to update role: ${err.message || err.toString()}. Backend PATCH /user/role must be implemented to persist changes.`
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-semibold">Profile</div>
          <button onClick={onClose} className="text-sm px-3 py-1">Close</button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500">Name</div>
            <div className="text-sm">{user?.name ?? '-'}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Role</div>
            <select className="input" value={localRole} onChange={e => setLocalRole(e.target.value)}>
              {roles.map(r => <option value={r} key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-500">Queries used</div>
            <div className="text-sm">{user?.queryCount ?? 0} / {user?.queryLimit === -1 ? 'unlimited' : user?.queryLimit ?? 0}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Queries left</div>
            <div className="text-sm">{queriesLeft}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Last login</div>
            <div className="text-sm">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</div>
          </div>

          {status && (
            <div className={`text-sm ${status.type === 'error' ? 'text-red-600' : status.type === 'success' ? 'text-green-600' : 'text-slate-600'}`}>
              {status.text}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
