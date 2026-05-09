'use client'

import React, { useMemo, ReactNode } from 'react'
import {
  Skeleton,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectCell,
  TableSelectHeader,
} from '@/lib/pax'
import { Filter } from 'lucide-react'
import { ErrorState } from '@/components/ui/ErrorState'

interface Column<T = any> {
  header: string
  key?: string
  width?: string
  className?: string
  render?: (row: T) => ReactNode
}

interface PaginationConfig {
  before?: string
  after?: string
  hasMore?: boolean
  hasPrevious?: boolean
  onPageChange: (type: 'before' | 'after', cursorValue: string) => void
}

interface EmptyState {
  title: string
  description: string
  icon: ReactNode
  action?: ReactNode
}

interface DataTableProps<T = any> {
  data?: T[]
  columns?: Column<T>[]
  isLoading?: boolean
  error?: any
  onRetry?: () => void
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onRowClick?: (row: T) => void
  pagination?: PaginationConfig
  emptyState?: EmptyState
  resourceName?: string
  idField?: string
}

/**
 * DataTable - A highly reusable, premium data grid component.
 *
 * Supports:
 * - Declarative column definitions with custom rendering
 * - Row selection (with Select All + indeterminate support)
 * - Async states (Loading skeletons, Error with retry, Empty state)
 * - Standardized ID-Based cursor pagination
 */
export function DataTable<T extends Record<string, any>>({
  data = [],
  columns = [],
  isLoading = false,
  error = null,
  onRetry = () => { },
  selectable = true,
  selectedIds = new Set(),
  onSelectionChange = () => { },
  onRowClick = () => { },
  pagination = { hasMore: false, hasPrevious: false, onPageChange: () => { } },
  emptyState = {
    title: 'No results found',
    description: 'Try adjusting your filters or search terms.',
    icon: <Filter width={20} height={20} />
  },
  resourceName = 'results',
  idField = 'id'
}: DataTableProps<T>) {
  const allSelected = useMemo(() => {
    return data.length > 0 && selectedIds.size === data.length
  }, [data, selectedIds])

  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(data.map(item => item[idField])))
    } else {
      onSelectionChange(new Set())
    }
  }

  const toggleSelect = (checked: boolean, id: string) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    onSelectionChange(next)
  }

  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden transition-all duration-300 [&_tbody_tr:last-child]:border-0">
      <Table loading={isLoading}>
        <TableHeader>
          <tr className="border-b border-border-primary-light bg-surface-secondary">
            {selectable && (
              <TableSelectHeader
                isSelected={allSelected}
                isIndeterminate={someSelected}
                onSelect={toggleSelectAll}
                className="pl-4 pr-1 w-12 min-w-12 max-w-12"
              />
            )}
            {columns.map((col, idx) => {
              // If the column provides its own display class (contains 'hidden'), skip the
              // default 'hidden md:table-cell' so the column-level class wins uncontested.
              const baseDisplay = col.className?.includes('hidden') ? '' : 'hidden md:table-cell'
              return (
                <TableHead
                  key={idx}
                  className={`text-xs font-medium text-content-tertiary text-left ${baseDisplay} ${col.className || ''}`.trim()}
                  style={{
                    ...(idx === 0 && selectable ? { paddingLeft: 0 } : {}),
                    ...(col.width ? { width: col.width } : {}),
                  }}
                >
                  {col.header}
                </TableHead>
              )
            })}
          </tr>
        </TableHeader>
        <TableBody>
          {error ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <div className="py-12">
                  <ErrorState message={error} onRetry={onRetry} />
                </div>
              </td>
            </tr>
          ) : isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                {selectable && (
                  <td className="pl-4 pr-1 py-2 align-middle"><Skeleton className="h-4 w-4 rounded" /></td>
                )}
                {columns.map((col, j) => (
                  <td key={j} className={`${j === 0 ? (selectable ? 'pl-0 pr-4' : 'pl-4 pr-4') : 'px-4'} py-2 align-middle ${col.className || ''}`.trim()}>
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-feedback-information-light flex items-center justify-center text-content-brand">
                    {emptyState.icon}
                  </div>
                  <p className="mt-6 text-sm font-medium text-content-primary">{emptyState.title}</p>
                  <p className="mt-2 text-xs text-content-tertiary max-w-xs">{emptyState.description}</p>
                  {emptyState.action && (
                    <div className="mt-4">{emptyState.action}</div>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <TableRow
                key={row[idField]}
                aria-selected={selectable && selectedIds.has(row[idField])}
                className="cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return
                  onRowClick(row)
                }}
              >
                {selectable && (
                  <TableSelectCell
                    isSelected={selectedIds.has(row[idField])}
                    onSelectionChange={(checked) => toggleSelect(checked, row[idField])}
                    className="pl-4 pr-1 w-12 min-w-12 max-w-12 group-hover:bg-surface-secondary"
                  />
                )}
                {columns.map((col, idx) => (
                  <td key={idx} className={`${idx === 0 ? (selectable ? 'pl-0 pr-4' : 'pl-4 pr-4') : 'px-4'} py-2 align-middle text-left group-hover:bg-surface-secondary ${col.className || ''}`}>
                    {col.render ? col.render(row) : (
                      // PAX spec: Table / Cell - Web — text-content-primary
                      <div className="text-sm text-content-primary">
                        {col.key ? row[col.key] : ''}
                      </div>
                    )}
                  </td>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      {(pagination.hasMore || pagination.hasPrevious) && (
        <div className="px-4 py-3 border-t border-border-primary-light flex items-center justify-center gap-6">
          <button
            onClick={() => pagination.onPageChange('after', data[0]?.[idField])}
            disabled={!pagination.hasPrevious}
            className="text-sm text-content-tertiary disabled:opacity-40 disabled:cursor-not-allowed hover:text-content-primary transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => pagination.onPageChange('before', data[data.length - 1]?.[idField])}
            disabled={!pagination.hasMore}
            className="text-sm font-semibold text-content-primary disabled:opacity-40 disabled:cursor-not-allowed hover:text-content-secondary transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
