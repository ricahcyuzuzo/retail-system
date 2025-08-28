import React from 'react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const goto = (p: number) => {
    const np = Math.min(totalPages, Math.max(1, p));
    if (np !== page) onPageChange(np);
  };

  // Build a compact page range (1, ..., n) with ellipsis
  const buildPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const add = (n: number) => pages.push(n);
    pages.push(1);
    if (page > 4) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) add(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span>
      </div>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => goto(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </button>
          {buildPages().map((p, idx) =>
            p === '...'
              ? (
                  <span key={idx} className="px-2 text-gray-400">
                    ...
                  </span>
                )
              : (
                  <button
                    key={p}
                    className={`px-3 py-1 border rounded text-sm ${
                      p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => goto(p as number)}
                  >
                    {p}
                  </button>
                )
          )}
          <button
            className="px-2 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => goto(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
