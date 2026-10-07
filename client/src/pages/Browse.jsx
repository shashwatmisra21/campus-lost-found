import { useEffect, useState } from 'react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function Browse() {
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    category: '',
    location: '',
    status: '',
    from: '',
    to: '',
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/items/meta').then((res) => setMeta(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    setLoading(true);
    api
      .get('/items', { params })
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  function set(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">Browse reports</h1>
      <p className="mt-1 text-sm text-muted">Search public listings only. Private ownership details are never shown here.</p>
      <div className="mt-6 grid gap-3 rounded-xl border border-line bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
        <input
          placeholder="Keyword"
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
          value={filters.keyword}
          onChange={(e) => set('keyword', e.target.value)}
        />
        <select className="rounded-md border border-line bg-paper px-3 py-2 text-sm" value={filters.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">Lost / Found</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select className="rounded-md border border-line bg-paper px-3 py-2 text-sm" value={filters.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">Category</option>
          {meta.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="rounded-md border border-line bg-paper px-3 py-2 text-sm" value={filters.location} onChange={(e) => set('location', e.target.value)}>
          <option value="">Location</option>
          {meta.locations.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input type="date" className="rounded-md border border-line bg-paper px-3 py-2 text-sm" value={filters.from} onChange={(e) => set('from', e.target.value)} />
        <input type="date" className="rounded-md border border-line bg-paper px-3 py-2 text-sm" value={filters.to} onChange={(e) => set('to', e.target.value)} />
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No reports match" body="Try clearing a filter or check back after new items are filed." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
