import React, { useState } from "react";
import { Pagination, type PaginationProps } from "./Pagination";

export { Pagination };
export type { PaginationProps };

export const ExampleUsage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 100;
  const itemsPerPage = 10;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = Array.from({ length: totalItems })
    .map((_, i) => `Item ${i + 1}`)
    .slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-4 p-8 bg-background border rounded-lg max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-foreground">Content for Current Page</h3>
      <div className="min-h-[150px] bg-muted/50 p-4 rounded-md">
        <p className="text-sm text-muted-foreground mb-2">
          Displaying items {startIndex + 1} to {endIndex} of {totalItems}.
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-foreground">
          {currentItems.map((item, index) => (
            <li key={index} className="text-sm p-1 border rounded-sm border-dashed text-center">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        className="mt-4"
        showFirstLastButtons={true}
        pageButtonLimit={5}
      />
    </div>
  );
};

export default ExampleUsage;

export function DemoOne() {
  return <ExampleUsage />;
}
