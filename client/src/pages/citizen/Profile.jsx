import { useState } from 'react';
import api, { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, CardHeader, Field, PageHeader, fmtDate } from '../../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: user.fullName, displayName: user.displayName });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2 || form.displayName.trim().length < 2) return toast.error('Names must be at least 2 characters');
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', form);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 8 || !/[A-Za-z]/.test(pw.newPassword) || !/[0-9]/.test(pw.newPassword)) errs.newPassword = 'Use 8+ characters with letters and numbers';
    if (pw.newPassword !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(errMsg(err)); } finally { setPwBusy(false); }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Manage your personal information and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" />
          <form onSubmit={save} className="space-y-5 p-5">
            <Field label="Full name"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
            <Field label="Leaderboard display name" hint="This is the only name other citizens can see."><input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></Field>
            <Field label="Email" hint="Email cannot be changed."><input className="input bg-slate-50" value={user.email} disabled /></Field>
            <Field label="Linked wallet address"><input className="input bg-slate-50 font-mono text-xs" value={user.walletAddress || 'Not linked: go to My Wallet'} disabled /></Field>
            <p className="text-xs text-muted">Member since {fmtDate(user.createdAt)}</p>
            <Button type="submit" loading={saving}>Save changes</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <form onSubmit={changePw} className="space-y-5 p-5">
            <Field label="Current password" error={pwErr.currentPassword}><input type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New password" error={pwErr.newPassword}><input type="password" autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
            <Field label="Confirm new password" error={pwErr.confirm}><input type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <Button type="submit" variant="dark" loading={pwBusy}>Update password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
