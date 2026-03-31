import ShippingList from 'modules/ShippingList'
import { useNavigate } from 'react-router-dom'

const ShippingPage = () => {
  const navigate = useNavigate()

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Dostawa</h2>
        <div className="sellerActions">
          <button
            type="button"
            className="sellerPrimaryButton"
            onClick={() => navigate('/shipping/new')}
          >
            Dodaj metode dostawy
          </button>
        </div>
      </div>

      <ShippingList />
    </section>
  )
}

export default ShippingPage
