import { Navigate, Outlet, useLocation } from 'react-router';

import { getSessionPersona, hasContinuedSession } from '@/lib/session-stub';

/**
 * Continue is a session stub. It does not authenticate and does not choose a tenant.
 * It only remembers whether this browser opened Employee or Admin.
 */
export function SessionGate() {
  const location = useLocation();
  const continued = hasContinuedSession();
  const persona = getSessionPersona();
  const onContinue = location.pathname === '/continue';
  const onAdmin = location.pathname.startsWith('/admin');

  if (!continued && !onContinue) {
    return <Navigate to="/continue" replace />;
  }

  if (continued && onContinue) {
    return <Navigate to={persona === 'admin' ? '/admin' : '/'} replace />;
  }

  if (continued && persona === 'admin' && !onAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (continued && persona === 'employee' && onAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
