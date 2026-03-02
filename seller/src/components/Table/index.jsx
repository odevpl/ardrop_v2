import './table.scss'

const Table = ({ config, data }) => {
  const safeConfig = Array.isArray(config) ? config : []
  const safeData = Array.isArray(data) ? data : []

  const renderCellValue = (column, row, collection) => {
    if (typeof column.onRender === 'function') {
      return column.onRender(row, collection, column.key)
    }

    return row[column.key] ?? '-'
  }

  return (
    <div className="tableCard">
      <table className="table">
        <thead>
          <tr>
            {safeConfig.map((column) => (
              <th key={column.key}>{column.title ?? column.label ?? column.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td className="tableEmpty" colSpan={Math.max(safeConfig.length, 1)}>
                Brak danych
              </td>
            </tr>
          ) : (
            safeData.map((row, index) => {
            const rowId = row.id ?? row.sku ?? row.nip ?? `${index}-${row.email ?? 'row'}`

            return (
              <tr key={rowId}>
                {safeConfig.map((column) => {
                  const isClickable = typeof column.onClick === 'function'
                  const value = renderCellValue(column, row, safeData)

                  return (
                    <td
                      key={column.key}
                      className={isClickable ? 'tableCell tableCellClickable' : 'tableCell'}
                      onClick={isClickable ? () => column.onClick(value, row) : undefined}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
