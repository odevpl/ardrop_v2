import Table from 'components/Table'
import { useNavigate } from 'react-router-dom'
import { getClientsTableConfig } from './table.config'

const ClientsList = ({ payload, filters, setFilters }) => {
  const navigate = useNavigate()
  const clients = payload?.data ?? []
  const pagination = payload?.meta?.pagination

  return (
    <section className="adminPageSection">
      <Table
        config={getClientsTableConfig()}
        data={clients}
        onRowClick={(row, options) => {
          const targetPath = `/clients/${row.id}`
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

export default ClientsList
