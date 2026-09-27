import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLastButtons?: boolean;
  pageButtonLimit?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  className,
  showFirstLastButtons = true,
  pageButtonLimit = 5, // Must be an odd number to center around current page
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Ensure current page is within valid bounds
  const validatedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== validatedCurrentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxButtons = Math.max(1, pageButtonLimit); // Ensure at least 1 button
    const halfLimit = Math.floor(maxButtons / 2);

    let startPage = Math.max(1, validatedCurrentPage - halfLimit);
    let endPage = Math.min(totalPages, validatedCurrentPage + halfLimit);

    // Adjust start/end to ensure `maxButtons` are shown if possible
    if (endPage - startPage + 1 < maxButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxButtons - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxButtons + 1);
      }
    }

    // Always show first page if not already in range and needed for ellipsis
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("ellipsis");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page if not already in range and needed for ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages.map((page, index) =>
      page === "ellipsis" ? (
        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground select-none" aria-hidden="true">
          ...
        </span>
      ) : (
        <Button
          key={page}
          variant={page === validatedCurrentPage ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-8 w-8 text-sm font-semibold transition-colors duration-150",
            page === validatedCurrentPage
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => handlePageChange(page as number)}
          disabled={page === validatedCurrentPage}
          aria-current={page === validatedCurrentPage ? "page" : undefined}
          aria-label={`Go to page ${page}`}
        >
          {page}
        </Button>
      )
    );
  };

  const isFirstPage = validatedCurrentPage === 1;
  const isLastPage = validatedCurrentPage === totalPages;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 sm:px-4 text-muted-foreground text-sm",
        className
      )}
      role="navigation"
      aria-label="Pagination"
    >
      <div className="text-center sm:text-left font-medium">
        Showing {totalItems === 0 ? 0 : (validatedCurrentPage - 1) * itemsPerPage + 1} -{" "}
        {Math.min(validatedCurrentPage * itemsPerPage, totalItems)} of {totalItems} results
      </div>
      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap justify-center">
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
            onClick={() => handlePageChange(1)}
            disabled={isFirstPage}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">First page</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => handlePageChange(validatedCurrentPage - 1)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </Button>

        {renderPageNumbers()}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => handlePageChange(validatedCurrentPage + 1)}
          disabled={isLastPage}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </Button>
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
            onClick={() => handlePageChange(totalPages)}
            disabled={isLastPage}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Last page</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
