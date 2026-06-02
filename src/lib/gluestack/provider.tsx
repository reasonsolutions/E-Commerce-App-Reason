import React from 'react';

// Gluestack UI v2 provider — NativeWind handles all styling at the Metro
// transform level via cssInterop registrations on each primitive. No styled-
// system runtime context is required.
export function GluestackUIProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
