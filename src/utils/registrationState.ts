let _pendingPassword: string | null = null;
let _expiryTimer: ReturnType<typeof setTimeout> | null = null;

const PASSWORD_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setPendingPassword(password: string | null): void {
  if (_expiryTimer) {
    clearTimeout(_expiryTimer);
    _expiryTimer = null;
  }
  _pendingPassword = password;
  if (password !== null) {
    _expiryTimer = setTimeout(() => {
      _pendingPassword = null;
      _expiryTimer = null;
    }, PASSWORD_TTL_MS);
  }
}

export function getPendingPassword(): string | null {
  return _pendingPassword;
}

export function clearPendingPassword(): void {
  setPendingPassword(null);
}
