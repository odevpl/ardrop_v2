import ProductList from 'modules/ProductList'
import { useNavigate } from 'react-router-dom'

const ProductsPage = () => {
  const navigate = useNavigate()

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Produkty</h2>
        <div className="sellerActions">
          <button type="button">Import</button>
          <button type="button">Export</button>
          <button
            type="button"
            className="sellerPrimaryButton"
            onClick={() => navigate('/products/add')}
          >
            Dodaj produkt
          </button>
        </div>
      </div>

      <ProductList />
    </section>
  )
}

export default ProductsPage
