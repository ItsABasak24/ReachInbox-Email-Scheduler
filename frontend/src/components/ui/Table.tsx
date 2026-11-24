import React from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (item: T) => void;
  skeletonRowCount?: number;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  onRowClick,
  skeletonRowCount = 5,
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-dark-800 bg-dark-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-dark-200">
          <thead className="bg-dark-950/60 text-xs uppercase tracking-wider text-dark-400 border-b border-dark-800">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3.5 font-semibold ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/60">
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-6 py-4">
                      <div className="h-4 bg-dark-800 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-dark-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor
                  ? keyExtractor(item, index)
                  : ((item as any).id ?? index);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors duration-150 hover:bg-dark-800/40 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-6 py-4 whitespace-nowrap text-dark-200 ${
                          col.className || ''
                        }`}
                      >
                        {col.render
                          ? col.render(item, index)
                          : col.accessor
                          ? (item[col.accessor] as unknown as React.ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
