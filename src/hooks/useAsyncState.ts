import { useState, useCallback, useRef } from 'react';
import { userFacingMessage } from '../api/apiError';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

interface UseAsyncStateResult<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
  loading: boolean;
  isError: boolean;
  isSuccess: boolean;
  /**
   * Runs the provided async function and manages loading/error/success state.
   * Cancellation-safe: state is never set if `cancelled.current` is true when
   * the operation resolves. Pass the same ref object from a useFocusEffect or
   * useEffect cleanup to wire cancellation automatically.
   *
   * Example:
   *   const { run, loading, error, data } = useAsyncState<Order[]>([]);
   *   useFocusEffect(useCallback(() => {
   *     const cancelled = { current: false };
   *     run(() => fetchOrders(), cancelled);
   *     return () => { cancelled.current = true; };
   *   }, []));
   */
  run: (
    fn: () => Promise<T>,
    cancelled?: { current: boolean },
  ) => Promise<void>;
  reset: () => void;
}

export function useAsyncState<T>(
  initialData: T | null = null,
): UseAsyncStateResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: null,
  });

  // Internal cancelled ref used when caller does not supply one
  const internalCancelledRef = useRef(false);

  const run = useCallback(
    async (fn: () => Promise<T>, cancelled?: { current: boolean }) => {
      const guard = cancelled ?? internalCancelledRef;

      const set = (patch: Partial<AsyncState<T>>) => {
        if (!guard.current) setState(prev => ({ ...prev, ...patch }));
      };

      set({ status: 'loading', error: null });

      try {
        const result = await fn();
        set({ status: 'success', data: result, error: null });
      } catch (err) {
        set({ status: 'error', error: userFacingMessage(err), data: initialData });
      }
    },
    [initialData],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', data: initialData, error: null });
  }, [initialData]);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    loading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    run,
    reset,
  };
}
