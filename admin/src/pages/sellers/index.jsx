import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import { getSellers } from 'services/sellers'
import { getSellersTableConfig } from './table.config'

const Sellers = ({ payload, filters, setFilters }) => {
  const sellers = payload?.data ?? []
  const pagination = payload?.meta?.pagination

  return (
    <Table
      config={getSellersTableConfig()}
      data={sellers}
      searchValue={filters?.search || ''}
      onSearchChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
      pagination={pagination}
      onPageChange={(page) => setFilters({ ...filters, page })}
      onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
    />
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
