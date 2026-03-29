import './details-list.scss'

const renderItemValue = (item) => {
  if (typeof item?.renderValue === 'function') {
    return item.renderValue(item?.value, item)
  }

  if (item?.value === undefined || item?.value === null || item?.value === '') {
    return '-'
  }

  return item.value
}

const DetailsList = ({ title, action, items, emptyMessage = 'Brak danych', className = '' }) => {
  const safeItems = Array.isArray(items) ? items : []
  const rootClassName = ['detailsListCard', className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName}>
      {(title || action) && (
        <div className="detailsListToolbar">
          {title ? <h3 className="detailsListTitle">{title}</h3> : <span />}
          {action ? <div className="detailsListAction">{action}</div> : null}
        </div>
      )}

      <div className="detailsListBody">
        {safeItems.length === 0 ? (
          <div className="detailsListEmpty">{emptyMessage}</div>
        ) : (
          safeItems.map((item, index) => {
            const itemKey = item?.key ?? item?.label ?? index

            return (
              <div key={itemKey} className="detailsListRow">
                <div className="detailsListLabel">{item?.label ?? '-'}</div>
                <div className="detailsListValue">{renderItemValue(item)}</div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default DetailsList
