import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1)
    return (
      <div className="flex justify-between items-center py-4">
        <p className="text-sm text-muted">
          Showing <span className="text-white font-medium">{startItem}</span>-
          <span className="text-white font-medium">{endItem}</span> of{" "}
          <span className="text-white font-medium">{totalItems}</span> results
        </p>
      </div>
    );

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
      <p className="text-sm text-muted">
        Showing <span className="text-white font-medium">{startItem}</span>-
        <span className="text-white font-medium">{endItem}</span> of{" "}
        <span className="text-white font-medium">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-border bg-surface hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-10 h-10 rounded-lg border transition-all duration-200 font-medium",
              currentPage === page
                ? "bg-primary border-primary text-white"
                : "border-border bg-surface hover:bg-[#2a2a2a] text-muted hover:text-white"
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-border bg-surface hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
