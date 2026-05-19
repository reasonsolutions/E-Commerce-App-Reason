import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { UserSession } from '../api/interfaces';
import { adaptSession } from '../api/adapters/sessionAdapter';

export function useSession(): UserSession | null {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        const adapted = adaptSession(parsed);
        if (!cancelled) setSession(adapted);
      } catch {
        // storage or parse failure — leave session null
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return session;
}
