import { statusLabel } from '../utils/format';

const tones = {
  lost: 'bg-paper text-ink',
  found: 'bg-accent-soft text-accent',
  matched: 'bg-accent-soft text-accent',
  recovered: 'bg-accent-soft text-accent',
  returned: 'bg-accent-soft text-accent',
  claim_pending: 'bg-[#f4eadc] text-warn',
  claimed: 'bg-accent-soft text-accent',
  closed: 'bg-paper text-muted',
  pending: 'bg-[#f4eadc] text-warn',
  under_review: 'bg-[#f4eadc] text-warn',
  suspicious: 'bg-[#f3e4e4] text-danger',
  approved: 'bg-accent-soft text-accent',
  rejected: 'bg-[#f3e4e4] text-danger',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        tones[status] || 'bg-paper text-muted'
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
