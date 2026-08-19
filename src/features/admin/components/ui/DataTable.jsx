import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Search } from "lucide-react";
import Skeleton from "../../../../components/ui/Skeleton/Skeleton";
import EmptyState from "../../../../components/ui/EmptyState/EmptyState";
import "./DataTable.css";

/**
 * columns: [{ key, label, sortable, align, render(row), sortValue(row), width }]
 * rows: array of objects
 * getRowKey(row, index) -> stable key
 * searchable: bool (client-side search over searchKeys or all string values)
 */
export default function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  loading = false,
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  searchAriaLabel,
  searchKeys = null,
  pageSize = 10,
  emptyState = null,
  toolbarExtra = null,
  toolbarSummary = null,
  density = "comfortable",
  getRowClassName,
  initialSort = null,
  rowDraggable = false,
  draggedRowKey = null,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
  paginationMode = "client",
  page: serverPage = 0,
  totalElements,
  onPageChange,
}) {
  const isServer = paginationMode === "server";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  // External rows changed (e.g. a filter in toolbarExtra swapped the rows prop):
  // go back to page 1. Adjust state during render per React docs — sort-order
  // changes keep the same length and are unaffected.
  const [prevRowsLength, setPrevRowsLength] = useState(rows.length);
  if (!isServer && rows.length !== prevRowsLength) {
    setPrevRowsLength(rows.length);
    setPage(1);
  }

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const keys = searchKeys || Object.keys(row);
      return keys.some((k) => {
        const v = row[k];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
  }, [rows, query, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const valueOf = col.sortValue || ((row) => row[sort.key]);
    const dir = sort.dir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "vi") * dir;
    });
  }, [filtered, sort, columns]);

  const serverTotal = Number(totalElements) || 0;
  const totalPages = isServer
    ? Math.max(1, Math.ceil(serverTotal / pageSize))
    : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = isServer
    ? Math.min(Math.max(0, serverPage) + 1, totalPages)
    : Math.min(page, totalPages);
  const paged = useMemo(() => {
    if (isServer) return sorted;
    return sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  }, [isServer, sorted, safePage, pageSize]);

  const goToPage = (nextPage) => {
    if (isServer) {
      onPageChange?.(nextPage - 1);
      return;
    }
    setPage(nextPage);
  };

  const toggleSort = (key) => {
    if (!isServer) setPage(1);
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const onSearch = (e) => {
    setQuery(e.target.value);
    if (!isServer) setPage(1);
  };

  const countTotal = isServer ? serverTotal : sorted.length;
  const showPager = !loading && countTotal > pageSize;
  const rangeStart = countTotal === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, countTotal);

  const tableClassName = `data-table data-table--${density}`;

  return (
    <div className={tableClassName}>
      {(searchable || toolbarSummary || toolbarExtra) && (
        <div className="data-table__toolbar">
          {searchable && (
            <div className="data-table__search">
              <Search size={16} />
              <input
                type="text"
                value={query}
                onChange={onSearch}
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel || searchPlaceholder}
              />
            </div>
          )}
          {toolbarSummary && <div className="data-table__summary">{toolbarSummary}</div>}
          {toolbarExtra && <div className="data-table__toolbar-extra">{toolbarExtra}</div>}
        </div>
      )}

      <div className="data-table__scroll">
        <table className="data-table__table">
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align || "left" }}
                    className={col.sortable ? "is-sortable" : ""}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    tabIndex={col.sortable ? 0 : undefined}
                    role={col.sortable ? "button" : undefined}
                    aria-sort={col.sortable ? ariaSort : undefined}
                    onKeyDown={
                      col.sortable
                        ? (event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            if (event.key === " ") event.preventDefault();
                            toggleSort(col.key);
                          }
                        : undefined
                    }
                  >
                    <span className="th-inner">
                      {col.label}
                      {col.sortable && (
                        <span className="th-sort">
                          {!active && <ChevronsUpDown size={14} />}
                          {active && sort.dir === "asc" && <ChevronUp size={14} />}
                          {active && sort.dir === "desc" && <ChevronDown size={14} />}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: pageSize }).map((_, r) => (
                <tr key={`sk-${r}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <Skeleton height={14} width={`${60 + ((r + col.key.length) % 30)}%`} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              paged.map((row, index) => {
                const rowKey = getRowKey ? getRowKey(row, index) : index;
                const baseClassName = getRowClassName ? getRowClassName(row, index) : "";
                const rowClassName = [baseClassName, rowDraggable ? "is-draggable" : "", draggedRowKey === rowKey ? "is-dragging" : ""]
                  .filter(Boolean)
                  .join(" ");
                return (
                <tr
                  key={rowKey}
                  className={rowClassName || undefined}
                  draggable={rowDraggable}
                  onDragStart={(event) => onRowDragStart?.(event, row, index)}
                  onDragOver={(event) => onRowDragOver?.(event, row, index)}
                  onDrop={(event) => onRowDrop?.(event, row, index)}
                  onDragEnd={(event) => onRowDragEnd?.(event, row, index)}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || "left" }}>
                      {col.render ? col.render(row, index) : row[col.key] ?? "Chưa có"}
                    </td>
                  ))}
                </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && paged.length === 0 && (
          <div className="data-table__empty">
            {emptyState || <EmptyState title="Không có dữ liệu phù hợp" />}
          </div>
        )}
      </div>

      {showPager && (
        <div className="data-table__pagination">
          <span className="data-table__count">
            {rangeStart}–{rangeEnd} / {countTotal}
          </span>
          <div className="data-table__pager">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => goToPage(Math.max(1, safePage - 1))}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="data-table__page">
              Trang {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
