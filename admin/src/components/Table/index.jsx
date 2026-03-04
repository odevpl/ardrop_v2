import './table.scss'

const Table = ({
  config,
  data,
  onRowClick,
  searchValue = '',
  searchPlaceholder = 'Szukaj...',
  onSearchChange,
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}) => {
  const safeConfig = Array.isArray(config) ? config : []
  const safeData = Array.isArray(data) ? data : []
  const safeLimitOptions = Array.isArray(limitOptions) && limitOptions.length > 0 ? limitOptions : [10, 20, 50, 100]
  const paginationEnabled = Boolean(pagination && typeof onPageChange === 'function')
  const currentPage = pagination?.page ?? 1
  const totalPages = pagination?.totalPages ?? 1
  const currentLimit = pagination?.limit ?? safeLimitOptions[0]
  const total = pagination?.total ?? safeData.length
  const renderCellValue = (column, row, collection) => {
    if (typeof column.onRender === 'function') {
      return column.onRender(row, collection, column.key)
    }

    return row[column.key] ?? '-'
  }

  return (
    <div className="tableCard">
      {(typeof onSearchChange === 'function' || paginationEnabled) && (
        <div className="tableToolbar">
          {typeof onSearchChange === 'function' && (
            <input
              className="tableSearchInput"
              type="search"
              value={searchValue}
              placeholder={searchPlaceholder}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          )}

          {paginationEnabled && (
            <div className="tablePaginationInfo">
              <span>{`Strona ${currentPage} z ${Math.max(totalPages, 1)}`}</span>
              <span>{`Rekordy: ${total}`}</span>
            </div>
          )}
        </div>
      )}

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
                <tr
                  key={rowId}
                  className={typeof onRowClick === 'function' ? 'tableRowClickable' : undefined}
                  onClick={typeof onRowClick === 'function' ? () => onRowClick(row) : undefined}
                >
                  {safeConfig.map((column) => {
                    const isClickable = typeof column.onClick === 'function'
                    const value = renderCellValue(column, row, safeData)

                    return (
                      <td
                        key={column.key}
                        className={isClickable ? 'tableCell tableCellClickable' : 'tableCell'}
                        onClick={
                          isClickable
                            ? (event) => {
                                event.stopPropagation()
                                column.onClick(value, row)
                              }
                            : undefined
                        }
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

      {paginationEnabled && (
        <div className="tablePagination">
          <div className="tablePaginationControls">
            <button
              type="button"
              className="tablePaginationButton"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Poprzednia
            </button>
            <button
              type="button"
              className="tablePaginationButton"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Nastepna
            </button>
            <div className="tableGoToPage">
              <select
                className="tablePageSelect"
                value={currentPage}
                onChange={(event) => onPageChange(Number(event.target.value))}
              >
                {Array.from({ length: Math.max(totalPages, 1) }, (_, index) => index + 1).map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {typeof onLimitChange === 'function' && (
            <label className="tableLimit">
              Na stronie:
              <select
                className="tableLimitSelect"
                value={currentLimit}
                onChange={(event) => onLimitChange(Number(event.target.value))}
              >
                {safeLimitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export default Table
