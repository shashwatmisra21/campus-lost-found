import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'}`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={user ? '/dashboard' : '/'} className="font-serif text-lg tracking-tight">
            Campus Lost & Found
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/browse" className={linkClass}>
              Browse
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/report/lost" className={linkClass}>
                  Report lost
                </NavLink>
                <NavLink to="/report/found" className={linkClass}>
                  Report found
                </NavLink>
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <Link to="/profile" className="hidden text-muted sm:block">
                  {user.name}
                </Link>
                <button
                  type="button"
                  className="rounded-md border border-line px-3 py-1.5"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-md bg-accent px-3 py-1.5 text-white">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 page-enter">
        <Outlet />
      </main>
    </div>
  );
}
