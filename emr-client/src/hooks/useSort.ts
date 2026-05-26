import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc";

export interface UseSortOptions<T> {
  defaultField?: string | null;
  defaultOrder?: SortOrder;
  customAccessors?: {
    [key: string]: (item: T) => any;
  };
}

export function useSort<T>(
  items: T[],
  options: UseSortOptions<T> = {}
) {
  const { defaultField = null, defaultOrder = "asc", customAccessors = {} } = options;
  const [sortField, setSortField] = useState<string | null>(defaultField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a: T, b: T) => {
      let valA: any = "";
      let valB: any = "";

      // 1. Check custom accessors first
      if (customAccessors[sortField]) {
        valA = customAccessors[sortField](a);
        valB = customAccessors[sortField](b);
      } else {
        // 2. Default property access (supports simple top-level fields)
        valA = (a as any)[sortField];
        valB = (b as any)[sortField];
      }

      // Handle null/undefined values safely
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";

      // 3. Compare values
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      // Convert to string for locale comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortOrder, customAccessors]);

  return {
    sortField,
    sortOrder,
    handleSort,
    sortedItems,
    setSortField,
    setSortOrder,
  };
}
