import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Coins, Recycle } from 'lucide-react';
import Logo from '../../components/Logo';
import { Button, Field } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../api/client';
import { homeFor } from '../../routes/guards';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md animate-fadeUp">
          <Link to="/"><Logo /></Link>
          <h1 className="mt-10 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-forest lg:block">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-mint/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-extrabold leading-tight">Recycle. Earn.<br />Build a Greener Future.</h2>
          <ul className="mt-10 space-y-6 text-emerald-50">
            {[[Recycle, 'Log your recycling', 'Submit plastic, paper, glass and metal with optional photo evidence.'],
              [ShieldCheck, 'Verified by administrators', 'Every submission is reviewed before any reward is issued.'],
              [Coins, 'Rewarded on the blockchain', 'Approved activities earn ECO tokens you can verify on Sepolia.']].map(([Icon, t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"><Icon className="h-5 w-5" /></span>
                <div><p className="font-semibold">{t}</p><p className="text-sm text-emerald-100/75">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, id, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-11" value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      const allowed = from && ((user.role === 'ADMIN' && from.startsWith('/admin')) || (user.role === 'CITIZEN' && from.startsWith('/app')));
      navigate(allowed ? from : homeFor(user), { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back" subtitle="Log in to continue to your EcoChain dashboard." footer={<>New to EcoChain? <Link to="/register" className="font-semibold text-emerald">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput value={form.password} autoComplete="current-password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', displayName: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.fullName.trim().length < 2) errs.fullName = 'Enter your full name';
    if (form.displayName && form.displayName.trim().length < 2) errs.displayName = 'At least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) errs.password = 'Use 8+ characters with letters and numbers';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await register({ fullName: form.fullName, displayName: form.displayName || undefined, email: form.email, password: form.password });
      toast.success('Account created. Welcome to EcoChain!');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Create your account" subtitle="Start recycling and earning ECO tokens today." footer={<>Already registered? <Link to="/login" className="font-semibold text-emerald">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.fullName}><input className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" /></Field>
        <Field label="Leaderboard display name (optional)" error={errors.displayName} hint="Shown publicly instead of your real name.">
          <input className="input" value={form.displayName} onChange={set('displayName')} />
        </Field>
        <Field label="Email" error={errors.email}><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password}><PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirm password" error={errors.confirm}><PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </Shell>
  );
}
