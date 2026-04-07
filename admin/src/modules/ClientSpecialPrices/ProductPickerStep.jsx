import { useEffect, useState } from 'react'
import { getProducts } from 'services/products'

const ProductPickerStep = ({ onSelectProduct }) => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [sellerId, setSellerId] = useState('')

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      const response = await getProducts({
        search,
        sellerId: sellerId || undefined,
        page: 1,
        limit: 20,
        status: 'active',
      })

      if (response?.status && response.status >= 400) {
        setProducts([])
        return
      }

      setProducts(response?.data || [])
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search, sellerId])

  const sellerOptions = products.reduce((acc, product) => {
    if (!product.sellerId || acc.some((item) => Number(item.value) === Number(product.sellerId))) {
      return acc
    }

    acc.push({
      value: Number(product.sellerId),
      label: product.sellerCompanyName || `Seller #${product.sellerId}`,
    })
    return acc
  }, [])

  return (
    <div>
      <div className="clientSpecialPricesPickerFilters">
        <input
          type="text"
          value={search}
          placeholder="Szukaj produktu..."
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={sellerId} onChange={(event) => setSellerId(event.target.value)}>
          <option value="">Wszyscy sprzedawcy</option>
          {sellerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="clientSpecialPricesTableWrap">
        <table className="clientSpecialPricesTable">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Sprzedawca</th>
              <th>Warianty</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="clientSpecialPricesPickerRow"
                onClick={() => onSelectProduct(product)}
              >
                <td>{product.name}</td>
                <td>{product.sellerCompanyName || `Seller #${product.sellerId}`}</td>
                <td>{Array.isArray(product.variants) ? product.variants.length : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductPickerStep
