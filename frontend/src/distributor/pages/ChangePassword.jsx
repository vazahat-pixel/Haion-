import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { dms, useDmsMutation, apiError } from '../api';
import { PageTitle, Field, Input, Alert } from '../components/ui';

export default function ChangePassword() {
  const [v, setV] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const save = useDmsMutation((b) => dms.post('/change-password', b), { onSuccess: () => { setOk('Password changed successfully'); setV({ oldPassword: '', newPassword: '', confirm: '' }); } });
  const submit = (e) => {
    e.preventDefault(); setMsg(''); setOk('');
    if (v.newPassword !== v.confirm) { setMsg('New password and confirmation do not match'); return; }
    save.mutate({ oldPassword: v.oldPassword, newPassword: v.newPassword }, { onError: (err) => setMsg(apiError(err).message) });
  };
  return (
    <>
      <PageTitle icon={KeyRound}>Change password</PageTitle>
      <Alert>{msg}</Alert><Alert ok>{ok}</Alert>
      <form onSubmit={submit} style={{ maxWidth: 380, margin: '0 auto', display: 'grid', gap: 12 }}>
        <Field label="Old Password" required><Input type="password" required autoComplete="current-password" value={v.oldPassword} onChange={(e) => setV({ ...v, oldPassword: e.target.value })} /></Field>
        <Field label="New Password" required><Input type="password" required minLength={8} autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} /></Field>
        <Field label="Confirm New Password" required><Input type="password" required minLength={8} autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} /></Field>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>save</button></div>
      </form>
    </>
  );
}
