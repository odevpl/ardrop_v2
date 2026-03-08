import FetchWrapper from 'components/FetchWrapper'
import { getClients } from 'services/clients'
import ClientsList from './ClientsList'

const ClientsPage = () => {
  return (
    <FetchWrapper
      component={ClientsList}
      name="Klienci"
      connector={getClients}
      filters={{ page: 1, limit: 20, search: '' }}
    />
  )
}

export default ClientsPage
