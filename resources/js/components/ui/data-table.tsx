import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
    id: string;
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    className?: string;
    emptyMessage?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    rowClassName?: (item: T) => string;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    onRowClick,
    isLoading = false,
    className,
    emptyMessage = 'No data available',
    sortField,
    sortDirection,
    onSort,
    rowClassName,
}: DataTableProps<T>) {
    const handleSort = (column: Column<T>) => {
        if (!column.sortable || !onSort) return;

        const id = column.id;
        const newDirection = sortField === id && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(id, newDirection);
    };

    const getSortIcon = (column: Column<T>) => {
        if (!column.sortable) return null;

        if (sortField === column.id) {
            return sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
            );
        }

        return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
    };

    return (
        <div className={cn("w-full overflow-auto", className)}>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                className={cn(
                                    "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                                    column.sortable && "cursor-pointer select-none",
                                    column.className
                                )}
                                onClick={() => column.sortable && handleSort(column)}
                            >
                                <div className="flex items-center">
                                    {column.header}
                                    {getSortIcon(column)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {isLoading ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex justify-center items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
                                    <span>Loading...</span>
                                </div>
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr
                                key={item.id}
                                className={cn(
                                    "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                    onRowClick && "cursor-pointer",
                                    rowClassName && rowClassName(item)
                                )}
                                onClick={() => onRowClick && onRowClick(item)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${item.id}-${column.id}`}
                                        className={cn(
                                            "px-4 py-3 text-sm text-gray-900 dark:text-gray-200",
                                            column.className
                                        )}
                                    >
                                        {column.cell
                                            ? column.cell(item)
                                            : column.accessorKey
                                                ? String(item[column.accessorKey] ?? '')
                                                : null}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
