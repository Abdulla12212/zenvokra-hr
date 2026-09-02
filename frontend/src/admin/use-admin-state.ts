import { useContext } from 'react';

import { AdminStateContext, type AdminState } from './admin-context';

export function useAdminState(): AdminState {
  const state = useContext(AdminStateContext);

  if (!state) {
    throw new Error('useAdminState must be used inside AdminStateProvider.');
  }

  return state;
}
