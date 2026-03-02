import ProductList from '../../modules/ProductList'

const OrdersPage = () => {
  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Produkty</h2>
      </div>

      <ProductList />
    </section>
  )
}

export default OrdersPage
