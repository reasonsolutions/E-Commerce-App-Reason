import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function resetToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
}
