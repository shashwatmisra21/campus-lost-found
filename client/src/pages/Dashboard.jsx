import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [mine, setMine] = useState([]);
  const [recent, setRecent] = useState([]);
  const [matches, setMatches] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      api.get('/items/mine'),
      api.get('/items'),
      api.get('/items/matches/mine'),
      api.get('/claims/my'),
    ])
      .then(([a, b, c, d]) => {
        if (!active) return;

        setMine(a.data.items || []);
        setRecent((b.data.items || []).slice(0, 6));
        setMatches(c.data.matches || []);
        setClaims(d.data.claims || []);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load your dashboard.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.key]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-danger">{error}</p>;

  const lost = mine.filter((item) => item.type === 'lost');
  const found = mine.filter((item) => item.type === 'found');

  const pending = claims.filter((claim) =>
    ['pending', 'under_review', 'suspicious'].includes(claim.status)
  );

  const approved = claims.filter(
    (claim) => claim.status === 'approved'
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl">
          Welcome, {user.name.split(' ')[0]}
        </h1>

        <p className="mt-1 text-sm text-muted">
          Track reports, matches, and claims from one place.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/report/lost"
            className="rounded-md bg-accent px-4 py-2 text-sm text-white"
          >
            Report lost
          </Link>

          <Link
            to="/report/found"
            className="rounded-md border border-line px-4 py-2 text-sm"
          >
            Report found
          </Link>

          <Link
            to="/browse"
            className="rounded-md border border-line px-4 py-2 text-sm"
          >
            Browse
          </Link>
        </div>
      </div>

      {/* Potential matches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Potential matches</h2>

          <Link to="/matches" className="text-sm text-accent">
            View all
          </Link>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            title="No matches yet"
            body="When a found item looks similar to one of your lost reports, it will appear here as a recommendation — not proof of ownership."
          />
        ) : (
          <div className="grid gap-3">
            {matches.slice(0, 3).map((match) => (
              <Link
                key={`${match.lostItem._id}-${match.foundItem._id}`}
                to={`/items/${match.foundItem._id}/claim?lost=${match.lostItem._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4"
              >
                <div>
                  <p className="font-medium">
                    {match.lostItem.title} ↔ {match.foundItem.title}
                  </p>

                  <p className="text-sm text-muted">{match.label}</p>
                </div>

                <p className="text-sm">
                  Potential Match — {match.score}%
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Pending claims */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Pending claims</h2>

          <Link to="/claims" className="text-sm text-accent">
            My claims
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">No open claims.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {pending.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-2">
                      {claim.item?.title || 'Item'}
                    </td>

                    <td className="px-4 py-2">
                      {claim.confidenceScore}%
                    </td>

                    <td className="px-4 py-2">
                      <StatusBadge status={claim.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Approved claims */}
      <section>
        <h2 className="mb-3 font-serif text-2xl">
          Approved claims
        </h2>

        {approved.length === 0 ? (
          <p className="text-sm text-muted">
            No approved claims yet.
          </p>
        ) : (
          <div className="space-y-3">
            {approved.map((claim) => (
              <div
                key={claim.id}
                className="rounded-xl border border-line bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium">
                    {claim.item?.title || 'Item'}
                  </h3>

                  <StatusBadge status={claim.status} />
                </div>

                <p className="mt-2 text-sm text-muted">
                  Your claim has been approved.
                </p>

                {claim.reporterContact?.email ? (
                  <div className="mt-3 text-sm">
                    <p>
                      <span className="text-muted">
                        Found reporter:{' '}
                      </span>
                      {claim.reporterContact.name || 'Reporter'}
                    </p>

                    <p className="mt-1">
                      <span className="text-muted">Email: </span>

                      <a
                        href={`mailto:${claim.reporterContact.email}`}
                        className="text-accent underline"
                      >
                        {claim.reporterContact.email}
                      </a>
                    </p>

                    <a
                      href={`mailto:${claim.reporterContact.email}?subject=${encodeURIComponent(
                        `Regarding your found item: ${
                          claim.item?.title || 'Lost item'
                        }`
                      )}`}
                      className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm text-white"
                    >
                      Contact reporter
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    Contact information is not available.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My reports */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">My lost reports</h2>

            <Link to="/reports" className="text-sm text-accent">
              All reports
            </Link>
          </div>

          {lost.length === 0 ? (
            <EmptyState title="No lost reports" />
          ) : (
            <div className="grid gap-4">
              {lost.slice(0, 2).map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-2xl">
            My found reports
          </h2>

          {found.length === 0 ? (
            <EmptyState title="No found reports" />
          ) : (
            <div className="grid gap-4">
              {found.slice(0, 2).map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recently reported */}
      <section>
        <h2 className="mb-3 font-serif text-2xl">
          Recently reported
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}