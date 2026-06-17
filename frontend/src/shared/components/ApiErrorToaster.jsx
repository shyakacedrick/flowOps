// ============================================================================
//  ApiErrorToaster — surface global API failures as toasts
// ----------------------------------------------------------------------------
//  Listens for two window events dispatched by services/api.js:
//
//    flowops:auth-expired  — refresh failed, user must sign in again
//    flowops:server-error  — backend returned 5xx
//
//  Both are throttled so a burst of failures (e.g. dashboard parallel-loading
//  five widgets that all hit a 503) shows ONE toast, not five.
//
//  Mount once near the top of the provider stack, inside <ToastProvider>.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/components/ToastProvider.jsx';

// Don't fire the same toast type more than once per this window.
const THROTTLE_MS = 4000;

export default function ApiErrorToaster() {
  const toast = useToast();
  const lastAt = useRef({ auth: 0, server: 0 });

  useEffect(() => {
    const onExpired = () => {
      const now = Date.now();
      if (now - lastAt.current.auth < THROTTLE_MS) return;
      lastAt.current.auth = now;
      toast.info('Your session expired. Please sign in again.');
    };

    const onServerError = (e) => {
      const now = Date.now();
      if (now - lastAt.current.server < THROTTLE_MS) return;
      lastAt.current.server = now;
      const status = e?.detail?.status;
      const msg =
        status === 503
          ? 'The server is starting up — please retry in a moment.'
          : 'We\u2019re having trouble reaching the server. Please try again.';
      toast.error(msg);
    };

    window.addEventListener('flowops:auth-expired', onExpired);
    window.addEventListener('flowops:server-error', onServerError);
    return () => {
      window.removeEventListener('flowops:auth-expired', onExpired);
      window.removeEventListener('flowops:server-error', onServerError);
    };
  }, [toast]);

  return null;
}
