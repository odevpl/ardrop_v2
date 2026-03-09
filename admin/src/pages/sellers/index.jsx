import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import { useNavigate } from 'react-router-dom'
import { getSellers } from 'services/sellers'
import { getSellersTableConfig } from './table.config'

const Sellers = ({ payload, filters, setFilters }) => {
  const navigate = useNavigate()
  const sellers = payload?.data ?? []
  const pagination = payload?.meta?.pagination

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Sprzedawcy</h2>
        <div className="adminActions">
          <button type="button" className="adminPrimaryButton" onClick={() => navigate('/sellers/add')}>
            Dodaj sprzedawce
          </button>
        </div>
      </div>

      <Table
        config={getSellersTableConfig()}
        data={sellers}
        onRowClick={(row, options) => {
          const targetPath = `/sellers/${row.id}`
          if (options?.openInNewTab) {
            window.open(targetPath, '_blank', 'noopener,noreferrer')
            return
          }
          navigate(targetPath)
        }}
        searchValue={filters?.search || ''}
        onSearchChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
      />
    </section>
  )
}

const SellersWrapper = () => {
  return (
    <FetchWrapper
      component={Sellers}
      name="Sprzedawcy"
      connector={getSellers}
      filters={{ page: 1, limit: 20, search: '' }}
    />
  )
}

export default SellersWrapper
