import { Navigate, useLocation } from 'react-router-dom';
import { readUser } from '../services/api';
export function PublicPage({ children }) {
  const user = readUser();
  if (user?.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
  return children;
}
export default function RequireAuth({ children, roles }) {
  const user = readUser(); const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    return <section className="wrap section"><div className="notice error">Your account does not have permission to access this page.</div></section>;
  }
  return children;
}
