import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      toast.push('Account created');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function field(key, label, type = 'text') {
    return (
      <label className="block text-sm">
        {label}
        <input
          type={type}
          required={key !== 'phone'}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </label>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-8">
      <h1 className="font-serif text-3xl">Create an account</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {field('name', 'Full name')}
        {field('email', 'Email', 'email')}
        {field('phone', 'Phone (optional)', 'tel')}
        {field('password', 'Password (min 8 characters)', 'password')}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-accent py-2.5 text-sm text-white disabled:opacity-60">
          {busy ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already registered? <Link to="/login" className="text-accent">Sign in</Link>
      </p>
    </div>
  );
}
