export default function EmptyState({ title, body, children }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <h3 className="font-serif text-xl">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
