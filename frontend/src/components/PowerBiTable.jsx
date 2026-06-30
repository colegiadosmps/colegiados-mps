import { formatValueByKey } from "../services/formatters";

const PowerBiTable = ({ columns, emptyMessage, maxVisibleRows = 4, rows }) => {
  if (!rows.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const isScrollable = rows.length > maxVisibleRows;

  return (
    <div className={`powerbi-table-shell ${isScrollable ? "powerbi-table-shell--scrollable" : ""}`}>
      <table className="powerbi-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.className || ""}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || `${rowIndex}-${columns[0].key}`}>
              {columns.map((column) => (
                <td key={column.key} className={column.className || ""}>
                  {column.render ? column.render(row) : formatValueByKey(column.key, row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PowerBiTable;
