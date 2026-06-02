import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';

export function useProfileCode(): number | null {
  const [profileCode, setProfileCode] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(raw => {
      if (!raw) return;
      try {
        const user = JSON.parse(raw);
        if (user.CustomerProfileCode) setProfileCode(user.CustomerProfileCode);
      } catch {}
    });
  }, []);

  return profileCode;
}
