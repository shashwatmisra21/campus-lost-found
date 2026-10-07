import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

export default function Matches({ mine }) {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const req = mine ? api.get('/items/matches/mine') : api.get(`/items/${id}/matches`);
    req
      .then((res) => setMatches(res.data.matches))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, mine]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl">Potential matches</h1>
      <p className="mt-2 text-sm text-muted">
        These are system-generated recommendations, not proof of ownership. A claim still requires private verification.
      </p>
      {matches.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No matches above the threshold" body="The rule-based matcher needs overlapping category, place, date, or description." />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {matches.map((m) => {
            const found = m.foundItem || m.item;
            const lost = m.lostItem;
            return (
              <article key={`${found._id}-${m.score}`} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {lost && <p className="text-sm text-muted">Your report: {lost.title}</p>}
                    <h2 className="font-serif text-2xl">{found.title}</h2>
                    <p className="text-sm text-muted">
                      {found.location} · {formatDate(found.date)}
                    </p>
                  </div>
                  <p className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent">
                    Potential Match — {m.score}%
                  </p>
                </div>
                <p className="mt-3 text-xs text-muted">{m.label}</p>
                {found.type === 'found' && (
                  <Link
                    to={`/items/${found._id}/claim${lost ? `?lost=${lost._id}` : ''}`}
                    className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm text-white"
                  >
                    Submit a claim
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
