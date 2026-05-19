import { toast as sonnerToast } from 'sonner-native';

type ShowOptions = { title: string; description?: string };

export function useAppToast() {
  return {
    success: ({ title, description }: ShowOptions) =>
      sonnerToast.success(title, { description }),
    error: ({ title, description }: ShowOptions) =>
      sonnerToast.error(title, { description }),
    warning: ({ title, description }: ShowOptions) =>
      sonnerToast.warning(title, { description }),
    info: ({ title, description }: ShowOptions) =>
      sonnerToast(title, { description }),
  };
}
