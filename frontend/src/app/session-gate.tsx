import { Navigate, Outlet, useLocation } from 'react-router';

import { hasContinuedSession } from '@/lib/session-stub';

/**
 * Continue is a session stub. It does not authenticate and does not choose a tenant.
 */
export function SessionGate() {
  const location = useLocation();
  const continued = hasContinuedSession();
  const onContinue = location.pathname === '/continue';

  if (!continued && !onContinue) {
    return <Navigate to="/continue" replace />;
  }

  if (continued && onContinue) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
