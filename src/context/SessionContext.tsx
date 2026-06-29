import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';

interface UserData {
  CustomerProfileCode: number;
  CustomerName?:       string;
  EmailID?:            string;
  MobileNumber?:       string | number;
  [key: string]:       unknown;
}

interface SessionState {
  userData:    UserData | null;
  profileCode: number | null;
  refresh:     () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  userData:    null,
  profileCode: null,
  refresh:     async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      setUserData(raw ? (JSON.parse(raw) as UserData) : null);
    } catch {
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SessionContext.Provider
      value={{
        userData,
        profileCode: userData?.CustomerProfileCode ?? null,
        refresh:     load,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
