import { Link } from 'react-router-dom';
import { ShieldCheck, Search, FileText, Handshake } from 'lucide-react';

const steps = [
  { icon: FileText, title: 'Report', body: 'File a lost or found report with public details and private ownership clues.' },
  { icon: Search, title: 'Match', body: 'The system scores likely pairs by category, place, date, and description.' },
  { icon: ShieldCheck, title: 'Verify', body: 'Claimants answer questions only a real owner would know. Scores are recommendations, not proof.' },
  { icon: Handshake, title: 'Reunite', body: 'A moderator reviews risky claims, then marks the item returned.' },
];

export default function Landing() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">University lost & found</p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
            Lost something? Found something? Let’s reunite it.
          </h1>
          <p className="mt-4 max-w-lg text-muted">
            A campus desk for reports, matches, and claims — with private verification so a public
            description is never enough to steal an item.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/report/lost" className="rounded-md bg-accent px-5 py-2.5 text-sm text-white">
              Report Lost Item
            </Link>
            <Link to="/report/found" className="rounded-md border border-line bg-card px-5 py-2.5 text-sm">
              Report Found Item
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-sm font-medium">Anti-fraud verification</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Identifying marks, contents, wallpapers, and other ownership details stay off public
            listings. When someone claims an item, they must describe those private facts. Low-confidence
            answers go to a moderator.
          </p>
          <div className="mt-5 rounded-lg bg-paper px-4 py-3 text-sm">
            Public: “Black wallet near the library.”
            <br />
            Private: exact cards, cash amount, hidden scratch — never shown.
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-xl border border-line bg-card p-5">
            <Icon size={18} className="text-accent" />
            <h2 className="mt-3 font-serif text-xl">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
