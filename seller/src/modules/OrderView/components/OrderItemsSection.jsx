import { formatPrice, resolveThumbUrl } from './OrderView.utils'

const OrderItemsSection = ({ items }) => (
  <div className="orderViewCard">
    <h2>Pozycje</h2>
    <div className="orderItemsTableWrap">
      <table className="orderItemsTable">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Ilosc</th>
            <th>Netto</th>
            <th>Brutto</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const thumbUrl = resolveThumbUrl(item)

            return (
              <tr key={item.id}>
                <td>
                  <div className="orderItemProductCell">
                    <div className="orderItemThumbWrap">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={item?.productSnapshot?.name || 'Produkt'} />
                      ) : (
                        <div className="orderItemThumbPlaceholder">Brak</div>
                      )}
                    </div>
                    <div>
                      <p className="orderItemProductName">
                        {item?.productSnapshot?.name || `Produkt #${item.productId}`}
                      </p>
                      {item?.variantNameSnapshot ? (
                        <p className="orderItemProductVariant">{item.variantNameSnapshot}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.netPrice * item.quantity)}</td>
                <td>{formatPrice(item.grossPrice * item.quantity)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

export default OrderItemsSection
