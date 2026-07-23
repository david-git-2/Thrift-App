import { QueryClient } from "@tanstack/vue-query";

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false // Mobile optimization: avoid refetch on app resume by default
    },
    mutations: {
      retry: 0
    }
  }
});
