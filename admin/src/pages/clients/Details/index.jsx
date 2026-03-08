import ClientView from 'modules/ClientView'
import { useParams } from 'react-router-dom'

const ClientDetailsPage = () => {
  const { id } = useParams()
  const parsedId = Number(id)
  const isInvalidId = Number.isNaN(parsedId) || parsedId <= 0

  if (isInvalidId) {
    return <section className="adminPageSection">Nieprawidlowe ID klienta.</section>
  }

  return <ClientView id={parsedId} />
}

export default ClientDetailsPage
