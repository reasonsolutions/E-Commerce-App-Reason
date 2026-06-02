import { ToastVariant } from '../components/ui/Toast';

export type ToastEvent = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type Listener = (event: ToastEvent) => void;

const listeners: Listener[] = [];
let counter = 0;

export const toastEmitter = {
  emit(variant: ToastVariant, title: string, description?: string) {
    const event: ToastEvent = { id: String(++counter), variant, title, description };
    listeners.forEach(fn => fn(event));
  },
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },
};
