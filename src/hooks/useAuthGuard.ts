import { useState, useCallback } from 'react';
import { isLoggedIn } from '../utils/auth';

export function useAuthGuard() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const guard = useCallback(async (action: () => void) => {
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      action();
    } else {
      setShowLoginPrompt(true);
    }
  }, []);

  const dismissLoginPrompt = useCallback(() => setShowLoginPrompt(false), []);

  return { guard, showLoginPrompt, dismissLoginPrompt };
}
