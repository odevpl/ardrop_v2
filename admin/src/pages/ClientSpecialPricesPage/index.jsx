import ClientSpecialPricesModule from 'modules/ClientSpecialPrices'
import { useParams } from 'react-router-dom'

const ClientSpecialPricesPage = () => {
  const { clientId } = useParams()
  const parsedClientId = Number(clientId)

  if (!parsedClientId) {
    return <section className="adminPageSection">Nieprawidlowe ID klienta.</section>
  }

  return <ClientSpecialPricesModule clientId={parsedClientId} />
}

export default ClientSpecialPricesPage
