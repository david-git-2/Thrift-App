import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { supabase } from "../boot/supabase";
import { thriftQueryKeys } from "../queryKeys/thriftQueryKeys";
import type { ThriftCurrency } from "./useThriftCurrency";

export async function fetchThriftCurrencies(): Promise<ThriftCurrency[]> {
  const { data, error } = await supabase
    .from("global_currencies")
    .select("id, name, code, symbol")
    .eq("is_active", true)
    .order("code", { ascending: true });

  if (error) throw error;
  return (data || []) as ThriftCurrency[];
}

export function useThriftCurrenciesQuery() {
  return useQuery({
    queryKey: thriftQueryKeys.currencies(),
    queryFn: fetchThriftCurrencies,
    staleTime: 15 * 60 * 1000
  });
}

export function useCurrencyById(id: Ref<number | null | undefined>) {
  const { data: currencies } = useThriftCurrenciesQuery();
  return computed(() =>
    id.value == null
      ? undefined
      : currencies.value?.find(c => c.id === id.value)
  );
}
