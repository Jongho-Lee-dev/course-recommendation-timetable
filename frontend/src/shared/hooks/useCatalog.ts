import { useQuery } from "@tanstack/react-query";
import { fetchCatalog } from "../api/catalog";

export function useCatalog() {
  return useQuery({
    queryKey: ["course-catalog"],
    queryFn: ({ signal }) => fetchCatalog(signal),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
