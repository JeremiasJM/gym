import useSWR, { type SWRConfiguration } from 'swr';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

function useApiGet<T>(endpoint: string | null, config?: SWRConfiguration) {
  const token = useAuthStore((s) => s.token);

  return useSWR<T>(
    endpoint ? [endpoint, token] : null,
    ([url]: [string]) => api<T>(url, { token: token! }),
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
}

export { useApiGet };
