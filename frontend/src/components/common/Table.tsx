import React from 'react';

export interface TableColumn<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
}

export function Table<T>({ data, columns, keyExtractor }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-slate-50/80 transition-colors">
              {columns.map((col, idx) => (
                <td key={idx} className={`px-4 py-3 ${col.className || ''}`}>{col.accessor(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
