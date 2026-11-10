import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

// Wraps a group of routes. Not logged in -> /login. Wrong role -> own dashboard.
// This only controls what the BROWSER shows; the server enforces the same rules on every API call.
export function RequireRole({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-emerald">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

export const homeFor = (user) => (user?.role === 'ADMIN' ? '/admin' : '/app');

// Login/Register pages: if already signed in, skip them.
export function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}
