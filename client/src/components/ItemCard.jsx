import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, assetUrl } from '../utils/format';

export default function ItemCard({ item }) {
  return (
    <Link
      to={`/items/${item._id || item.id}`}
      className="group overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="aspect-[16/10] bg-paper">
        {item.imageUrl ? (
          <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug group-hover:text-accent">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-sm text-muted">
          {item.type === 'lost' ? 'Lost' : 'Found'} · {item.category}
        </p>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} /> {item.location} · {formatDate(item.date)}
        </p>
      </div>
    </Link>
  );
}
