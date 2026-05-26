import { toastEmitter } from '../utils/toastEmitter';

type ShowOptions = { title: string; description?: string };

export function useAppToast() {
  return {
    success: ({ title, description }: ShowOptions) =>
      toastEmitter.emit('success', title, description),
    error: ({ title, description }: ShowOptions) =>
      toastEmitter.emit('error', title, description),
    warning: ({ title, description }: ShowOptions) =>
      toastEmitter.emit('warning', title, description),
    info: ({ title, description }: ShowOptions) =>
      toastEmitter.emit('info', title, description),
  };
}
