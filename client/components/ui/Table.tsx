import React from "react";
import { cn } from "@/lib/utils";
import Spinner from "./Spinner";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

const Table = <T extends { id: string | number }>({
  columns,
  data,
  loading,
  emptyMessage = "No data available",
  onRowClick,
}: TableProps<T>) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#2a2a2a] text-muted uppercase text-xs font-bold">
          <tr>
            {columns.map((column, idx) => (
              <th key={idx} className={cn("px-6 py-4", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-6 py-4">
                    <div className="h-4 bg-surface rounded w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "hover:bg-[#252525] transition-colors cursor-default",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column, cIdx) => (
                  <td key={cIdx} className={cn("px-6 py-4 text-sm", column.className)}>
                    {typeof column.accessor === "function"
                      ? column.accessor(item)
                      : (item[column.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
