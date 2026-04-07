import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from 'components/GlobalNotification/index.js'
import {
  deleteClientSpecialPricesByProduct,
  getClientSpecialPrices,
} from 'services/clients'
import SpecialPriceFormModal from './SpecialPriceFormModal'

const formatVariantPrice = (product, variant) => {
  if (product.priceType === 'percent') {
    return `${variant.name}: ${Number(variant.discountPercent || 0).toFixed(2)}%`
  }

  return `${variant.name}: ${Number(variant.specialNetPrice || 0).toFixed(2)} zl netto`
}

const ClientSpecialPricesModule = ({ clientId }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sellerId, setSellerId] = useState('')
  const [modalState, setModalState] = useState({ isOpen: false, product: null })

  const fetchRows = async (nextSellerId = sellerId) => {
    setIsLoading(true)
    const response = await getClientSpecialPrices({
      clientId,
      sellerId: nextSellerId || undefined,
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie pobrac cen specjalnych.')
      setIsLoading(false)
      return
    }

    setRows(response?.data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchRows()
  }, [clientId])

  const sellerOptions = useMemo(() => {
    const optionsMap = new Map()
    rows.forEach((row) => {
      if (!row.sellerId) return
      optionsMap.set(Number(row.sellerId), row.sellerName || `Seller #${row.sellerId}`)
    })
    return [...optionsMap.entries()].map(([value, label]) => ({ value, label }))
  }, [rows])

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Usunac wszystkie ceny specjalne tego produktu?')
    if (!confirmed) return

    const response = await deleteClientSpecialPricesByProduct({ clientId, productId })
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie usunac cen specjalnych.')
      return
    }

    notification.success('Usunieto ceny specjalne produktu.')
    await fetchRows(sellerId)
  }

  return (
    <section className="adminPageSection clientSpecialPrices">
      <div className="adminToolbar">
        <h2>Ceny specjalne klienta #{clientId}</h2>
        <div className="adminActions">
          <button
            type="button"
            className="adminPrimaryButton"
            onClick={() => setModalState({ isOpen: true, product: null })}
          >
            Dodaj cene specjalna
          </button>
          <button type="button" onClick={() => navigate(`/clients/${clientId}`)}>
            Wroc do klienta
          </button>
        </div>
      </div>

      <div className="clientSpecialPricesFilters">
        <label htmlFor="special-price-seller-filter">Sprzedawca</label>
        <select
          id="special-price-seller-filter"
          value={sellerId}
          onChange={async (event) => {
            const nextSellerId = event.target.value
            setSellerId(nextSellerId)
            await fetchRows(nextSellerId)
          }}
        >
          <option value="">Wszyscy</option>
          {sellerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Ladowanie...</p>
      ) : rows.length === 0 ? (
        <p>Brak cen specjalnych.</p>
      ) : (
        <div className="clientSpecialPricesTableWrap">
          <table className="clientSpecialPricesTable">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Warianty</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productId}>
                  <td>
                    <strong>{row.productName}</strong>
                    <div>{row.sellerName || `Seller #${row.sellerId}`}</div>
                  </td>
                  <td>
                    {row.variants.map((variant) => (
                      <div key={variant.variantId}>{formatVariantPrice(row, variant)}</div>
                    ))}
                  </td>
                  <td>
                    <div className="adminActions">
                      <button
                        type="button"
                        onClick={() => setModalState({ isOpen: true, product: row })}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="adminDangerButton"
                        onClick={() => handleDelete(row.productId)}
                      >
                        Usun
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalState.isOpen ? (
        <SpecialPriceFormModal
          clientId={clientId}
          editedProduct={modalState.product}
          onClose={() => setModalState({ isOpen: false, product: null })}
          onSaved={async () => {
            setModalState({ isOpen: false, product: null })
            await fetchRows(sellerId)
          }}
        />
      ) : null}
    </section>
  )
}

export default ClientSpecialPricesModule
