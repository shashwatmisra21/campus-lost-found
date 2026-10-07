import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

export default function Claim() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const lostItemId = searchParams.get('lost');
  const navigate = useNavigate();
  const { push } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    uniqueMarks: '',
    contents: '',
    hiddenDetails: '',
    extraNotes: '',
  });

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then((res) => setItem(res.data.item))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/claims', {
        itemId: id,
        lostItemId: lostItemId || undefined,
        uniqueMarks: form.uniqueMarks,
        contents: form.contents,
        hiddenDetails: form.hiddenDetails,
        extraNotes: form.extraNotes,
      });

      const evaluation = res.data.evaluation;

      push(
        `Claim submitted — ${evaluation.score}% verification confidence.`,
        evaluation.riskLevel === 'high' ? 'error' : 'info'
      );

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  if (error && !item) {
    return <p className="text-danger">{error}</p>;
  }

  if (!item) {
    return <p className="text-danger">Item not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard" className="text-sm text-muted hover:text-ink">
        ← Back to dashboard
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <p className="text-sm uppercase tracking-wide text-muted">
          Ownership verification
        </p>

        <h1 className="mt-2 font-serif text-3xl">
          Claim: {item.title}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          A potential match does not prove ownership. Answer the questions
          below using details you knew about the item before it was found.
        </p>

        <div className="mt-5 rounded-xl bg-accent-soft p-4 text-sm">
          <p className="font-medium text-accent">
            Privacy protection
          </p>
          <p className="mt-1 text-muted">
            Private identifying information from the original report is
            intentionally hidden. The system compares your answers with that
            information without revealing the answer to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium">
              What unique marks does the item have?
            </label>
            <textarea
              name="uniqueMarks"
              value={form.uniqueMarks}
              onChange={updateField}
              placeholder="Describe scratches, stickers, marks, damage, etc."
              className="mt-2 min-h-24 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              What contents or identifying items were inside it?
            </label>
            <textarea
              name="contents"
              value={form.contents}
              onChange={updateField}
              placeholder="Mention contents that only the genuine owner would likely know."
              className="mt-2 min-h-24 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Describe any private details about the item
            </label>
            <textarea
              name="hiddenDetails"
              value={form.hiddenDetails}
              onChange={updateField}
              placeholder="Describe details that were not included in the public report."
              className="mt-2 min-h-24 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Additional information <span className="text-muted">(optional)</span>
            </label>
            <textarea
              name="extraNotes"
              value={form.extraNotes}
              onChange={updateField}
              placeholder="Anything else that may help verify ownership."
              className="mt-2 min-h-20 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && (
            <p className="rounded-md border border-danger/20 bg-white p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-accent px-4 py-3 text-sm text-white disabled:opacity-60"
          >
            {submitting ? 'Checking your answers...' : 'Submit claim'}
          </button>
        </form>
      </div>
    </div>
  );
}