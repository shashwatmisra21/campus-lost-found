import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReportItem({ type }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'Electronics',
    description: '',
    date: '',
    approximateTime: '',
    location: 'Central Library',
    color: '',
    brand: '',
    publicFeatures: '',
    uniqueMarks: '',
    contents: '',
    hiddenDetails: '',
    extraNotes: '',
    contactPreference: 'in-app',
    storageInfo: '',
    image: null,
  });

  useEffect(() => {
    api.get('/items/meta').then((res) => {
      setMeta(res.data);
      setForm((f) => ({
        ...f,
        category: res.data.categories[0],
        location: res.data.locations[0],
      }));
    });
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries({ ...form, type }).forEach(([key, value]) => {
        if (key === 'image') {
          if (value) data.append('image', value);
        } else {
          data.append(key, value ?? '');
        }
      });
      const res = await api.post('/items', data);
      toast.push('Report submitted');
      const firstMatch = res.data.matches?.[0];
      if (firstMatch) navigate(`/items/${res.data.item._id}/matches`);
      else navigate(`/items/${res.data.item._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (key, label, el) => (
    <label className="block text-sm">
      {label}
      {el}
    </label>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl">{type === 'lost' ? 'Report a lost item' : 'Report a found item'}</h1>
      <p className="mt-2 text-sm text-muted">
        Public fields appear on the board. Verification fields stay private and are used only to test claims.
      </p>
      <form className="mt-6 space-y-8" onSubmit={onSubmit}>
        <section className="space-y-4 rounded-xl border border-line bg-card p-5">
          <h2 className="font-medium">Public information</h2>
          {field('title', 'Item name', <input required className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.title} onChange={(e) => set('title', e.target.value)} />)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              'category',
              'Category',
              <select className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {meta.categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
            {field(
              'location',
              'Location',
              <select className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.location} onChange={(e) => set('location', e.target.value)}>
                {meta.locations.map((c) => <option key={c}>{c}</option>)}
              </select>
            )}
          </div>
          {field('description', 'Description', <textarea required rows={4} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.description} onChange={(e) => set('description', e.target.value)} />)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('date', type === 'lost' ? 'Date lost' : 'Date found', <input type="date" required className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.date} onChange={(e) => set('date', e.target.value)} />)}
            {field('approximateTime', 'Approximate time', <input type="time" className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.approximateTime} onChange={(e) => set('approximateTime', e.target.value)} />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('color', 'Color', <input className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.color} onChange={(e) => set('color', e.target.value)} />)}
            {field('brand', 'Brand', <input className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.brand} onChange={(e) => set('brand', e.target.value)} />)}
          </div>
          {field('publicFeatures', 'Visible characteristics', <textarea rows={3} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.publicFeatures} onChange={(e) => set('publicFeatures', e.target.value)} />)}
          {type === 'lost'
            ? field('contactPreference', 'Contact preference', <input className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.contactPreference} onChange={(e) => set('contactPreference', e.target.value)} />)
            : field('storageInfo', 'Safe-storage information', <input className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.storageInfo} onChange={(e) => set('storageInfo', e.target.value)} />)}
          <div>
  <label className="block text-sm font-medium">
    Upload item photo
  </label>

  <p className="mt-1 text-sm text-muted">
    Upload a clear photo to help identify and compare this item.
    Maximum size: 5 MB.
  </p>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="mt-2 w-full text-sm"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (!file) {
        set('image', null);
        setImagePreview('');
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or WebP image.');
        e.target.value = '';
        set('image', null);
        setImagePreview('');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5 MB.');
        e.target.value = '';
        set('image', null);
        setImagePreview('');
        return;
      }

      setError('');
      set('image', file);
      setImagePreview(URL.createObjectURL(file));
    }}
  />

  {imagePreview && (
    <div className="mt-4">
      <img
        src={imagePreview}
        alt="Selected item preview"
        className="h-48 w-full rounded-lg border border-line object-contain"
      />

      <button
  type="button"
  className="mt-2 text-sm text-danger"
  onClick={() => {
    set('image', null);
    setImagePreview('');
    const input = document.querySelector('input[type="file"]');
    if (input) input.value = '';
  }}
>
  Remove photo
</button>
    </div>
  )}
</div>
        </section>

        <section className="space-y-4 rounded-xl border border-line bg-card p-5">
          <h2 className="font-medium">Private verification</h2>
          <p className="text-sm text-muted">Not shown on public pages or in public APIs. Used to test whether a claimant is the owner.</p>
          {field('uniqueMarks', 'Unique marks / scratches / stickers', <textarea rows={2} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.uniqueMarks} onChange={(e) => set('uniqueMarks', e.target.value)} />)}
          {field('contents', 'Contents or accessories', <textarea rows={2} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.contents} onChange={(e) => set('contents', e.target.value)} />)}
          {field('hiddenDetails', 'Hidden details only the owner would know', <textarea rows={2} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.hiddenDetails} onChange={(e) => set('hiddenDetails', e.target.value)} />)}
          {field('extraNotes', 'Other ownership details', <textarea rows={2} className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2" value={form.extraNotes} onChange={(e) => set('extraNotes', e.target.value)} />)}
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy} className="rounded-md bg-accent px-5 py-2.5 text-sm text-white disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}
