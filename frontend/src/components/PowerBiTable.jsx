import { useMemo, useState } from "react";
import EmptyStatePanel from "./common/EmptyStatePanel";
import { formatValueByKey } from "../services/formatters";

const compareValues = (left, right) => {
  const leftValue = left ?? "";
  const rightValue = right ?? "";

  return String(leftValue).localeCompare(String(rightValue), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
};

const PowerBiTable = ({
  columns,
  emptyMessage,
  emptyVariant = "empty-search",
  maxVisibleRows = 10,
  rows,
  rowsPerPageOptions = [10, 25, 50],
  sortable = true,
}) => {
  const [sortConfig, setSortConfig] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] || 10);

  const sortedRows = useMemo(() => {
    if (!sortConfig || !sortable) {
      return rows;
    }

    const column = columns.find((item) => item.key === sortConfig.key);
    const accessor = column?.sortAccessor;

    return [...rows].sort((left, right) => {
      const leftValue = accessor ? accessor(left) : left[sortConfig.key];
      const rightValue = accessor ? accessor(right) : right[sortConfig.key];
      const result = compareValues(leftValue, rightValue);
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [columns, rows, sortConfig, sortable]);

  if (!rows.length) {
    return (
      <EmptyStatePanel
        animation={emptyVariant}
        message={emptyMessage}
        title="Nenhum resultado disponivel"
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = sortedRows.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );
  const isScrollable = paginatedRows.length > maxVisibleRows;
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - safePage) <= 1,
  );

  const handleSort = (key) => {
    if (!sortable) {
      return;
    }

    setPage(1);
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      return null;
    });
  };

  return (
    <div className="powerbi-table-wrapper">
      <div
        className={`powerbi-table-shell ${
          isScrollable ? "powerbi-table-shell--scrollable" : ""
        }`}
      >
        <table className="powerbi-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.className || ""}
                  onClick={() => handleSort(column.key)}
                  role={sortable ? "button" : undefined}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <span className="powerbi-table__head">
                    {column.label}
                    {sortable && sortConfig?.key === column.key ? (
                      <small>{sortConfig.direction === "asc" ? "ASC" : "DESC"}</small>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr key={row.id || `${rowIndex}-${columns[0].key}`}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className || ""}>
                    {column.render
                      ? column.render(row)
                      : formatValueByKey(column.key, row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="powerbi-table__footer">
        <span>
          Exibindo {Math.min((safePage - 1) * rowsPerPage + 1, sortedRows.length)} a{" "}
          {Math.min(safePage * rowsPerPage, sortedRows.length)} de {sortedRows.length} registros
        </span>

        <div className="powerbi-table__footer-actions">
          <label className="powerbi-table__rows">
            <span>Linhas por pagina:</span>
            <select
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
              value={rowsPerPage}
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="powerbi-table__pagination">
            <button
              className="text-button"
              disabled={safePage === 1}
              onClick={() => setPage(1)}
              type="button"
            >
              {"<<"}
            </button>
            <button
              className="text-button"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              {"<"}
            </button>
            {visiblePages.map((pageNumber, index) => {
              const previous = visiblePages[index - 1];
              const showGap = previous && pageNumber - previous > 1;

              return (
                <span className="powerbi-table__page-group" key={pageNumber}>
                  {showGap ? <span className="powerbi-table__gap">...</span> : null}
                  <button
                    className={`powerbi-table__page-button ${
                      pageNumber === safePage ? "is-active" : ""
                    }`}
                    onClick={() => setPage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}
            <button
              className="text-button"
              disabled={safePage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              {">"}
            </button>
            <button
              className="text-button"
              disabled={safePage === totalPages}
              onClick={() => setPage(totalPages)}
              type="button"
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerBiTable;
