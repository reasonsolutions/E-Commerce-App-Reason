let _pendingPassword: string | null = null;

export function setPendingPassword(password: string | null): void {
  _pendingPassword = password;
}

export function getPendingPassword(): string | null {
  return _pendingPassword;
}
