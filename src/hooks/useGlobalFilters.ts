
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

export interface GlobalFilters {
  dateFrom: string;
  dateTo: string;
  activationId?: string;
  zoneId?: string;
}

export function useGlobalFilters() {
  const router = useRouter();

  const filters = useMemo<GlobalFilters>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      dateFrom: (router.query.dateFrom as string) || sevenDaysAgo.toISOString().split("T")[0],
      dateTo: (router.query.dateTo as string) || now.toISOString().split("T")[0],
      activationId: router.query.activationId as string | undefined,
      zoneId: router.query.zoneId as string | undefined,
    };
  }, [router.query]);

  const updateFilters = useCallback(
    (updates: Partial<GlobalFilters>) => {
      const newQuery = { ...router.query };

      if (updates.dateFrom !== undefined) newQuery.dateFrom = updates.dateFrom;
      if (updates.dateTo !== undefined) newQuery.dateTo = updates.dateTo;
      if (updates.activationId !== undefined) {
        if (updates.activationId) {
          newQuery.activationId = updates.activationId;
        } else {
          delete newQuery.activationId;
        }
      }
      if (updates.zoneId !== undefined) {
        if (updates.zoneId) {
          newQuery.zoneId = updates.zoneId;
        } else {
          delete newQuery.zoneId;
        }
      }

      router.push(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  const clearFilters = useCallback(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    router.push(
      {
        pathname: router.pathname,
        query: {
          dateFrom: sevenDaysAgo.toISOString().split("T")[0],
          dateTo: now.toISOString().split("T")[0],
        },
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}
