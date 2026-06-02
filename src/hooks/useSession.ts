import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import type { LoggedInCustomerInterface } from '../api/interfaces';

export function useSession(): LoggedInCustomerInterface | null {
  const [session, setSession] = useState<LoggedInCustomerInterface | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (cancelled || !raw) return;
        const parsed: LoggedInCustomerInterface = JSON.parse(raw);
        if (!cancelled && parsed?.CustomerProfileCode) setSession(parsed);
      } catch {
        // storage or parse failure — leave session null
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return session;
}
