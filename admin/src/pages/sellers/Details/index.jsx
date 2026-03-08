import SellerView from 'modules/SellerView'
import { useParams } from 'react-router-dom'

const SellerDetailsPage = () => {
  const { id } = useParams()
  const parsedId = Number(id)
  const isInvalidId = Number.isNaN(parsedId) || parsedId <= 0

  if (isInvalidId) {
    return <section className="adminPageSection">Nieprawidlowe ID sprzedawcy.</section>
  }

  return <SellerView id={parsedId} />
}

export default SellerDetailsPage
