import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { formatDate, assetUrl } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then((res) => setItem(res.data.item))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!item) return <Spinner />;

  const canClaim = user && item.type === 'found' && ['found', 'claim_pending'].includes(item.status);

  return (
    <article className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="aspect-[16/10] bg-paper">
          {item.imageUrl ? (
            <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">No photo</div>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm uppercase tracking-wide text-muted">{item.type} item</p>
        <h1 className="mt-1 font-serif text-3xl">{item.title}</h1>
        <div className="mt-3">
          <StatusBadge status={item.status} />
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">Category</dt>
            <dd>{item.category}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">Location</dt>
            <dd>{item.location}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">Date</dt>
            <dd>{formatDate(item.date)} {item.approximateTime}</dd>
          </div>
          {item.color && (
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Color</dt>
              <dd>{item.color}</dd>
            </div>
          )}
          {item.brand && (
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Brand</dt>
              <dd>{item.brand}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 text-sm leading-relaxed">{item.description}</p>
        {item.publicFeatures && <p className="mt-3 text-sm text-muted">{item.publicFeatures}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {canClaim && (
            <Link to={`/items/${item._id}/claim`} className="rounded-md bg-accent px-4 py-2 text-sm text-white">
              Claim this item
            </Link>
          )}
          {user && (
            <Link to={`/items/${item._id}/matches`} className="rounded-md border border-line px-4 py-2 text-sm">
              View potential matches
            </Link>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          Identifying details used for verification are withheld on purpose.
        </p>
      </div>
    </article>
  );
}
