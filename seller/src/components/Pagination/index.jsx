import './pagination.scss'

const Pagination = ({
  page = 1,
  totalPages = 1,
  total,
  limit,
  limitOptions = [10, 20, 50, 100],
  onPageChange,
  onLimitChange,
}) => {
  const safeLimitOptions = Array.isArray(limitOptions) && limitOptions.length > 0 ? limitOptions : [10, 20, 50, 100]
  const safePage = Math.max(1, Number(page) || 1)
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const safeTotal = Number.isFinite(Number(total)) ? Number(total) : null
  const safeLimit = Number(limit) || safeLimitOptions[0]

  if (typeof onPageChange !== 'function') {
    return null
  }

  return (
    <div className="pagination">
      <div className="paginationInfo">
        <span>{`Strona ${safePage} z ${safeTotalPages}`}</span>
        {safeTotal !== null && <span>{`Rekordy: ${safeTotal}`}</span>}
      </div>

      <div className="paginationControls">
        <button
          type="button"
          className="paginationButton"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Poprzednia
        </button>
        <button
          type="button"
          className="paginationButton"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Nastepna
        </button>
        <div className="paginationGoToPage">
          <select
            className="paginationPageSelect"
            value={safePage}
            onChange={(event) => onPageChange(Number(event.target.value))}
          >
            {Array.from({ length: safeTotalPages }, (_, index) => index + 1).map((nextPage) => (
              <option key={nextPage} value={nextPage}>
                {nextPage}
              </option>
            ))}
          </select>
        </div>
      </div>

      {typeof onLimitChange === 'function' && (
        <label className="paginationLimit">
          Na stronie:
          <select
            className="paginationLimitSelect"
            value={safeLimit}
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
  )
}

export default Pagination
